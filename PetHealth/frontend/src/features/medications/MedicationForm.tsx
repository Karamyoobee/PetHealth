import React, { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import type { Medication, Pet } from "../../types";

type Props = {
  onBack?: () => void;
  onAddMedication?: () => void;
};

export function MedicationForm({ onBack, onAddMedication }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [medications, setMedications] = useState<Medication[]>([]);
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
  }, [selectedPetId]);

  const loadMedications = useCallback(async (petId: string) => {
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
    setSelectedPetId(petId);
    loadMedications(petId);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={selectPet} />

        <Text style={styles.sectionLabel}>ACTIVE MEDICATIONS</Text>
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#00796B" />
          </View>
        ) : medications.length > 0 ? (
          medications.map((medication) => (
            <View key={medication.id} style={styles.medicationCard}>
              <View style={styles.cardHeader}>
                <Ionicons name="medkit-outline" size={22} color="#00796B" />
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.medicationMeta}>{medication.dosage || "No dosage added"}</Text>
                </View>
              </View>
              {medication.purpose ? <Text style={styles.detailText}>Purpose: {medication.purpose}</Text> : null}
              <Text style={styles.detailText}>Frequency: {medication.schedule || "Not set"}</Text>
              <Text style={styles.detailText}>Time: {medication.reminderTime || "Not set"}</Text>
              <Text style={styles.detailText}>
                Dates: {medication.startDate || "Not set"} to {medication.endDate || "Not set"}
              </Text>
              {medication.instructions ? <Text style={styles.detailText}>Notes: {medication.instructions}</Text> : null}
            </View>
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

      <View style={styles.footer}>
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
