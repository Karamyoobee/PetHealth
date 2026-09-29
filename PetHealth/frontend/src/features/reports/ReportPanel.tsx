import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onBack?: () => void;
  onExport?: () => void;
};

export function ReportPanel({ onBack, onExport }: Props) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Report</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={34} color="#00796B" />
          <Text style={styles.emptyTitle}>No report data yet</Text>
          <Text style={styles.emptyText}>
            Add a pet and health records before exporting a vet-ready PDF.
          </Text>
        </View>

        <Text style={styles.label}>Report will include</Text>
        <View style={styles.includeCard}>
          <ReportItem label="Pet profile" />
          <ReportItem label="Vet visit history" />
          <ReportItem label="Medication and treatment tracker" />
          <ReportItem label="Reminder schedule" isLast />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity disabled style={[styles.exportButton, styles.disabledButton]} onPress={onExport}>
          <Ionicons name="download-outline" size={17} color="#FFFFFF" />
          <Text style={styles.exportText}>Export PDF</Text>
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
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
  label: {
    color: "#60666D",
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
