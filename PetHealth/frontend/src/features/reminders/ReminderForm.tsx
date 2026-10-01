import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onBack?: () => void;
};

export function ReminderForm({ onBack }: Props) {
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

        <View style={styles.emptyState}>
          <Ionicons name="notifications-outline" size={32} color="#00796B" />
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptyText}>
            Medication, refill, and vet visit reminders will appear here after you create them.
          </Text>
        </View>

        <TouchableOpacity disabled style={[styles.dismissButton, styles.disabledButton]}>
          <Text style={styles.dismissText}>Dismiss All Read</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

export default ReminderForm;

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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "500",
    marginBottom: 18,
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
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "800",
  },
});
