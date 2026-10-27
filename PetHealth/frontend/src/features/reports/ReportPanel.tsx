import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { api } from "../../api/client";
import PetSelector from "../../components/PetSelector";
import type { Pet } from "../../types";
import { exportPetReport } from "./exportReport";

type Props = {
  onBack?: () => void;
};

export function ReportPanel({ onBack }: Props) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadPets() {
      setLoading(true);
      setError(null);
      try {
        const savedPets = await api.listCurrentUserPets();
        if (!mounted) return;
        setPets(savedPets);
        setSelectedPetId((currentPetId) => currentPetId || savedPets[0]?.id || "");
      } catch (err) {
        if (mounted) {
          setPets([]);
          setSelectedPetId("");
          setError(err instanceof Error ? err.message : "Could not load your pets.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPets();

    return () => {
      mounted = false;
    };
  }, [loadAttempt]);

  const selectedPet = pets.find((pet) => pet.id === selectedPetId);
  const exportReport = async () => {
    if (!selectedPet || exporting) return;
    setExporting(true);
    setError(null);
    try {
      await exportPetReport(selectedPet);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export the report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity disabled={exporting} onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Report</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={(petId) => { if (!exporting) setSelectedPetId(petId); }} />

        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={34} color="#00796B" />
          {loading ? <ActivityIndicator color="#00796B" /> : null}
          <Text style={styles.emptyTitle}>{loading ? "Loading your pets..." : selectedPet ? `${selectedPet.name}'s Health Report` : "No pet selected"}</Text>
          <Text style={styles.emptyText}>
            {selectedPet ? "Export this pet's saved health records as a PDF. Sections without records will be marked as empty." : "Add a pet before exporting a health report."}
          </Text>
          {error ? (
            <TouchableOpacity disabled={exporting} onPress={() => pets.length ? exportReport() : setLoadAttempt((attempt) => attempt + 1)}>
              <Text style={styles.errorText}>{error} Tap to retry.</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.label}>Report will include</Text>
        <View style={styles.includeCard}>
          <ReportItem label="Pet profile" />
          <ReportItem label="Vet visit history" />
          <ReportItem label="Medication and treatment tracker" />
          <ReportItem label="Reminder schedule" />
          <ReportItem label="Vaccination records" />
          <ReportItem label="Symptoms and weight history" />
          <ReportItem label="Predictive flags" isLast />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!selectedPet || loading || exporting}
          style={[styles.exportButton, (!selectedPet || loading || exporting) && styles.disabledButton]}
          onPress={exportReport}
        >
          {exporting ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="download-outline" size={17} color="#FFFFFF" />}
          <Text style={styles.exportText}>{exporting ? "Exporting..." : "Export PDF"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReportItem({ label, isLast = false }: { label: string; isLast?: boolean }) {
  return (
    <View style={[styles.includeRow, isLast && styles.includeRowLast]}>
      <Text style={styles.includeText}>{label}</Text>
      <Ionicons name="checkmark-circle" size={20} color="#00796B" />
    </View>
  );
}

export default ReportPanel;

const styles = StyleSheet.create({
  errorText: {
    color: "#B42318",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
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
    paddingBottom: 116,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 28,
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
  label: {
    color: "#3E4946",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  includeCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DDD8D0",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  includeRow: {
    alignItems: "center",
    borderBottomColor: "#ECE7DF",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 56,
    justifyContent: "space-between",
    paddingHorizontal: 18,
  },
  includeRowLast: {
    borderBottomWidth: 0,
  },
  includeText: {
    color: "#111827",
    fontSize: 14,
  },
  footer: {
    backgroundColor: "#FAF8F4",
    bottom: 0,
    left: 0,
    padding: 20,
    position: "absolute",
    right: 0,
  },
  exportButton: {
    alignItems: "center",
    backgroundColor: "#00796B",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    height: 54,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  exportText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
