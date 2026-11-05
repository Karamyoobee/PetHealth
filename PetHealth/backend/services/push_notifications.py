import hashlib
import time
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import click
import requests
from flask import current_app
from pymongo import ReturnDocument

from database import mongo
from services.reminders import expand_reminders, linked_medication, reminder_time, reminder_timezone

EXPO_URL = "https://exp.host/--/api/v2/push"


def utc_now():
    return datetime.now(timezone.utc)


def aware(value):
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value


def expo_request(path, payload):
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    access_token = current_app.config.get("EXPO_ACCESS_TOKEN")
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    response = requests.post(f"{EXPO_URL}/{path}", json=payload, headers=headers, timeout=15)
    response.raise_for_status()
    return response.json()


def valid_device(device):
    # Stop sending to registrations that were signed out or invalidated by a password reset.
    current = mongo.db.notification_devices.find_one({"_id": device["_id"], "binding": device["binding"], "active": True})
    credentials = mongo.db.auth_credentials.find_one({"_id": device["userId"]}) or {}
    if not current or credentials.get("authVersion", 0) != device.get("authVersion", 0):
        return False
    return mongo.db.users.find_one({"userId": device["userId"]}) is not None


def valid_reminder(reminder):
    # Check again before sending in case the reminder was changed or completed.
    current = mongo.db.reminders.find_one({"_id": reminder["_id"], "userId": reminder["userId"]})
    if not current or current.get("enabled") is False or current.get("dismissedAt") or current["scheduledFor"] != reminder["scheduledFor"]:
        return False
    if not mongo.db.pets.find_one({"_id": current["petId"], "userId": current["userId"]}):
        return False
    if current.get("seriesId"):
        root = mongo.db.reminders.find_one({"_id": current["seriesId"]})
        if not root or root.get("enabled") is False:
            return False
    if current.get("type") == "medication":
        medication = linked_medication(current)
        if not medication or medication.get("reminderEnabled") is False:
            return False
        day = reminder_time(current.get("occurrenceAt") or current["scheduledFor"], current).astimezone(reminder_timezone(current)).date().isoformat()
        if medication.get("endDate") and day > medication["endDate"][:10]:
            return False
    return True


def mark_error(job, code, retry=False):
    now = utc_now()
    mongo.db.notification_deliveries.update_one({"_id": job["_id"], "leaseId": job["leaseId"]}, {"$set": {
        "status": "retry" if retry and now < aware(job["deadline"]) else "failed",
        "errorCode": code, "nextAttemptAt": now + timedelta(seconds=min(30 * 2 ** min(job["attempts"], 3), 180)),
    }})
    current_app.logger.warning("Push delivery issue: %s", code)


def send_alert(device, reminder, lead_minutes, fire_at):
    # Claim this device's alert before sending so repeated worker checks skip it.
    now = utc_now()
    if now > fire_at + timedelta(minutes=5):
        return
    key = hashlib.sha256(f"{device['_id']}:{device['binding']}:{reminder['_id']}:{reminder['scheduledFor']}:{lead_minutes}".encode()).hexdigest()
    collection = mongo.db.notification_deliveries
    collection.update_one({"_id": key}, {"$setOnInsert": {
        "deviceId": device["_id"], "binding": device["binding"], "status": "pending", "attempts": 0,
        "reminderId": reminder["_id"], "scheduledFor": reminder["scheduledFor"], "leadMinutes": lead_minutes,
        "deadline": fire_at + timedelta(minutes=5), "nextAttemptAt": now, "purgeAt": now + timedelta(days=7),
    }}, upsert=True)
    lease_id = str(uuid4())
    job = collection.find_one_and_update({"_id": key, "$or": [
        {"status": {"$in": ["pending", "retry"]}, "nextAttemptAt": {"$lte": now}},
        {"status": "sending", "leaseUntil": {"$lt": now}},
    ]}, {"$set": {"status": "sending", "leaseId": lease_id, "leaseUntil": now + timedelta(minutes=2)}, "$inc": {"attempts": 1}}, return_document=ReturnDocument.AFTER)
    if not job:
        return
    if not valid_device(device) or not valid_reminder(reminder):
        collection.update_one({"_id": key, "leaseId": lease_id}, {"$set": {"status": "cancelled"}})
        return
    body = reminder["title"][:700]
    if lead_minutes:
        body += f" - due in {lead_minutes // 60} {'hour' if lead_minutes == 60 else 'hours'}."
    payload = {
        "to": device["token"], "title": "Pet Health reminder", "body": body, "sound": "default",
        "channelId": "pet-health-reminders", "priority": "high", "ttl": 300,
        "data": {"petHealthReminder": True, "userId": device["userId"], "reminderId": str(reminder["_id"]),
                 "petId": str(reminder["petId"]), "leadMinutes": lead_minutes},
    }
    try:
        ticket = expo_request("send", payload).get("data", {})
        if not isinstance(ticket, dict):
            raise ValueError("Invalid push response")
        if ticket.get("status") == "ok" and ticket.get("id"):
            collection.update_one({"_id": key, "leaseId": lease_id}, {"$set": {
                "status": "accepted", "ticketId": ticket["id"], "acceptedAt": now,
                "receiptCheckAt": now + timedelta(minutes=15),
            }})
        else:
            code = ticket.get("details", {}).get("error", "PushRejected")
            if code == "DeviceNotRegistered":
                mongo.db.notification_devices.update_one({"_id": device["_id"], "binding": device["binding"]}, {"$set": {"active": False}})
            mark_error(job, code, retry=code == "MessageRateExceeded")
    except (requests.RequestException, ValueError, TypeError):
        mark_error(job, "PushServiceUnavailable", retry=True)


