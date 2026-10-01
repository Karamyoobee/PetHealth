import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onBack?: () => void;
  onScheduleVisit?: () => void;
};

export function VetVisitForm({ onBack, onScheduleVisit }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vet Visits</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.scheduleButton} onPress={onScheduleVisit}>
          <Text style={styles.scheduleText}>+ Schedule Visit</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Upcoming</Text>
        <EmptyState
          icon="calendar-outline"
          title="No upcoming visits"
          text="Scheduled vet appointments will appear here after you add them."
        />

        <Text style={[styles.sectionTitle, styles.pastTitle]}>Past Visits</Text>
        <EmptyState
          icon="document-text-outline"
          title="No visit history yet"
          text="Past diagnoses, treatments, and clinic notes will appear after visits are recorded."
        />
      </ScrollView>
    </View>
  );
}

function EmptyState({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={32} color="#00796B" />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export default VetVisitForm;

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
    paddingHorizontal: 20,
  },
  backButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    marginRight: 14,
    width: 24,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  scheduleButton: {
    alignItems: "center",
    backgroundColor: "#238575",
    borderRadius: 7,
    height: 52,
    justifyContent: "center",
    marginBottom: 26,
  },
  scheduleText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  pastTitle: {
    marginTop: 32,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 9,
    borderWidth: 1,
    padding: 24,
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 10,
  },
  emptyText: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
});
