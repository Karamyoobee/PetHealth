import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import type { Pet, VetVisit } from "../../types";

type Props = {
  onBack?: () => void;
  onScheduleVisit?: () => void;
};

export function VetVisitForm({ onBack, onScheduleVisit }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [visits, setVisits] = useState<VetVisit[]>([]);
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
  }, [selectedPetId]);

  const loadVisits = useCallback(async (petId: string) => {
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
    setSelectedPetId(petId);
    loadVisits(petId);
  };

  const { upcomingVisits, pastVisits } = useMemo(() => {
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
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vet Visits</Text>
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
          upcomingVisits.map((visit) => <VisitCard key={visit.id} visit={visit} />)
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
          pastVisits.map((visit) => <VisitCard key={visit.id} visit={visit} />)
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

function VisitCard({ visit }: { visit: VetVisit }) {
  return (
    <View style={styles.visitCard}>
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
  detailText: {
    color: "#3E4946",
    fontSize: 13,
    lineHeight: 20,
  },
});
