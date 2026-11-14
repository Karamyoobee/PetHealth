import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import type { Pet, VetVisit } from "../../types";

type Props = {
  onBack?: () => void;
  onScheduleVisit?: () => void;
  petId?: string | null;
  onSelectPet?: (petId: string) => void;
  onRecordsChanged?: () => Promise<void>;
};

export function VetVisitForm({ onBack, onScheduleVisit, petId, onSelectPet, onRecordsChanged }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState(petId ?? "");
  const [visits, setVisits] = useState<VetVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedVisitIds, setSelectedVisitIds] = useState<string[]>([]);

  const loadPets = useCallback(async () => {
    // Keep the selected pet when returning from scheduling a visit.
    setLoading(true);
    setMessage(null);
    try {
      const savedPets = await api.listCurrentUserPets();
      setPets(savedPets);
      const nextPetId = selectedPetId || savedPets[0]?.id || "";
      setSelectedPetId(nextPetId);
      if (nextPetId) onSelectPet?.(nextPetId);

      if (!nextPetId) {
        setVisits([]);
        setMessage("Add a pet before scheduling vet visits.");
        return;
      }

      setVisits(await api.listVetVisits(nextPetId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load vet visits.");
    } finally {
      setLoading(false);
    }
  }, [selectedPetId, onSelectPet]);

  const loadVisits = useCallback(async (petId: string) => {
    // Fetch visits for the chosen pet and keep any error visible on this screen.
    setLoading(true);
    setMessage(null);
    try {
      setVisits(await api.listVetVisits(petId));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load vet visits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const selectPet = (petId: string) => {
    // Keep the selected pet when the user opens the scheduling screen.
    setSelectedPetId(petId);
    onSelectPet?.(petId);
    loadVisits(petId);
  };

  const toggleSelection = (visitId: string) => {
    // A second tap lets the user remove a visit from the current selection.
    setSelectedVisitIds((current) => current.includes(visitId) ? current.filter((id) => id !== visitId) : [...current, visitId]);
  };

  const confirmDeleteSelected = () => {
    if (!selectedVisitIds.length) return;
    Alert.alert("Delete selected vet visits?", "Their linked reminders will be deleted too. Deleted records stay in your history.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await Promise.all(visits.filter((item) => selectedVisitIds.includes(item.id)).map((item) => api.deleteVetVisit(item.petId, item.id)));
          // Remove the cards straight away so the screen matches the saved change.
          setVisits((current) => current.filter((item) => !selectedVisitIds.includes(item.id)));
          setSelectedVisitIds([]);
          setSelectionMode(false);
          try {
            await onRecordsChanged?.();
          } catch {
            setMessage("The vet visit was deleted, but phone notifications could not refresh yet.");
          }
        } catch (error) {
          setMessage(error instanceof Error ? error.message : "Could not delete the vet visit.");
          Alert.alert("Could not delete vet visits", error instanceof Error ? error.message : "Please try again.");
          setSelectedVisitIds([]);
          setSelectionMode(false);
        }
      } },
    ]);
  };

  const { upcomingVisits, pastVisits } = useMemo(() => {
    // Use the appointment's local date and time to group the visit cards.
    const now = Date.now();

    return visits.reduce(
      (groups, visit) => {
        const scheduledAt = new Date(`${visit.appointmentDate}T${visit.appointmentTime || "00:00"}:00`).getTime();
        if (!Number.isNaN(scheduledAt) && scheduledAt >= now) {
          groups.upcomingVisits.push(visit);
        } else {
          groups.pastVisits.push(visit);
        }
        return groups;
      },
      { upcomingVisits: [] as VetVisit[], pastVisits: [] as VetVisit[] },
    );
  }, [visits]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => selectionMode ? (setSelectionMode(false), setSelectedVisitIds([])) : onBack?.()} style={styles.backButton}>
          <Ionicons name={selectionMode ? "close" : "chevron-back"} size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{selectionMode ? `${selectedVisitIds.length} selected` : "Vet Visits"}</Text>
        <TouchableOpacity onPress={() => selectionMode ? confirmDeleteSelected() : setSelectionMode(true)} disabled={selectionMode && !selectedVisitIds.length} style={[styles.headerDelete, selectionMode && !selectedVisitIds.length && styles.disabledButton]}>
          <Ionicons name="trash-outline" size={21} color="#B42318" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.scheduleButton} onPress={onScheduleVisit}>
          <Text style={styles.scheduleText}>+ Schedule Visit</Text>
        </TouchableOpacity>

        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={selectPet} />

        <Text style={styles.sectionTitle}>Upcoming</Text>
        {loading ? (
          <LoadingCard />
        ) : upcomingVisits.length > 0 ? (
          upcomingVisits.map((visit) => <VisitCard key={visit.id} visit={visit} selected={selectedVisitIds.includes(visit.id)} selectionMode={selectionMode} onSelect={() => toggleSelection(visit.id)} onLongPress={() => { setSelectionMode(true); setSelectedVisitIds((current) => current.includes(visit.id) ? current : [...current, visit.id]); }} />)
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No upcoming visits"
            text={message ?? "Scheduled vet appointments will appear here after you add them."}
          />
        )}

        <Text style={[styles.sectionTitle, styles.pastTitle]}>Past Visits</Text>
        {loading ? (
          <LoadingCard />
        ) : pastVisits.length > 0 ? (
          pastVisits.map((visit) => <VisitCard key={visit.id} visit={visit} selected={selectedVisitIds.includes(visit.id)} selectionMode={selectionMode} onSelect={() => toggleSelection(visit.id)} onLongPress={() => { setSelectionMode(true); setSelectedVisitIds((current) => current.includes(visit.id) ? current : [...current, visit.id]); }} />)
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No visit history yet"
            text="Past diagnoses, treatments, and clinic notes will appear after visits are recorded."
          />
        )}
      </ScrollView>
    </View>
  );
}

function LoadingCard() {
  return (
    <View style={styles.emptyState}>
      <ActivityIndicator color="#00796B" />
    </View>
  );
}

function VisitCard({ visit, selected, selectionMode, onSelect, onLongPress }: { visit: VetVisit; selected: boolean; selectionMode: boolean; onSelect: () => void; onLongPress: () => void }) {
  return (
    <TouchableOpacity delayLongPress={2000} onLongPress={onLongPress} onPress={selectionMode ? onSelect : undefined} style={[styles.visitCard, selected && styles.selectedCard]}>
      <View style={styles.visitHeader}>
        <Ionicons name="calendar-outline" size={22} color="#00796B" />
        <View style={styles.visitTitleWrap}>
          <Text style={styles.visitTitle}>{visit.reason || "Vet visit"}</Text>
          <Text style={styles.visitMeta}>
            {visit.appointmentDate} {visit.appointmentTime || ""}
          </Text>
        </View>
      </View>
      <Text style={styles.detailText}>Clinic: {visit.clinicName || "Not added"}</Text>
      {visit.notes ? <Text style={styles.detailText}>Notes: {visit.notes}</Text> : null}
    </TouchableOpacity>
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
    color: "#3E4946",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  visitCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2DED7",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
  },
  visitHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  visitTitleWrap: {
    flex: 1,
  },
  visitTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
  },
  visitMeta: {
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
});
