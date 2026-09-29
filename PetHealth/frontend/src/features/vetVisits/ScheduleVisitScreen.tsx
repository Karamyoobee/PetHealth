import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  onBack?: () => void;
  onSubmit?: () => void;
};

export function ScheduleVisitScreen({ onBack, onSubmit }: Props) {
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule Visit</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.noticeCard}>
          <Ionicons name="paw-outline" size={28} color="#00796B" />
          <Text style={styles.noticeTitle}>Add a pet first</Text>
          <Text style={styles.noticeText}>Vet visits need to be linked to one of your saved pets.</Text>
        </View>

        <Text style={styles.label}>TYPE OF VISIT</Text>
        <TouchableOpacity disabled style={styles.selectBox}>
          <Text style={styles.selectText}>Select reason for visit</Text>
          <Ionicons name="chevron-down" size={18} color="#687076" />
        </TouchableOpacity>

        <Text style={styles.label}>CLINIC / VETERINARIAN</Text>
        <TextInput placeholder="Clinic or veterinarian name" placeholderTextColor="#8B8B8B" style={styles.input} />

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeField}>
            <Text style={styles.label}>DATE</Text>
            <TouchableOpacity disabled style={styles.smallSelect}>
              <Ionicons name="calendar-outline" size={17} color="#111827" />
              <Text style={styles.selectText}>Select date</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateTimeField}>
            <Text style={styles.label}>TIME</Text>
            <TouchableOpacity disabled style={styles.smallSelect}>
              <Ionicons name="time-outline" size={17} color="#111827" />
              <Text style={styles.selectText}>Select time</Text>
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
        <TouchableOpacity disabled style={[styles.submitButton, styles.disabledButton]} onPress={onSubmit}>
          <Text style={styles.submitText}>Schedule Visit</Text>
        </TouchableOpacity>
      </View>
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
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    textAlign: "center",
  },
  label: {
    color: "#6B6B6B",
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
});