def check_receipts():
    # An accepted message can still fail later, so check the provider's receipts.
    now = utc_now()
    jobs = list(mongo.db.notification_deliveries.find({"status": "accepted", "receiptCheckAt": {"$lte": now}}).limit(100))
    if not jobs:
        return
    try:
        receipts = expo_request("getReceipts", {"ids": [job["ticketId"] for job in jobs]}).get("data", {})
        if not isinstance(receipts, dict):
            return
    except (requests.RequestException, ValueError):
        current_app.logger.warning("Could not check push receipts; will retry")
        return
    for job in jobs:
        receipt = receipts.get(job["ticketId"])
        if not receipt:
            expired = now - aware(job["acceptedAt"]) > timedelta(hours=23)
            mongo.db.notification_deliveries.update_one({"_id": job["_id"]}, {"$set": {
                "status": "receipt-expired" if expired else "accepted", "receiptCheckAt": now + timedelta(minutes=15),
            }})
            continue
        code = receipt.get("details", {}).get("error")
        mongo.db.notification_deliveries.update_one({"_id": job["_id"]}, {"$set": {
            "status": "confirmed" if receipt.get("status") == "ok" else "failed", "errorCode": code,
        }})
        if code == "DeviceNotRegistered":
            mongo.db.notification_devices.update_one({"_id": job["deviceId"], "binding": job["binding"]}, {"$set": {"active": False}})
        elif code:
            current_app.logger.warning("Push receipt issue: %s", code)


def run_push_tick():
    # Prepare schedules on the server even when the phone app is closed.
    from routes.notifications import push_configured

    if not push_configured():
        raise ValueError("Configure EXPO_PUSH_ENABLED and EXPO_PROJECT_ID before starting the reminder worker")
    now = utc_now()
    check_receipts()
    expanded = {}
    for device in mongo.db.notification_devices.find({"active": True}):
        if not valid_device(device):
            mongo.db.notification_devices.update_one({"_id": device["_id"], "binding": device["binding"]}, {"$set": {"active": False}})
            continue
        user_id = device["userId"]
        if user_id not in expanded:
            pet_ids = [pet["_id"] for pet in mongo.db.pets.find({"userId": user_id})]
            try:
                expanded[user_id] = expand_reminders({"userId": user_id, "petId": {"$in": pet_ids}}, device)
            except ValueError:
                current_app.logger.warning("Could not prepare an account's reminder schedule; other accounts will still be checked")
                expanded[user_id] = []
        for reminder in expanded[user_id]:
            if reminder.get("enabled") is False or reminder.get("dismissedAt"):
                continue
            try:
                scheduled = reminder_time(reminder["scheduledFor"], reminder).astimezone(timezone.utc)
            except ValueError:
                continue
            for minutes in ([0] if reminder.get("snoozedUntil") else [240, 60, 0]):
                fire_at = scheduled - timedelta(minutes=minutes)
                if max(now - timedelta(minutes=5), aware(device["activeSince"])) <= fire_at <= now:
                    send_alert(device, reminder, minutes, fire_at)


def register_push_command(app):
    @app.cli.command("send-reminders")
    @click.option("--watch", is_flag=True, help="Keep checking reminder schedules until stopped.")
    @click.option("--interval", default=30, type=click.IntRange(10, 300), show_default=True)
    def send_reminders(watch, interval):
        from routes.notifications import push_configured

        if not push_configured():
            raise click.ClickException("Configure EXPO_PUSH_ENABLED=true and EXPO_PROJECT_ID first")
        if watch:
            click.echo(f"Reminder worker started. Checking every {interval} seconds. Press Ctrl+C to stop.")
        while True:
            try:
                run_push_tick()
            except Exception:
                if not watch:
                    raise
                app.logger.exception("Reminder worker check failed; retrying next interval")
            if not watch:
                return
            time.sleep(interval)
