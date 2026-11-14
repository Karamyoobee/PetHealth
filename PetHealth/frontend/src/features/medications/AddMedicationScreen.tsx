import React, { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import SavedValueInput from "../../components/SavedValueInput";
import { showToast } from "../../components/Toast";
import type { MedicationTemplate, Pet } from "../../types";

type Props = {
  onBack?: () => void;
  onSubmit?: (petId: string) => void;
  petId?: string | null;
};

const frequencyOptions = ["Once a day", "Twice a day", "Three times a day"];
const hourOptions = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const minuteOptions = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
const today = new Date().toISOString().slice(0, 10);

const uniqueValues = (values: string[]) => [...new Set(values.map((value) => value.trim()).filter(Boolean))];

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
    return { hour: 8, minute: "00", period: "AM" as const };
  }

  const [rawHour, rawMinute] = time.split(":");
  const hour24 = Number(rawHour);
  const period: "AM" | "PM" = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return { hour, minute: rawMinute ?? "00", period };
}

export function AddMedicationScreen({ onBack, onSubmit, petId }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState(petId ?? "");
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [dosage, setDosage] = useState("");
  const [savedMedications, setSavedMedications] = useState<MedicationTemplate[]>([]);
  const [activeSavedField, setActiveSavedField] = useState<string | null>(null);
  const [frequency, setFrequency] = useState("");
  const [reminderTimes, setReminderTimes] = useState(["", "", ""]);
  const [timeIndex, setTimeIndex] = useState(0);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [clockHour, setClockHour] = useState(8);
  const [clockMinute, setClockMinute] = useState("00");
  const [clockError, setClockError] = useState<string | null>(null);
  const [clockPeriod, setClockPeriod] = useState<"AM" | "PM">("AM");
  const [calendarTarget, setCalendarTarget] = useState<"start" | "end" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(today);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPets() {
      try {
        const savedPets = await api.listCurrentUserPets();
        if (!mounted) return;
        setPets(savedPets);
        setSelectedPetId((currentPetId) => currentPetId || savedPets[0]?.id || "");
      } catch {
        if (mounted) setPets([]);
      }
    }

    loadPets();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!selectedPetId) {
      setSavedMedications([]);
      return () => { mounted = false; };
    }

    // Each pet has its own saved medication details.
    api.listMedicationTemplates(selectedPetId)
      .then((templates) => {
        if (mounted) setSavedMedications(templates);
      })
      .catch(() => {
        if (mounted) setSavedMedications([]);
      });

    return () => { mounted = false; };
  }, [selectedPetId]);

  const doseCount = frequency === "Three times a day" ? 3 : frequency === "Twice a day" ? 2 : 1;
  const selectedTimes = reminderTimes.slice(0, doseCount);
  const savedNames = uniqueValues(savedMedications.map((template) => template.name));
  const savedPurposes = uniqueValues(savedMedications.map((template) => template.purpose));
  const savedDosages = uniqueValues(savedMedications.map((template) => template.dosage));

  const openClock = (index: number) => {
    // Remember which dose is being edited so the other times stay unchanged.
    setTimeIndex(index);
    const parsed = parseClockTime(reminderTimes[index]);
    setClockHour(parsed.hour);
    setClockMinute(parsed.minute);
    setClockError(null);
    setClockPeriod(parsed.period);
    setTimeOpen(true);
  };

  const confirmClockTime = () => {
    // Check typed minutes before saving this dose's time.
    if (!/^\d{1,2}$/.test(clockMinute) || Number(clockMinute) > 59) {
      setClockError("Enter minutes from 00 to 59.");
      return;
    }
    const time = formatClockTime(clockHour, clockMinute.padStart(2, "0"), clockPeriod);
    setReminderTimes((current) => current.map((value, index) => index === timeIndex ? time : value));
    setTimeOpen(false);
  };

  const openCalendar = (target: "start" | "end") => {
    // Open on the saved start or end date instead of resetting the calendar.
    const selectedDate = target === "start" ? startDate : endDate;
    setCalendarMonth(selectedDate || today);
    setCalendarTarget(target);
  };

  const selectSavedMedication = (template: MedicationTemplate) => {
    setName(template.name);
    setPurpose(template.purpose);
    setDosage(template.dosage);
  };

  const clearSavedMedications = () => {
    Alert.alert(
      "Clear saved medications?",
      "This removes saved dropdown choices only. Existing medication records will stay.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear all",
          style: "destructive",
          onPress: async () => {
            try {
              if (!selectedPetId) return;
              await api.clearMedicationTemplates(selectedPetId);
              setSavedMedications([]);
              setActiveSavedField(null);
            } catch (error) {
              Alert.alert("Could not clear saved medications", error instanceof Error ? error.message : "Please try again.");
            }
          },
        },
      ],
    );
  };

  const saveMedication = async () => {
    // Save all daily dose times together so the reminder series stay in sync.
    if (saving) return;
    if (!name.trim()) {
      Alert.alert("Medication name required", "Please enter the medication name.");
      return;
    }

    if (!frequency || selectedTimes.some((time) => !time) || !startDate || !endDate) {
      Alert.alert("Missing details", "Please choose frequency, a time for each dose, start date, and end date.");
      return;
    }

    if (new Set(selectedTimes).size !== doseCount) {
      Alert.alert("Different times required", "Please choose a different time for each daily dose.");
      return;
    }

    if (endDate < startDate) {
      Alert.alert("Check dates", "End date must be on or after start date.");
      return;
    }

    if (!selectedPetId) {
      Alert.alert("Pet required", "Please select a pet before adding medication.");
      return;
    }

    setSaving(true);
    try {
      await api.createMedication(selectedPetId, {
        name: name.trim(),
        purpose: purpose.trim(),
        dosage: dosage.trim(),
        instructions: instructions.trim(),
        schedule: frequency,
        startDate,
        endDate,
        reminderTime: selectedTimes[0],
        reminderTimes: selectedTimes,
        reminderEnabled,
      });

      // Add this choice now so it is ready when the user opens the dropdown again.
      setSavedMedications((current) => [
        ...current,
        { id: `saved-${Date.now()}`, name: name.trim(), purpose: purpose.trim(), dosage: dosage.trim() },
      ]);

      showToast("Medication saved successfully.");
      onSubmit?.(selectedPetId);
    } catch (error) {
      Alert.alert("Could not save medication", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: 112 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={(nextPetId) => {
          setActiveSavedField(null);
          setSelectedPetId(nextPetId);
        }} />

        <View style={styles.formCard}>
          <SavedValueInput label="Medication Name" placeholder="Medication name" value={name} options={savedNames} emptyMessage="No saved medication names for this pet yet." onChangeText={setName} openKey="name" activeKey={activeSavedField} onOpenChange={setActiveSavedField} onSelect={(value) => {
            const template = savedMedications.find((item) => item.name === value);
            if (template) selectSavedMedication(template);
          }} onClear={clearSavedMedications} />

          <SavedValueInput label="Purpose" placeholder="Treatment purpose" value={purpose} options={savedPurposes} emptyMessage="No saved purposes for this pet yet." onChangeText={setPurpose} openKey="purpose" activeKey={activeSavedField} onOpenChange={setActiveSavedField} onSelect={setPurpose} onClear={clearSavedMedications} />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <SavedValueInput label="Dosage" placeholder="Dosage" value={dosage} options={savedDosages} emptyMessage="No saved dosages for this pet yet." onChangeText={setDosage} openKey="dosage" activeKey={activeSavedField} onOpenChange={setActiveSavedField} onSelect={setDosage} onClear={clearSavedMedications} />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Frequency</Text>
              <TouchableOpacity style={styles.selectInput} onPress={() => setFrequencyOpen((open) => !open)}>
                <Text style={[styles.selectText, !frequency && styles.placeholderText]}>
                  {frequency || "Select frequency"}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#687076" />
              </TouchableOpacity>
              {frequencyOpen ? (
                <View style={styles.optionMenu}>
                  {frequencyOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.optionItem}
                      onPress={() => {
                        setFrequency(option);
                        setFrequencyOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {selectedTimes.map((time, index) => (
            <View key={index}>
              <Text style={styles.label}>{doseCount === 1 ? "Set Time" : `Dose ${index + 1} Time`}</Text>
              <TouchableOpacity accessibilityLabel={`Dose ${index + 1} time`} style={styles.fullSelect} onPress={() => openClock(index)}>
                <Ionicons name="time-outline" size={17} color="#526066" />
                <Text style={[styles.selectText, !time && styles.placeholderText]}>
                  {time || "Select time"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.reminderRow}>
            <View style={styles.reminderLabelWrap}>
              <Ionicons name="notifications-outline" size={20} color="#526066" />
              <Text style={styles.reminderLabel}>Set Reminder</Text>
            </View>
            <TouchableOpacity
              onPress={() => setReminderEnabled((enabled) => !enabled)}
              style={[styles.switchTrack, reminderEnabled && styles.switchTrackOn]}
            >
              <View style={[styles.switchThumb, reminderEnabled && styles.switchThumbOn]} />
            </TouchableOpacity>
          </View>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => openCalendar("start")}>
                <Ionicons name="calendar-outline" size={17} color="#526066" />
                <Text style={[styles.selectText, !startDate && styles.placeholderText]}>
                  {startDate || "Select date"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => openCalendar("end")}>
                <Ionicons name="calendar-outline" size={17} color="#526066" />
                <Text style={[styles.selectText, !endDate && styles.placeholderText]}>
                  {endDate || "Select date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Instructions / Notes</Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder="Any special instructions"
            placeholderTextColor="#3E4946"
            style={styles.notes}
            textAlignVertical="top"
            value={instructions}
            onChangeText={setInstructions}
            onFocus={() => scrollRef.current?.scrollToEnd({ animated: true })}
          />
        </View>
      </ScrollView>

      {/* Keep the save button above the phone navigation area. */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity style={[styles.addButton, saving && styles.disabledButton]} onPress={saveMedication} disabled={saving}>
          <Text style={styles.addText}>{saving ? "Saving..." : "Add Medication"}</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={calendarTarget !== null} animationType="fade" onRequestClose={() => setCalendarTarget(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.calendarCard}>
            <View style={styles.yearControls}>
              <TouchableOpacity style={styles.yearButton} onPress={() => setCalendarMonth((month) => addYears(month, -1))}>
                <Ionicons name="chevron-back" size={18} color="#00796B" />
                <Text style={styles.yearButtonText}>Year</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{calendarTarget === "start" ? "Start Date" : "End Date"}</Text>
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
                if (calendarTarget === "start") {
                  setStartDate(day.dateString);
                } else {
                  setEndDate(day.dateString);
                }
                setCalendarTarget(null);
              }}
              markedDates={{
                ...(startDate ? { [startDate]: { selected: calendarTarget === "start", selectedColor: "#00796B" } } : {}),
                ...(endDate ? { [endDate]: { selected: calendarTarget === "end", selectedColor: "#00796B" } } : {}),
              }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setCalendarTarget(null)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={timeOpen} animationType="fade" onRequestClose={() => setTimeOpen(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.clockCard}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Select Time</Text>
              <Text style={styles.timePreview}>{formatClockTime(clockHour, clockMinute.padStart(2, "0"), clockPeriod)}</Text>

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
                    onPress={() => { setClockMinute(minute); setClockError(null); }}
                  >
                    <Text style={[styles.minuteText, clockMinute === minute && styles.minuteTextActive]}>{minute}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Or enter minutes (00 to 59)</Text>
              <TextInput
                accessibilityLabel="Custom minutes, from 00 to 59"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={2}
                value={clockMinute}
                placeholder="e.g. 07"
                placeholderTextColor="#6B7280"
                onChangeText={(value) => { setClockMinute(value); setClockError(null); }}
              />
              {clockError ? <Text accessibilityRole="alert" style={styles.clockError}>{clockError}</Text> : null}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalAction} onPress={() => setTimeOpen(false)}>
                  <Text style={styles.closeText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalAction, styles.confirmAction]} onPress={confirmClockTime}>
                  <Text style={styles.confirmText}>Set Time</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </KeyboardAvoidingView>
  );
}

export default AddMedicationScreen;

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
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 9,
    borderWidth: 1,
    padding: 18,
  },
  label: {
    color: "#3E4946",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    height: 48,
    marginBottom: 18,
    paddingHorizontal: 14,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
  },
  column: {
    flex: 1,
  },
  selectInput: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    height: 48,
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  fullSelect: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    height: 48,
    marginBottom: 20,
    paddingHorizontal: 14,
  },
  dateInput: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  selectText: {
    color: "#111827",
    fontSize: 14,
  },
  placeholderText: {
    color: "#3E4946",
  },
  optionMenu: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 6,
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
  timeMenu: {
    marginBottom: 18,
  },
  petMenu: {
    marginBottom: 18,
  },
  reminderRow: {
    alignItems: "center",
    borderBottomColor: "#ECE7DF",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 18,
  },
  reminderLabelWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  reminderLabel: {
    color: "#3E4946",
    fontSize: 14,
    fontWeight: "800",
  },
  switchTrack: {
    backgroundColor: "#C6CBC8",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    paddingHorizontal: 2,
    width: 44,
  },
  switchTrackOn: {
    backgroundColor: "#00796B",
  },
  switchThumb: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  switchThumbOn: {
    alignSelf: "flex-end",
  },
  notes: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    minHeight: 102,
    padding: 16,
  },
  footer: {
    backgroundColor: "#FAF8F4",
    bottom: 0,
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: "#238575",
    borderRadius: 8,
    height: 54,
    justifyContent: "center",
  },
  addText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
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
    maxHeight: "90%",
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
  clockError: {
    color: "#B42318",
    fontSize: 13,
    marginBottom: 10,
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
});
