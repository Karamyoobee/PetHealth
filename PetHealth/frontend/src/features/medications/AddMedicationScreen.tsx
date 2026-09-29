import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onBack?: () => void;
  onSubmit?: () => void;
};

export function AddMedicationScreen({ onBack, onSubmit }: Props) {
  const [reminderEnabled, setReminderEnabled] = useState(true);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Medication</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <Text style={styles.label}>Medication Name</Text>
          <TextInput placeholder="Medication name" placeholderTextColor="#6B7280" style={styles.input} />

          <Text style={styles.label}>Purpose</Text>
          <TextInput placeholder="Treatment purpose" placeholderTextColor="#6B7280" style={styles.input} />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.label}>Dosage</Text>
              <TextInput placeholder="Dosage" placeholderTextColor="#6B7280" style={styles.input} />
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Frequency</Text>
              <TouchableOpacity style={styles.selectInput}>
                <Text style={styles.selectText}>Select frequency</Text>
                <Ionicons name="chevron-down" size={18} color="#687076" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Set Time</Text>
          <TouchableOpacity style={styles.fullSelect}>
            <Ionicons name="time-outline" size={17} color="#526066" />
            <Text style={styles.selectText}>Select time</Text>
          </TouchableOpacity>

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
              <TouchableOpacity style={styles.dateInput}>
                <Ionicons name="calendar-outline" size={17} color="#526066" />
                <Text style={styles.selectText}>Select date</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>End Date</Text>
              <TouchableOpacity style={styles.dateInput}>
                <Ionicons name="calendar-outline" size={17} color="#526066" />
                <Text style={styles.selectText}>Select date</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.label}>Instructions / Notes</Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder="Any special instructions"
            placeholderTextColor="#6B7280"
            style={styles.notes}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.addButton} onPress={onSubmit}>
          <Text style={styles.addText}>+ Add Medication</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    color: "#60666D",
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
    color: "#526066",
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
});
