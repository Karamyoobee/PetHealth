import calendar
import hashlib
import re
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from bson import ObjectId
from bson.errors import InvalidId
from pymongo import ReturnDocument

from database import mongo


def utc_now():
    return datetime.now(timezone.utc)


def reminder_timezone(data):
    # Use the named timezone when available so clock changes are handled properly.
    name = data.get("timezone")
    if name:
        try:
            return ZoneInfo(name)
        except (ZoneInfoNotFoundError, ValueError, TypeError):
            raise ValueError("Choose a valid reminder timezone")
    try:
        offset = int(data.get("timezoneOffset", 0))
        if not -840 <= offset <= 840:
            raise ValueError()
        return timezone(timedelta(minutes=-offset))
    except (ValueError, TypeError):
        raise ValueError("Choose a valid reminder timezone")


def reminder_time(value, data):
    # Dates without an offset use the reminder's saved timezone.
    try:
        parsed = value if isinstance(value, datetime) else datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=reminder_timezone(data)) if parsed.tzinfo is None else parsed
    except (AttributeError, TypeError, ValueError):
        raise ValueError("Choose a valid reminder date and time")


def iso_time(value):
    return value.astimezone(timezone.utc).isoformat()


def linked_medication(reminder):
    query = {"petId": reminder["petId"], "userId": reminder["userId"]}
    if reminder.get("medicationId"):
        try:
            query["_id"] = ObjectId(reminder["medicationId"])
        except (InvalidId, ValueError, TypeError):
            return None
        return mongo.db.medications.find_one(query)

    # Older reminders stored only the displayed medication title.
    matches = []
    for medication in mongo.db.medications.find(query):
        title = f"{medication.get('name', '')} {'- ' + medication['dosage'] if medication.get('dosage') else ''}".strip()
        if title == reminder.get("title"):
            matches.append(medication)
    if len(matches) == 1:
        return matches[0]
    return None


def prepare_reminder(data, pet_id, user_id):
    # Check the details and save the first scheduled time as the repeat anchor.
    if not isinstance(data.get("title"), str) or not data["title"].strip():
        raise ValueError("A reminder title is required")
    if data.get("type") not in ("medication", "weight", "symptom", "checkup", "refill", "follow-up", "custom"):
        raise ValueError("Choose a valid reminder type")
    if data.get("repeat", "none") not in ("none", "daily", "weekly", "monthly"):
        raise ValueError("Choose a valid reminder repeat option")
    reminder_timezone(data)
    scheduled = iso_time(reminder_time(data.get("scheduledFor"), data))
    now = utc_now()
    reminder = {
        "_id": ObjectId(), "petId": pet_id, "userId": user_id,
        "title": data["title"].strip(), "type": data["type"],
        "scheduledFor": scheduled, "occurrenceAt": scheduled,
        "repeat": data.get("repeat", "none"), "enabled": data.get("enabled", True) is not False,
        "timezone": data.get("timezone"), "timezoneOffset": data.get("timezoneOffset", 0),
        "createdAt": now, "updatedAt": now,
    }
    if reminder["type"] == "medication":
        reminder["medicationId"] = data.get("medicationId")
        medication = linked_medication(reminder)
        if not medication:
            raise ValueError("Choose the medication for this reminder")
        reminder["medicationId"] = medication["_id"]
        reminder["endsOn"] = medication.get("endDate")
    return reminder


def validate_medication_times(data):
    # Require a separate valid time for each daily dose.
    times = data.get("reminderTimes")
    count = {"Once a day": 1, "Twice a day": 2, "Three times a day": 3}.get(data.get("schedule"))
    if not count or not isinstance(times, list) or len(times) != count:
        raise ValueError("Choose one time for each daily dose")
    if any(not isinstance(value, str) or not re.fullmatch(r"(?:[01]\d|2[0-3]):[0-5]\d", value) for value in times):
        raise ValueError("Choose valid medication times")
    if len(set(times)) != count:
        raise ValueError("Choose a different time for each daily dose")
    start = datetime.strptime(data.get("startDate", ""), "%Y-%m-%d").date()
    end = datetime.strptime(data.get("endDate", ""), "%Y-%m-%d").date()
    if end < start:
        raise ValueError("End date must be on or after start date")
    reminder_timezone(data)


