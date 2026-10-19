import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import type { Pet } from "../../types";

type Props = {
  onBack?: () => void;
  onSubmit?: () => void;
};

const visitReasons = [
  "Routine checkup",
  "Vaccination",
  "Dental care",
  "Skin or allergy concern",
  "Injury or pain",
  "Digestive issue",
  "Medication review",
  "Follow-up visit",
  "Other",
];
const hourOptions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const today = new Date().toISOString().slice(0, 10);

function addYears(dateString: string, years: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

function formatClockTime(hour: number, minute: string, period: "AM" | "PM") {
  const hour24 = period === "AM" ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

function parseClockTime(time: string) {
  if (!time) {
    return { hour: 9, minute: "00", period: "AM" as const };
  }

  const [rawHour, rawMinute] = time.split(":");
  const hour24 = Number(rawHour);
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return { hour, minute: rawMinute ?? "00", period };
}

export function ScheduleVisitScreen({ onBack, onSubmit }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [notes, setNotes] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(today);
  const [clockOpen, setClockOpen] = useState(false);
  const [clockHour, setClockHour] = useState(9);
  const [clockMinute, setClockMinute] = useState("00");
  const [clockPeriod, setClockPeriod] = useState<"AM" | "PM">("AM");
  const [saving, setSaving] = useState(false);

  const selectedReason = reason === "Other" ? customReason.trim() : reason;

  useEffect(() => {
    let mounted = true;

    async function loadPets() {
      try {
        const savedPets = await api.listCurrentUserPets();
        if (!mounted) return;
        setPets(savedPets);
        setSelectedPetId((currentPetId) => currentPetId || savedPets[0]?.id || "");
      } catch {
        if (mounted) {
          setPets([]);
        }
      }
    }

    loadPets();

    return () => {
      mounted = false;
    };
  }, []);

  const openCalendar = () => {
    setCalendarMonth(appointmentDate || today);
    setCalendarOpen(true);
  };

  const openClock = () => {
    const parsed = parseClockTime(appointmentTime);
    setClockHour(parsed.hour);
    setClockMinute(parsed.minute);
    setClockPeriod(parsed.period);
    setClockOpen(true);
  };

  const confirmClockTime = () => {
    setAppointmentTime(formatClockTime(clockHour, clockMinute, clockPeriod));
    setClockOpen(false);
  };

  const scheduleVisit = async () => {
    if (!selectedReason) {
      Alert.alert("Reason required", "Please choose or enter a reason for the visit.");
      return;
    }

    if (!clinicName.trim() || !appointmentDate || !appointmentTime) {
      Alert.alert("Missing details", "Please add clinic, date, and time.");
      return;
    }

    if (!selectedPetId) {
      Alert.alert("Pet required", "Please select a pet before scheduling a visit.");
      return;
    }

    setSaving(true);
    try {
      await api.createVetVisit(selectedPetId, {
        reason: selectedReason,
        appointmentDate,
        appointmentTime,
        clinicName: clinicName.trim(),
        veterinarianName: "",
        diagnosis: "",
        treatment: "",
        notes: notes.trim(),
        followUpDate: "",
      });

      await api.createReminder(selectedPetId, {
        type: "checkup",
        title: `Vet visit: ${selectedReason}`,
        scheduledFor: `${appointmentDate}T${appointmentTime}:00`,
        repeat: "none",
        enabled: true,
      });

      onSubmit?.();
    } catch (error) {
      Alert.alert("Could not schedule visit", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Visit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={setSelectedPetId} />

        <Text style={styles.label}>TYPE OF VISIT</Text>
        <TouchableOpacity style={styles.selectBox} onPress={() => setReasonOpen((open) => !open)}>
          <Text style={[styles.selectText, !reason && styles.placeholderText]}>{reason || "Select reason for visit"}</Text>
          <Ionicons name="chevron-down" size={18} color="#687076" />
        </TouchableOpacity>
        {reasonOpen ? (
          <View style={styles.optionMenu}>
            {visitReasons.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.optionItem}
                onPress={() => {
                  setReason(option);
                  setReasonOpen(false);
                }}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {reason === "Other" ? (
          <TextInput
            placeholder="Enter visit reason"
            placeholderTextColor="#8B8B8B"
            style={styles.input}
            value={customReason}
            onChangeText={setCustomReason}
          />
        ) : null}

        <Text style={styles.label}>CLINIC / VETERINARIAN</Text>
        <TextInput
          placeholder="Clinic or veterinarian name"
          placeholderTextColor="#8B8B8B"
          style={styles.input}
          value={clinicName}
          onChangeText={setClinicName}
        />

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeField}>
            <Text style={styles.label}>DATE</Text>
            <TouchableOpacity style={styles.smallSelect} onPress={openCalendar}>
              <Ionicons name="calendar-outline" size={17} color="#111827" />
              <Text style={[styles.selectText, !appointmentDate && styles.placeholderText]}>
                {appointmentDate || "Select date"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateTimeField}>
            <Text style={styles.label}>TIME</Text>
            <TouchableOpacity style={styles.smallSelect} onPress={openClock}>
              <Ionicons name="time-outline" size={17} color="#111827" />
              <Text style={[styles.selectText, !appointmentTime && styles.placeholderText]}>
                {appointmentTime || "Select time"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>ADDITIONAL NOTES</Text>
        <TextInput
          multiline
          numberOfLines={6}
          placeholder="Any specific concerns or symptoms?"
          placeholderTextColor="#8B8B8B"
          style={styles.notes}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.submitButton, saving && styles.disabledButton]} onPress={scheduleVisit} disabled={saving}>
          <Text style={styles.submitText}>{saving ? "Scheduling..." : "Schedule Visit"}</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={calendarOpen} animationType="fade" onRequestClose={() => setCalendarOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.yearControls}>
              <TouchableOpacity style={styles.yearButton} onPress={() => setCalendarMonth((month) => addYears(month, -1))}>
                <Ionicons name="chevron-back" size={18} color="#00796B" />
                <Text style={styles.yearButtonText}>Year</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Visit Date</Text>
              <TouchableOpacity style={styles.yearButton} onPress={() => setCalendarMonth((month) => addYears(month, 1))}>
                <Text style={styles.yearButtonText}>Year</Text>
                <Ionicons name="chevron-forward" size={18} color="#00796B" />
              </TouchableOpacity>
            </View>
            <Calendar
              key={calendarMonth}
              current={calendarMonth}
              onMonthChange={(month) => setCalendarMonth(month.dateString)}
              onDayPress={(day) => {
                setAppointmentDate(day.dateString);
                setCalendarOpen(false);
              }}
              markedDates={{
                ...(appointmentDate ? { [appointmentDate]: { selected: true, selectedColor: "#00796B" } } : {}),
              }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setCalendarOpen(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={clockOpen} animationType="fade" onRequestClose={() => setClockOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.clockCard}>
            <Text style={styles.modalTitle}>Select Time</Text>
            <Text style={styles.timePreview}>{formatClockTime(clockHour, clockMinute, clockPeriod)}</Text>
            <View style={styles.clockFace}>
              {hourOptions.map((hour, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const left = 92 + 78 * Math.cos(angle);
                const top = 92 + 78 * Math.sin(angle);

                return (
                  <TouchableOpacity
                    key={hour}
                    style={[styles.clockHour, { left, top }, clockHour === hour && styles.clockHourActive]}
                    onPress={() => setClockHour(hour)}
                  >
                    <Text style={[styles.clockHourText, clockHour === hour && styles.clockHourTextActive]}>{hour}</Text>
                  </TouchableOpacity>
                );
              })}
              <View style={styles.clockCenter} />
            </View>
            <View style={styles.periodRow}>
              {(["AM", "PM"] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[styles.periodButton, clockPeriod === period && styles.periodButtonActive]}
                  onPress={() => setClockPeriod(period)}
                >
                  <Text style={[styles.periodText, clockPeriod === period && styles.periodTextActive]}>{period}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.minuteGrid}>
              {minuteOptions.map((minute) => (
                <TouchableOpacity
                  key={minute}
                  style={[styles.minuteButton, clockMinute === minute && styles.minuteButtonActive]}
                  onPress={() => setClockMinute(minute)}
                >
                  <Text style={[styles.minuteText, clockMinute === minute && styles.minuteTextActive]}>{minute}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalAction} onPress={() => setClockOpen(false)}>
                <Text style={styles.closeText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalAction, styles.confirmAction]} onPress={confirmClockTime}>
                <Text style={styles.confirmText}>Set Time</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default ScheduleVisitScreen;

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
    left: 14,
    position: "absolute",
    width: 24,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 28,
  },
  noticeCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
    padding: 20,
  },
  noticeTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8,
  },
  noticeText: {
    color: "#3E4946",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: "center",
  },
  label: {
    color: "#3E4946",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    height: 48,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  selectBox: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  selectText: {
    color: "#111827",
    fontSize: 14,
  },
  placeholderText: {
    color: "#8B8B8B",
  },
  optionMenu: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  optionItem: {
    borderBottomColor: "#ECE7DF",
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  optionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  dateTimeRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  dateTimeField: {
    flex: 1,
  },
  smallSelect: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    paddingHorizontal: 13,
  },
  notes: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    minHeight: 124,
    padding: 16,
  },
  footer: {
    backgroundColor: "#FAF8F4",
    padding: 20,
    paddingTop: 12,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#238575",
    borderRadius: 8,
    height: 54,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modalBackdrop: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },
  clockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 18,
    width: "100%",
  },
  modalTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  yearControls: {
    alignItems: "center",
    borderBottomColor: "#E5E1DB",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },
  yearButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    minWidth: 72,
  },
  yearButtonText: {
    color: "#00796B",
    fontSize: 12,
    fontWeight: "800",
  },
  closeButton: {
    alignItems: "center",
    borderTopColor: "#E5E1DB",
    borderTopWidth: 1,
    padding: 14,
  },
  closeText: {
    color: "#00796B",
    fontSize: 14,
    fontWeight: "800",
  },
  timePreview: {
    color: "#00796B",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "center",
  },
  clockFace: {
    alignSelf: "center",
    backgroundColor: "#F4F1EC",
    borderColor: "#DDD8D0",
    borderRadius: 110,
    borderWidth: 1,
    height: 220,
    marginTop: 18,
    position: "relative",
    width: 220,
  },
  clockHour: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    width: 36,
  },
  clockHourActive: {
    backgroundColor: "#00796B",
    borderColor: "#00796B",
  },
  clockHourText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
  },
  clockHourTextActive: {
    color: "#FFFFFF",
  },
  clockCenter: {
    backgroundColor: "#00796B",
    borderRadius: 5,
    height: 10,
    left: 105,
    position: "absolute",
    top: 105,
    width: 10,
  },
  periodRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  periodButton: {
    alignItems: "center",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 11,
  },
  periodButtonActive: {
    backgroundColor: "#00796B",
    borderColor: "#00796B",
  },
  periodText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  minuteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  minuteButton: {
    alignItems: "center",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 45,
    paddingVertical: 9,
  },
  minuteButtonActive: {
    backgroundColor: "#00796B",
    borderColor: "#00796B",
  },
  minuteText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "800",
  },
  minuteTextActive: {
    color: "#FFFFFF",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalAction: {
    alignItems: "center",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: 13,
  },
  confirmAction: {
    backgroundColor: "#00796B",
    borderColor: "#00796B",
  },
  confirmText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
