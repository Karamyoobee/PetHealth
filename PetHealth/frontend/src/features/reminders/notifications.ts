import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { api } from "../../api/client";
import { registerPushInstallation, unregisterPushInstallation } from "./pushRegistration";

let activeUser: string | null = null;
let permissionRequested = false;
let pending: Promise<unknown> = Promise.resolve();

function notificationData(content: Notifications.NotificationContent): Record<string, unknown> | null {
  // Some Android notifications arrive with their data stored as JSON text.
  const raw = content as Notifications.NotificationContent & { dataString?: string };
  if (typeof raw.dataString === "string") {
    try {
      const data = JSON.parse(raw.dataString);
      return data && typeof data === "object" && !Array.isArray(data) ? data : null;
    } catch {
      return null;
    }
  }
  return raw.data ?? {};
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notificationData(notification.request.content);
    const allowed = Boolean(data && (!data.petHealthReminder || (activeUser && data.userId === activeUser)));
    return { shouldShowAlert: allowed, shouldPlaySound: allowed, shouldSetBadge: false };
  },
});

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const next = pending.then(work, work);
  pending = next.catch(() => undefined);
  return next;
}

export function setReminderNotificationUser(userId: string | null) {
  activeUser = userId;
}

export function clearReminderNotifications() {
  activeUser = null;
  return enqueue(async () => {
    if (Platform.OS === "web") return;
    await unregisterPushInstallation();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      if (notificationData(item.content)?.petHealthReminder) await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const item of presented) {
      if (notificationData(item.request.content)?.petHealthReminder) await Notifications.dismissNotificationAsync(item.request.identifier);
    }
  });
}

export function syncReminderNotifications(userId: string): Promise<string | null> {
  // Refresh this account's phone alerts after reminders or sign-in details change.
  return enqueue(async () => {
    if (activeUser !== userId || Platform.OS === "web") return null;
    const reminders = await api.listAllReminders();
    const pushConfig = await api.getNotificationConfig();
    if (activeUser !== userId) return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("pet-health-reminders", {
        name: "Pet Health reminders", importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain && !permissionRequested && reminders.some((item) => item.enabled !== false && !item.dismissedAt)) {
      permissionRequested = true;
      permission = await Notifications.requestPermissionsAsync();
    }
    const pushEnabled = permission.granted && pushConfig.enabled && Boolean(pushConfig.projectId);
    if (!pushEnabled) await unregisterPushInstallation();
    const active = reminders.filter((item) => item.enabled !== false && !item.dismissedAt);
    const upcoming = active.flatMap((reminder) => {
      const scheduled = new Date(reminder.scheduledFor).getTime();
      const offsets = reminder.snoozedUntil ? [0] : [240, 60, 0];
      return offsets.map((leadMinutes) => ({ reminder, leadMinutes, fireAt: scheduled - leadMinutes * 60000 }));
    }).filter((item) => Number.isFinite(item.fireAt) && item.fireAt > Date.now())
      .sort((a, b) => a.fireAt - b.fireAt);
    const desired = new Map(upcoming.slice(0, 50).map((item) => {
      const { reminder, leadMinutes } = item;
      const suffix = leadMinutes ? `:before:${leadMinutes}` : "";
      return [`pet-health:${userId}:${reminder.id}:${reminder.scheduledFor}${suffix}`, item];
    }));
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of existing) {
      if (activeUser !== userId) return null;
      if (!notificationData(item.content)?.petHealthReminder) continue;
      if (pushEnabled) continue;
      if (permission.granted && desired.has(item.identifier)) desired.delete(item.identifier);
      else await Notifications.cancelScheduledNotificationAsync(item.identifier);
    }
    const activeIds = new Set(active.map((item) => item.id));
    for (const item of await Notifications.getPresentedNotificationsAsync()) {
      if (activeUser !== userId) return null;
      const data = notificationData(item.request.content);
      if (data?.petHealthReminder && (data.userId !== userId || !activeIds.has(String(data.reminderId)))) {
        await Notifications.dismissNotificationAsync(item.request.identifier);
      }
    }
    if (!permission.granted) return "Notifications are off. Enable Pet Health notifications in your phone settings.";
    if (pushEnabled && pushConfig.projectId) {
      try {
        await registerPushInstallation(pushConfig.projectId, async () => {
          for (const item of await Notifications.getAllScheduledNotificationsAsync()) {
            if (notificationData(item.content)?.petHealthReminder) await Notifications.cancelScheduledNotificationAsync(item.identifier);
          }
        }, () => activeUser === userId);
      } catch {
        return "Could not refresh phone notifications. Check your connection and reopen the app.";
      }
      return null;
    }
    for (const [identifier, { reminder, leadMinutes, fireAt }] of desired) {
      if (activeUser !== userId) return null;
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: "Pet Health reminder",
          body: leadMinutes ? `${reminder.title} — due in ${leadMinutes / 60} ${leadMinutes === 60 ? "hour" : "hours"}.` : reminder.title,
          sound: "default",
          data: { petHealthReminder: true, userId, reminderId: reminder.id, petId: reminder.petId, leadMinutes },
        },
        trigger: { date: new Date(fireAt), channelId: "pet-health-reminders" },
      });
    }
    return null;
  });
}

export function listenForReminderPress(userId: string, onPress: () => void) {
  if (Platform.OS === "web") return () => {};
  const receive = (response: Notifications.NotificationResponse | null) => {
    const data = response ? notificationData(response.notification.request.content) : null;
    if (activeUser === userId && data?.petHealthReminder && data.userId === userId) {
      onPress();
      void Notifications.clearLastNotificationResponseAsync().catch(() => undefined);
    }
  };
  const subscription = Notifications.addNotificationResponseReceivedListener(receive);
  void Notifications.getLastNotificationResponseAsync().then(receive).catch(() => undefined);
  return () => subscription.remove();
}