def ensure_medication_reminders(query):
    # Use a stable ID for each dose time so repeat checks do not add duplicates.
    for medication in mongo.db.medications.find({**query, "reminderEnabled": True}):
        times = medication.get("reminderTimes")
        if not times:
            continue
        for index, value in enumerate(times):
            identifier = ObjectId(hashlib.sha256(f"medication:{medication['_id']}:{value}".encode()).digest()[:12])
            if mongo.db.reminders.find_one({"_id": identifier}):
                continue
            title = f"{medication['name']} {'- ' + medication['dosage'] if medication.get('dosage') else ''}".strip()
            if len(times) > 1:
                title += f" (dose {index + 1} of {len(times)})"
            reminder = prepare_reminder({
                "type": "medication", "title": title, "medicationId": medication["_id"],
                "scheduledFor": f"{medication['startDate']}T{value}:00", "repeat": "daily",
                "timezone": medication.get("timezone"), "timezoneOffset": medication.get("timezoneOffset", 0),
            }, medication["petId"], medication["userId"])
            reminder["_id"] = identifier
            mongo.db.reminders.update_one({"_id": identifier}, {"$setOnInsert": reminder}, upsert=True)


def expand_reminders(query, context):
    # Add missing repeat dates without changing reminders already completed or snoozed.
    ensure_medication_reminders(query)
    now = utc_now()
    roots = list(mongo.db.reminders.find(query))
    for root in roots:
        if root.get("dosePending"):
            record_completed_dose(root)
        if root.get("enabled") is False or root.get("repeat") not in ("daily", "weekly", "monthly"):
            continue
        if root.get("seriesId") and root["seriesId"] != root["_id"]:
            continue
        updates = {}
        if not root.get("timezone") and "timezoneOffset" not in root:
            updates.update({"timezone": context.get("timezone"), "timezoneOffset": context.get("timezoneOffset", 0)})
            root.update(updates)
        try:
            zone = reminder_timezone(root)
            anchor = reminder_time(root.get("occurrenceAt") or root["scheduledFor"], root).astimezone(zone)
        except ValueError:
            continue
        if not root.get("occurrenceAt"):
            updates["occurrenceAt"] = iso_time(anchor)
        if root.get("type") == "medication":
            medication = linked_medication(root)
            if medication:
                updates.update({"medicationId": medication["_id"], "endsOn": medication.get("endDate")})
        if updates:
            mongo.db.reminders.update_one({"_id": root["_id"]}, {"$set": updates})
            root.update(updates)
        local_now = now.astimezone(zone)
        end = local_now + timedelta(days=30)
        interval = 7 if root["repeat"] == "weekly" else 1
        index = max(0, (local_now.date() - anchor.date()).days // interval)
        if root["repeat"] == "monthly":
            index = max(0, (local_now.year - anchor.year) * 12 + local_now.month - anchor.month)
        while True:
            if root["repeat"] == "monthly":
                year, month = divmod(anchor.year * 12 + anchor.month - 1 + index, 12)
                occurrence = anchor.replace(year=year, month=month + 1, day=min(anchor.day, calendar.monthrange(year, month + 1)[1]))
            else:
                occurrence = anchor + timedelta(days=index * interval)
            index += 1
            if occurrence > end:
                break
            if root.get("endsOn") and occurrence.date().isoformat() > str(root["endsOn"])[:10]:
                break
            if occurrence.date() < local_now.date() or occurrence == anchor:
                continue
            occurrence_at = iso_time(occurrence)
            identifier = ObjectId(hashlib.sha256(f"{root['_id']}:{occurrence_at}".encode()).digest()[:12])
            saved = {field: root[field] for field in (
                "petId", "userId", "title", "type", "repeat", "enabled", "timezone", "timezoneOffset", "medicationId", "endsOn",
            ) if field in root}
            saved.update({
                "_id": identifier, "seriesId": root["_id"], "scheduledFor": occurrence_at,
                "occurrenceAt": occurrence_at, "createdAt": now, "updatedAt": now,
            })
            mongo.db.reminders.update_one({"_id": identifier}, {"$setOnInsert": saved}, upsert=True)
    return list(mongo.db.reminders.find(query).sort("scheduledFor", 1))


def record_completed_dose(reminder):
    # Use the reminder ID to avoid recording the same taken dose twice.
    medication = linked_medication(reminder)
    if not medication:
        raise ValueError("The medication for a completed reminder could not be found")
    mongo.db.medications.update_one({"_id": medication["_id"], "userId": reminder["userId"]}, {"$addToSet": {
        "doseLog": {"status": "taken", "takenAt": reminder["completedAt"], "reminderId": str(reminder["_id"])},
    }})
    mongo.db.reminders.update_one({"_id": reminder["_id"]}, {"$set": {"dosePending": False}})


def reminder_action(reminder, action, snooze_minutes=60, snooze_until=None):
    # Keep read, snooze and completion updates in one place.
    query = {"_id": reminder["_id"], "userId": reminder["userId"]}
    now = utc_now().isoformat()
    if reminder.get("enabled") is False:
        raise ValueError("This reminder is disabled")
    if action == "read":
        if not reminder.get("readAt"):
            mongo.db.reminders.update_one(query, {"$set": {"readAt": now}})
    elif action == "snooze":
        if reminder.get("dismissedAt"):
            raise ValueError("This reminder is already in History")
        if snooze_until is not None:
            # The phone sends the chosen local time with its timezone offset.
            try:
                selected = datetime.fromisoformat(snooze_until.replace("Z", "+00:00"))
                if selected.tzinfo is None:
                    raise ValueError()
                selected = selected.astimezone(timezone.utc)
            except (AttributeError, TypeError, ValueError, OverflowError):
                raise ValueError("Choose a valid snooze date and time with a timezone")
            if selected <= utc_now():
                raise ValueError("Choose a snooze date and time in the future")
            until = iso_time(selected)
        else:
            if isinstance(snooze_minutes, bool) or not isinstance(snooze_minutes, int) or not 1 <= snooze_minutes <= 1440:
                raise ValueError("Enter a snooze duration between 1 and 1440 minutes (24 hours)")
            until = iso_time(utc_now() + timedelta(minutes=snooze_minutes))
        # Keep occurrenceAt unchanged so later daily doses keep their usual time.
        updated = mongo.db.reminders.update_one({**query, "dismissedAt": None}, {"$set": {
            "scheduledFor": until, "snoozedUntil": until, "readAt": now, "updatedAt": now,
        }})
        if not updated.matched_count:
            raise ValueError("This reminder has already changed. Refresh and try again.")
    elif action == "complete":
        if reminder.get("dismissedAt") and not reminder.get("completedAt"):
            raise ValueError("This reminder has already been dismissed")
        medication = linked_medication(reminder) if reminder.get("type") == "medication" else None
        if reminder.get("type") == "medication" and not medication:
            raise ValueError("This reminder cannot be matched to a medication. Recreate its medication reminder before recording a dose.")
        if not reminder.get("completedAt"):
            reminder = mongo.db.reminders.find_one_and_update({**query, "dismissedAt": None}, {"$set": {
                "completedAt": now, "dismissedAt": now, "readAt": now, "updatedAt": now, "dosePending": bool(medication),
            }}, return_document=ReturnDocument.AFTER) or mongo.db.reminders.find_one(query)
        if not reminder.get("completedAt"):
            raise ValueError("This reminder has already changed. Refresh and try again.")
        if medication:
            record_completed_dose(reminder)
    else:
        raise ValueError("Choose a valid reminder action")
    return mongo.db.reminders.find_one(query)
