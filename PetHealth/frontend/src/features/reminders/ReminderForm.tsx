import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "../../api/client";
import type { Pet, Reminder } from "../../types";

type Props = {
  onBack?: () => void;
};

export function ReminderForm({ onBack }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [petOpen, setPetOpen] = useState(false);
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
    setPetOpen(false);
    loadReminders(petId);
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
        <TouchableOpacity style={styles.petSelect} onPress={() => setPetOpen((open) => !open)}>
          <Text style={[styles.petSelectText, !selectedPetId && styles.placeholderText]}>
            {pets.find((pet) => pet.id === selectedPetId)?.name || "Select pet"}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#687076" />
        </TouchableOpacity>
        {petOpen ? (
          <View style={styles.optionMenu}>
            {pets.length > 0 ? (
              pets.map((pet) => (
                <TouchableOpacity key={pet.id} style={styles.optionItem} onPress={() => selectPet(pet.id)}>
                  <Text style={styles.optionText}>{pet.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.optionItem}>
                <Text style={styles.optionText}>No pets found</Text>
              </View>
            )}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#00796B" />
          </View>
        ) : reminders.length > 0 ? (
          reminders.map((reminder) => (
            <View key={reminder.id} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <Ionicons name="notifications-outline" size={22} color="#00796B" />
                <View style={styles.reminderTitleWrap}>
                  <Text style={styles.reminderTitle}>{reminder.title}</Text>
                  <Text style={styles.reminderMeta}>{reminder.type} reminder</Text>
                </View>
              </View>
              <Text style={styles.detailText}>Scheduled: {reminder.scheduledFor}</Text>
              <Text style={styles.detailText}>Repeat: {reminder.repeat}</Text>
              <Text style={styles.detailText}>Status: {reminder.enabled ? "Enabled" : "Disabled"}</Text>
            </View>
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

        <TouchableOpacity disabled={reminders.length === 0} style={[styles.dismissButton, reminders.length === 0 && styles.disabledButton]}>
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
    color: "#6B7280",
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
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  reminderCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  reminderHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  reminderTitleWrap: {
    flex: 1,
  },
  reminderTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  reminderMeta: {
    color: "#4B5563",
    fontSize: 13,
    marginTop: 2,
    textTransform: "capitalize",
  },
  detailText: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 20,
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
