import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "../../api/client";
import BottomNavBar from "../../components/BottomNavBar";
import PetSelector from "../../components/PetSelector";
import type { Pet, Reminder } from "../../types";

type Props = {
  onBack?: () => void;
};

function nowIso() {
  return new Date().toISOString();
}

function addHoursIso(hours: number) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}

function formatReminderTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "No time set";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function reminderAccent(type: Reminder["type"]) {
  if (type === "medication") return "#F59E42";
  if (type === "checkup" || type === "follow-up") return "#00796B";
  if (type === "refill") return "#EF4444";
  return "#238575";
}

export function ReminderForm({ onBack }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadPets = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const savedPets = await api.listCurrentUserPets();
      setPets(savedPets);
      const nextPetId = selectedPetId || savedPets[0]?.id || "";
      setSelectedPetId(nextPetId);

      if (!nextPetId) {
        setReminders([]);
        setMessage("Add a pet before creating reminders.");
        return;
      }
      setReminders(await api.listReminders(nextPetId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load reminders.");
    } finally {
      setLoading(false);
    }
  }, [selectedPetId]);

  const loadReminders = useCallback(async (petId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      setReminders(await api.listReminders(petId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load reminders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const selectPet = (petId: string) => {
    setSelectedPetId(petId);
    loadReminders(petId);
  };

  const activeReminders = useMemo(() => reminders.filter((reminder) => !reminder.dismissedAt), [reminders]);
  const historyReminders = useMemo(() => reminders.filter((reminder) => reminder.dismissedAt), [reminders]);

  const updateLocalReminder = (updatedReminder: Reminder) => {
    setReminders((current) =>
      current.map((reminder) => (reminder.id === updatedReminder.id ? updatedReminder : reminder)),
    );
  };

  const markDone = async (reminder: Reminder) => {
    const updatedReminder = await api.updateReminder(reminder.id, {
      completedAt: nowIso(),
      dismissedAt: nowIso(),
    });
    updateLocalReminder(updatedReminder);
  };

  const snooze = async (reminder: Reminder) => {
    const snoozedUntil = addHoursIso(1);
    const updatedReminder = await api.updateReminder(reminder.id, {
      scheduledFor: snoozedUntil,
      snoozedUntil,
    });
    updateLocalReminder(updatedReminder);
  };

  const dismissAllRead = async () => {
    const dismissedAt = nowIso();
    const updatedReminders = await Promise.all(
      activeReminders.map((reminder) =>
        api.updateReminder(reminder.id, {
          dismissedAt,
        }),
      ),
    );

    setReminders((current) =>
      current.map((reminder) => updatedReminders.find((updated) => updated.id === reminder.id) ?? reminder),
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F766E" />
        </TouchableOpacity>
        <Text style={styles.brand}>Pet Health</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reminders</Text>
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={selectPet} />

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#00796B" />
          </View>
        ) : activeReminders.length > 0 ? (
          activeReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onDone={() => markDone(reminder)}
              onSnooze={() => snooze(reminder)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={32} color="#00796B" />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptyText}>
              {message ?? "Medication, refill, and vet visit reminders will appear here after you create them."}
            </Text>
          </View>
        )}

        <TouchableOpacity
          disabled={activeReminders.length === 0}
          style={[styles.dismissButton, activeReminders.length === 0 && styles.disabledButton]}
          onPress={dismissAllRead}
        >
          <Text style={styles.dismissText}>Dismiss All Read</Text>
        </TouchableOpacity>

        {historyReminders.length > 0 ? (
          <>
            <Text style={styles.historyTitle}>History</Text>
            {historyReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} isHistory />
            ))}
          </>
        ) : null}
      </ScrollView>

      <BottomNavBar active="alerts" onHomePress={onBack} />
    </View>
  );
}

export default ReminderForm;

function ReminderCard({
  reminder,
  isHistory = false,
  onDone,
  onSnooze,
}: {
  reminder: Reminder;
  isHistory?: boolean;
  onDone?: () => void;
  onSnooze?: () => void;
}) {
  const isOverdue = !isHistory && new Date(reminder.scheduledFor).getTime() < Date.now();
  const accentColor = isHistory ? "#9CA3AF" : reminderAccent(reminder.type);
  const subtitle = `${reminder.type === "medication" ? "Medication" : reminder.type} - ${formatReminderTime(reminder.scheduledFor)}`;

  return (
    <View style={styles.reminderCard}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <View style={styles.cardContent}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderMeta}>{subtitle}</Text>
        {isHistory ? (
          <Text style={styles.historyMeta}>
            {reminder.completedAt ? "Completed" : "Dismissed"} {formatReminderTime(reminder.dismissedAt ?? "")}
          </Text>
        ) : null}
      </View>
      {!isHistory ? (
        isOverdue ? (
          <View style={styles.overduePill}>
            <Text style={styles.overdueText}>Overdue</Text>
          </View>
        ) : reminder.type === "medication" ? (
          <TouchableOpacity style={styles.doneButton} onPress={onDone}>
            <Text style={styles.doneText}>Mark Done</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.snoozeButton} onPress={onSnooze}>
            <Text style={styles.snoozeText}>Snooze</Text>
          </TouchableOpacity>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F4",
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E5E1DB",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    left: 16,
    position: "absolute",
    width: 24,
  },
  brand: {
    color: "#00796B",
    fontSize: 16,
    fontWeight: "800",
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
    padding: 24,
  },
  petSelect: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  petSelectText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  placeholderText: {
    color: "#3E4946",
  },
  optionMenu: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 18,
    overflow: "hidden",
  },
  optionItem: {
    borderBottomColor: "#ECE7DF",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  optionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyText: {
    color: "#3E4946",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  reminderCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 9,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 94,
    marginBottom: 12,
    overflow: "hidden",
    paddingRight: 12,
  },
  accentBar: {
    alignSelf: "stretch",
    width: 5,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  reminderTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
  },
  reminderMeta: {
    color: "#3E4946",
    fontSize: 12,
    marginTop: 2,
  },
  historyMeta: {
    color: "#3E4946",
    fontSize: 11,
    marginTop: 8,
  },
  doneButton: {
    alignItems: "center",
    backgroundColor: "#00796B",
    borderRadius: 999,
    minWidth: 76,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  snoozeButton: {
    alignItems: "center",
    borderColor: "#9CA3AF",
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 68,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  snoozeText: {
    color: "#3E4946",
    fontSize: 11,
    fontWeight: "800",
  },
  overduePill: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  overdueText: {
    color: "#DC2626",
    fontSize: 11,
    fontWeight: "800",
  },
  dismissButton: {
    alignItems: "center",
    backgroundColor: "#FAF8F4",
    borderColor: "#6B7280",
    borderRadius: 7,
    borderWidth: 1,
    height: 52,
    justifyContent: "center",
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.55,
  },
  dismissText: {
    color: "#3E4946",
    fontSize: 12,
    fontWeight: "800",
  },
  historyTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 24,
  },
});
