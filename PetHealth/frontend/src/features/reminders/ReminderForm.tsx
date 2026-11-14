import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ActivityIndicator, Alert, AppState, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../api/client";
import BottomNavBar from "../../components/BottomNavBar";
import PetSelector from "../../components/PetSelector";
import { showToast } from "../../components/Toast";
import type { Pet, Reminder } from "../../types";

type Props = {
  onBack?: () => void;
  onRemindersChanged?: () => Promise<void>;
  notificationMessage?: string | null;
  onNavigate?: (screen: "home" | "pets" | "assistant" | "timeline" | "reminders") => void;
};

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

function localDateString(date: Date) {
  // Calendar dates should follow the phone's day, rather than the UTC day.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReminderForm({ onBack, onNavigate, onRemindersChanged, notificationMessage }: Props) {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState<Reminder | null>(null);
  const [customSnooze, setCustomSnooze] = useState(false);
  const [datedSnooze, setDatedSnooze] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState("");
  const [snoozeTime, setSnoozeTime] = useState("09:00");
  const [snoozeClockOpen, setSnoozeClockOpen] = useState(false);
  const [snoozeMinutes, setSnoozeMinutes] = useState("");
  const [snoozeError, setSnoozeError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedReminderIds, setSelectedReminderIds] = useState<string[]>([]);
  const working = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    let mounted = true;
    api.listCurrentUserPets().then((savedPets) => {
      if (!mounted) return;
      setPets(savedPets);
      setSelectedPetId(savedPets[0]?.id ?? "");
      if (!savedPets.length) {
        setLoading(false);
        setMessage("Add a pet before creating reminders.");
      }
    }).catch((error) => {
      if (mounted) {
        setMessage(error instanceof Error ? error.message : "Could not load pets.");
        setLoading(false);
      }
    });
    return () => { mounted = false; requestId.current += 1; };
  }, []);

  const loadReminders = useCallback(async (petId: string, showLoading = false) => {
    // Ignore an earlier response if the user has already selected another pet.
    const id = ++requestId.current;
    if (showLoading) setLoading(true);
    try {
      const saved = await api.listReminders(petId);
      if (id === requestId.current) setReminders(saved);
    } catch (error) {
      if (id === requestId.current) setMessage(error instanceof Error ? error.message : "Could not load reminders.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedPetId) return;
    setReminders([]);
    setMessage(null);
    void loadReminders(selectedPetId, true);
    const refresh = () => {
      setNow(Date.now());
      if (AppState.currentState === "active" && !working.current) void loadReminders(selectedPetId);
    };
    const timer = setInterval(refresh, 60000);
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") refresh(); });
    return () => { clearInterval(timer); subscription.remove(); requestId.current += 1; };
  }, [selectedPetId, loadReminders]);

  const activeReminders = useMemo(() => reminders.filter((reminder) => reminder.enabled !== false && !reminder.dismissedAt), [reminders]);
  const historyReminders = useMemo(() => reminders.filter((reminder) => reminder.dismissedAt), [reminders]);
  const hasRead = activeReminders.some((reminder) => reminder.readAt);

  const performAction = async (reminder?: Reminder, action?: "complete" | "snooze" | "read", snoozeMinutes?: number, snoozeUntil?: string) => {
    // Save the change first, then refresh the list and phone notifications.
    if (working.current || !selectedPetId) return;
    working.current = true;
    setBusy(true);
    setMessage(null);
    requestId.current += 1;
    try {
      if (reminder && action) {
        const updated = await api.actOnReminder(reminder.id, action, snoozeMinutes, snoozeUntil);
        setReminders((current) => current.map((item) => item.id === updated.id ? updated : item));
        if (action === "complete") {
          showToast(reminder.type === "medication" ? "Medication marked as taken." : "Reminder marked as done.");
        } else if (action === "snooze") {
          showToast(`Reminder snoozed until ${formatReminderTime(updated.scheduledFor)}.`);
        }
      } else {
        await api.dismissReadReminders(selectedPetId);
        showToast("Read reminders dismissed.");
      }
      await loadReminders(selectedPetId);
      try {
        await onRemindersChanged?.();
      } catch {
        setMessage("Your change was saved, but phone notifications could not refresh. Please try again when connected.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the reminder. Please try again.");
    } finally {
      working.current = false;
      setBusy(false);
    }
  };

  const snoozeReminder = (minutes?: number, until?: string) => {
    // Both snooze options update the same reminder through the usual save flow.
    const reminder = snoozeTarget;
    setSnoozeTarget(null);
    setSnoozeClockOpen(false);
    if (reminder) void performAction(reminder, "snooze", minutes, until);
  };

  const toggleReminderSelection = (reminderId: string) => {
    // Tapping a selected reminder again takes it out of the delete list.
    setSelectedReminderIds((current) => current.includes(reminderId) ? current.filter((id) => id !== reminderId) : [...current, reminderId]);
  };

  const deleteSelectedReminders = () => {
    if (!selectedReminderIds.length) return;
    Alert.alert("Delete selected reminders?", "Linked medications or vet visits will be deleted too. Deleted records stay in your history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        if (working.current || !selectedPetId) return;
        working.current = true;
        setBusy(true);
        setMessage(null);
        try {
          await Promise.all(selectedReminderIds.map((id) => api.deleteReminder(id)));
          // Load the list again because one reminder can also remove a linked record.
          await loadReminders(selectedPetId, true);
          showToast(selectedReminderIds.length === 1 ? "Reminder deleted." : "Selected reminders deleted.");
          setSelectedReminderIds([]);
          setSelectionMode(false);
          try {
            await onRemindersChanged?.();
          } catch {
            setMessage("The record was deleted, but phone notifications could not refresh yet.");
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Could not delete the reminder.");
          Alert.alert("Could not delete reminders", error instanceof Error ? error.message : "Please try again.");
          setSelectedReminderIds([]);
          setSelectionMode(false);
        } finally {
          working.current = false;
          setBusy(false);
        }
      } },
    ]);
  };

  const deleteAllHistory = () => {
    if (!selectedPetId || !historyReminders.length) return;
    Alert.alert("Delete all history?", "This clears completed and dismissed reminders only. Your medications and vet visits will stay.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete all", style: "destructive", onPress: async () => {
        try {
          await api.deleteReminderHistory(selectedPetId);
          await loadReminders(selectedPetId, true);
          showToast("Reminder history deleted.");
        } catch (error) {
          Alert.alert("Could not delete history", error instanceof Error ? error.message : "Please try again.");
        }
      } },
    ]);
  };

  const confirmCustomSnooze = () => {
    // Keep typed snooze durations within the range accepted by the backend.
    if (!/^\d+$/.test(snoozeMinutes) || Number(snoozeMinutes) < 1 || Number(snoozeMinutes) > 1440) {
      setSnoozeError("Enter 1 to 1440 minutes (up to 24 hours).");
      return;
    }
    snoozeReminder(Number(snoozeMinutes));
  };

  const confirmDatedSnooze = () => {
    // Check the local date and time before sending the new reminder time.
    const selected = new Date(`${snoozeDate}T${snoozeTime}:00`);
    if (!Number.isFinite(selected.getTime()) || selected.getTime() <= Date.now()) {
      setSnoozeError("Choose a date and time in the future.");
      return;
    }
    const selectedTime = `${String(selected.getHours()).padStart(2, "0")}:${String(selected.getMinutes()).padStart(2, "0")}`;
    if (localDateString(selected) !== snoozeDate || selectedTime !== snoozeTime) {
      setSnoozeError("That time is unavailable because the clocks change. Please choose another time.");
      return;
    }
    // Send an exact instant so the backend and phone agree across timezones.
    snoozeReminder(undefined, selected.toISOString());
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => selectionMode ? (setSelectionMode(false), setSelectedReminderIds([])) : onBack?.()} style={styles.backButton}>
          <Ionicons name={selectionMode ? "close" : "chevron-back"} size={24} color="#0F766E" />
        </TouchableOpacity>
        <Text style={styles.brand}>{selectionMode ? `${selectedReminderIds.length} selected` : "Pet Health"}</Text>
        <TouchableOpacity
          onPress={() => selectionMode ? deleteSelectedReminders() : setSelectionMode(true)}
          disabled={busy || (selectionMode && !selectedReminderIds.length)}
          style={[styles.headerDelete, (busy || (selectionMode && !selectedReminderIds.length)) && styles.disabledButton]}
          accessibilityLabel={selectionMode ? "Delete selected reminders" : "Select reminders to delete"}
        >
          <Ionicons name="trash-outline" size={22} color="#B42318" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Reminders</Text>
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={(petId) => { if (!working.current) setSelectedPetId(petId); }} />

        {message || notificationMessage ? <Text style={styles.emptyText}>{message ?? notificationMessage}</Text> : null}

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#00796B" />
          </View>
        ) : activeReminders.length > 0 ? (
          activeReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              now={now}
              busy={busy}
              onRead={() => { if (!reminder.readAt) void performAction(reminder, "read"); }}
              onDone={() => performAction(reminder, "complete")}
              onSnooze={() => {
                const suggested = new Date(Date.now() + 15 * 60000);
                setCustomSnooze(false);
                setDatedSnooze(false);
                setSnoozeClockOpen(false);
                setSnoozeDate(localDateString(suggested));
                setSnoozeTime(`${String(suggested.getHours()).padStart(2, "0")}:${String(suggested.getMinutes()).padStart(2, "0")}`);
                setSnoozeMinutes("");
                setSnoozeError(null);
                setSnoozeTarget(reminder);
              }}
              selected={selectedReminderIds.includes(reminder.id)}
              selectionMode={selectionMode}
              onSelect={() => toggleReminderSelection(reminder.id)}
              onLongPress={() => { setSelectionMode(true); setSelectedReminderIds((current) => current.includes(reminder.id) ? current : [...current, reminder.id]); }}
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
          disabled={!hasRead || busy}
          style={[styles.dismissButton, (!hasRead || busy) && styles.disabledButton]}
          onPress={() => performAction()}
        >
          <Text style={styles.dismissText}>Dismiss All Read</Text>
        </TouchableOpacity>

        {historyReminders.length > 0 ? (
          <>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History</Text>
              <TouchableOpacity onPress={deleteAllHistory} disabled={busy}>
                <Text style={styles.clearHistoryText}>Delete all history</Text>
              </TouchableOpacity>
            </View>
            {historyReminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} isHistory busy={busy} selected={selectedReminderIds.includes(reminder.id)} selectionMode={selectionMode} onSelect={() => toggleReminderSelection(reminder.id)} onLongPress={() => { setSelectionMode(true); setSelectedReminderIds((current) => current.includes(reminder.id) ? current : [...current, reminder.id]); }} />
            ))}
          </>
        ) : null}
      </ScrollView>

      <Modal transparent visible={snoozeTarget !== null} animationType="fade" onRequestClose={() => setSnoozeTarget(null)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.snoozeCard}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.historyTitle}>Snooze reminder</Text>
              <Text style={styles.reminderMeta}>Remind me again in</Text>
              {[15, 30, 60, 120].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  accessibilityLabel={`Snooze for ${minutes} minutes`}
                  style={styles.snoozeOption}
                  onPress={() => snoozeReminder(minutes)}
                >
                  <Text style={styles.snoozeText}>{minutes < 60 ? `${minutes} minutes` : `${minutes / 60} ${minutes === 60 ? "hour" : "hours"}`}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.snoozeOption} onPress={() => { setCustomSnooze(!customSnooze); setDatedSnooze(false); setSnoozeClockOpen(false); setSnoozeError(null); }} accessibilityState={{ expanded: customSnooze }}>
                <Text style={styles.snoozeText}>Custom duration</Text>
              </TouchableOpacity>
              {customSnooze ? (
                <View style={styles.customSnooze}>
                  <Text style={styles.reminderMeta}>How many minutes from now?</Text>
                  <TextInput
                    accessibilityLabel="Custom snooze duration in minutes"
                    style={styles.snoozeInput}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="e.g. 20"
                    placeholderTextColor="#6B7280"
                    value={snoozeMinutes}
                    onChangeText={(value) => { setSnoozeMinutes(value); setSnoozeError(null); }}
                  />
                  <Text style={styles.reminderMeta}>1 to 1440 minutes (up to 24 hours).</Text>
                  {snoozeError ? <Text accessibilityRole="alert" style={styles.overdueText}>{snoozeError}</Text> : null}
                  <TouchableOpacity style={styles.snoozeOption} onPress={confirmCustomSnooze}>
                    <Text style={styles.snoozeText}>Confirm snooze</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity style={styles.snoozeOption} onPress={() => { setDatedSnooze(!datedSnooze); setCustomSnooze(false); setSnoozeClockOpen(false); setSnoozeError(null); }} accessibilityState={{ expanded: datedSnooze }}>
                <Text style={styles.snoozeText}>Choose date and time</Text>
              </TouchableOpacity>
              {datedSnooze ? (
                <View style={styles.customSnooze}>
                  <Text style={styles.reminderMeta}>Choose when to receive this reminder again.</Text>
                  <Text style={styles.reminderMeta}>This changes the reminder only, not the appointment or regular medication schedule.</Text>
                  <Calendar
                    current={snoozeDate}
                    minDate={localDateString(new Date())}
                    onDayPress={(day) => { setSnoozeDate(day.dateString); setSnoozeError(null); }}
                    markedDates={{ [snoozeDate]: { selected: true, selectedColor: "#00796B" } }}
                  />
                  <TouchableOpacity style={styles.snoozeOption} onPress={() => setSnoozeClockOpen(true)} accessibilityLabel="Choose snooze time">
                    <Text style={styles.snoozeText}>Time: {snoozeTime}</Text>
                  </TouchableOpacity>
                  {snoozeClockOpen ? (
                    <DateTimePicker
                      mode="time"
                      value={new Date(`${snoozeDate}T${snoozeTime}:00`)}
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(event, date) => {
                        if (Platform.OS !== "ios") setSnoozeClockOpen(false);
                        if (event.type === "set" && date) {
                          setSnoozeTime(`${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`);
                          setSnoozeError(null);
                        }
                      }}
                    />
                  ) : null}
                  <Text style={styles.snoozeSummary}>{formatReminderTime(`${snoozeDate}T${snoozeTime}:00`)}</Text>
                  {snoozeError ? <Text accessibilityRole="alert" style={styles.overdueText}>{snoozeError}</Text> : null}
                  <TouchableOpacity style={styles.snoozeOption} onPress={confirmDatedSnooze}>
                    <Text style={styles.snoozeText}>Snooze until selected time</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <TouchableOpacity style={styles.snoozeOption} onPress={() => setSnoozeTarget(null)}>
                <Text style={styles.snoozeText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BottomNavBar
        active="alerts"
        onHomePress={onBack}
        onPetsPress={() => onNavigate?.("pets")}
        onActionPress={() => onNavigate?.("assistant")}
        onTimelinePress={() => onNavigate?.("timeline")}
        onAlertsPress={() => onNavigate?.("reminders")}
      />
    </View>
  );
}

export default ReminderForm;

function ReminderCard({
  reminder,
  isHistory = false,
  onDone,
  onSnooze,
  onRead,
  selected = false,
  selectionMode = false,
  onSelect,
  onLongPress,
  now = Date.now(),
  busy = false,
}: {
  reminder: Reminder;
  isHistory?: boolean;
  onDone?: () => void;
  onSnooze?: () => void;
  onRead?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
  now?: number;
  busy?: boolean;
}) {
  const isOverdue = !isHistory && new Date(reminder.scheduledFor).getTime() < now;
  const accentColor = isHistory ? "#9CA3AF" : reminderAccent(reminder.type);
  const subtitle = `${reminder.type === "medication" ? "Medication" : reminder.type} - ${formatReminderTime(reminder.scheduledFor)}`;

  return (
    <TouchableOpacity
      activeOpacity={selectionMode ? 0.8 : 1}
      delayLongPress={2000}
      onLongPress={onLongPress}
      onPress={selectionMode ? onSelect : undefined}
      style={[styles.reminderCard, selected && styles.selectedReminderCard]}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      <TouchableOpacity disabled={busy || isHistory || selectionMode} onPress={onRead} style={styles.cardContent}>
        <Text style={styles.reminderTitle}>{reminder.title}</Text>
        <Text style={styles.reminderMeta}>{subtitle}</Text>
        {!isHistory ? <Text style={styles.reminderMeta}>{reminder.readAt ? "Read" : "Unread"}</Text> : null}
        {isOverdue ? <Text style={styles.overdueText}>Overdue</Text> : null}
        {isHistory ? (
          <Text style={styles.historyMeta}>
            {reminder.completedAt ? "Completed" : "Dismissed"} {formatReminderTime(reminder.dismissedAt ?? "")}
          </Text>
        ) : null}
      </TouchableOpacity>
      {!isHistory ? (
        <View style={styles.actions}>
          <TouchableOpacity disabled={busy} style={[styles.doneButton, busy && styles.disabledButton]} onPress={onDone}>
            <Text style={styles.doneText}>Mark Done</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={busy} style={[styles.snoozeButton, busy && styles.disabledButton]} onPress={onSnooze}>
            <Text style={styles.snoozeText}>Snooze</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  snoozeCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    maxWidth: 380,
    maxHeight: "90%",
    padding: 20,
    width: "100%",
  },
  customSnooze: {
    marginTop: 16,
  },
  snoozeSummary: {
    color: "#3E4946",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  snoozeInput: {
    borderColor: "#E2DED7",
    borderRadius: 8,
    borderWidth: 1,
    color: "#3E4946",
    fontSize: 16,
    marginVertical: 8,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  snoozeOption: {
    alignItems: "center",
    borderColor: "#E2DED7",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  actions: {
    gap: 6,
    paddingVertical: 10,
  },
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
  headerDelete: {
    alignItems: "center",
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    width: 40,
  },
  brand: {
    color: "#00796B",
    fontSize: 16,
    fontWeight: "800",
  },
  content: {
    padding: 16,
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
  selectedReminderCard: {
    borderColor: "#00796B",
    borderWidth: 2,
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
  historyHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearHistoryText: {
    color: "#B42318",
    fontSize: 12,
    fontWeight: "700",
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
