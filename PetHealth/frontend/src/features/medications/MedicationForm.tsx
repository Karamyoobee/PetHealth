import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import type { Medication, Pet } from "../../types";

type Props = {
  onBack?: () => void;
  onAddMedication?: () => void;
  petId?: string | null;
  onSelectPet?: (petId: string) => void;
  onRecordsChanged?: () => Promise<void>;
};

export function MedicationForm({ onBack, onAddMedication, petId, onSelectPet, onRecordsChanged }: Props) {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState(petId ?? "");
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<string[]>([]);

  const loadPets = useCallback(async () => {
    // Keep the selected pet when returning from the add medication screen.
    setLoading(true);
    setMessage(null);
    try {
      const savedPets = await api.listCurrentUserPets();
      setPets(savedPets);
      const nextPetId = selectedPetId || savedPets[0]?.id || "";
      setSelectedPetId(nextPetId);
      if (nextPetId) onSelectPet?.(nextPetId);

      if (!nextPetId) {
        setMedications([]);
        setMessage("Add a pet before tracking medications.");
        return;
      }
      setMedications(await api.listMedications(nextPetId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load medications.");
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, onSelectPet]);

  const loadMedications = useCallback(async (petId: string) => {
    // Fetch the chosen pet's medicines and show any loading error on this screen.
    setLoading(true);
    setMessage(null);
    try {
      setMedications(await api.listMedications(petId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load medications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const selectPet = (petId: string) => {
    // Keep the parent screen's selection in step with the medication list.
    setSelectedPetId(petId);
    onSelectPet?.(petId);
    loadMedications(petId);
  };

  const toggleSelection = (medicationId: string) => {
    setSelectedMedicationIds((current) => current.includes(medicationId) ? current.filter((id) => id !== medicationId) : [...current, medicationId]);
  };

  const confirmDeleteSelected = () => {
    if (!selectedMedicationIds.length) return;
    Alert.alert("Delete selected medications?", "Their linked reminders will be deleted too. Deleted records stay in your history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await Promise.all(medications.filter((item) => selectedMedicationIds.includes(item.id)).map((item) => api.deleteMedication(item.petId, item.id)));
          setMedications((current) => current.filter((item) => !selectedMedicationIds.includes(item.id)));
          setSelectedMedicationIds([]);
          setSelectionMode(false);
          try {
            await onRecordsChanged?.();
          } catch {
            setMessage("The medication was deleted, but phone notifications could not refresh yet.");
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Could not delete the medication.");
          Alert.alert("Could not delete medications", error instanceof Error ? error.message : "Please try again.");
          setSelectedMedicationIds([]);
          setSelectionMode(false);
        }
      } },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => selectionMode ? (setSelectionMode(false), setSelectedMedicationIds([])) : onBack?.()} style={styles.backButton}>
          <Ionicons name={selectionMode ? "close" : "chevron-back"} size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectionMode ? `${selectedMedicationIds.length} selected` : "Medications"}</Text>
        <TouchableOpacity onPress={() => selectionMode ? confirmDeleteSelected() : setSelectionMode(true)} disabled={selectionMode && !selectedMedicationIds.length} style={[styles.headerDelete, selectionMode && !selectedMedicationIds.length && styles.disabledButton]}>
          <Ionicons name="trash-outline" size={21} color="#B42318" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={selectPet} />

        <Text style={styles.sectionLabel}>ACTIVE MEDICATIONS</Text>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#00796B" />
          </View>
        ) : medications.length > 0 ? (
          medications.map((medication) => (
            <TouchableOpacity key={medication.id} delayLongPress={2000} onLongPress={() => { setSelectionMode(true); setSelectedMedicationIds((current) => current.includes(medication.id) ? current : [...current, medication.id]); }} onPress={selectionMode ? () => toggleSelection(medication.id) : undefined} style={[styles.medicationCard, selectedMedicationIds.includes(medication.id) && styles.selectedCard]}>
              <View style={styles.cardHeader}>
                <Ionicons name="medkit-outline" size={22} color="#00796B" />
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.medicationMeta}>{medication.dosage || "No dosage added"}</Text>
                </View>
              </View>
              {medication.purpose ? <Text style={styles.detailText}>Purpose: {medication.purpose}</Text> : null}
              <Text style={styles.detailText}>Frequency: {medication.schedule || "Not set"}</Text>
              <Text style={styles.detailText}>Time: {medication.reminderTimes?.join(", ") || medication.reminderTime || "Not set"}</Text>
              <Text style={styles.detailText}>
                Dates: {medication.startDate || "Not set"} to {medication.endDate || "Not set"}
              </Text>
              {medication.instructions ? <Text style={styles.detailText}>Notes: {medication.instructions}</Text> : null}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="medkit-outline" size={32} color="#00796B" />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyText}>
              {message ?? "Active medications and treatment schedules will appear here after you add them."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Keep this fixed action above Android's navigation buttons. */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity style={styles.addButton} onPress={onAddMedication}>
          <Text style={styles.addText}>+ Add Medication</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default MedicationForm;

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
    paddingBottom: 110,
  },
  sectionLabel: {
    color: "#3E4946",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 14,
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
    color: "#3E4946",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  medicationCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  cardHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  cardTitleWrap: {
    flex: 1,
  },
  medicationName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  medicationMeta: {
    color: "#3E4946",
    fontSize: 13,
    marginTop: 2,
  },
  headerDelete: { alignItems: "center", height: 40, justifyContent: "center", position: "absolute", right: 14, width: 40 },
  selectedCard: { borderColor: "#00796B", borderWidth: 2 },
  disabledButton: { opacity: 0.45 },
  detailText: {
    color: "#3E4946",
    fontSize: 13,
    lineHeight: 20,
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
    backgroundColor: "#00796B",
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
