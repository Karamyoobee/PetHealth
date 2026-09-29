import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

export function PetForm() {
  return (
    <View style={styles.screen}>
      <View style={styles.emptyState}>
        <Ionicons name="paw-outline" size={34} color="#00796B" />
        <Text style={styles.emptyTitle}>No pets yet</Text>
        <Text style={styles.emptyText}>Saved pet profiles will appear here once pet management is connected.</Text>
      </View>
    </View>
  );
}

export default PetForm;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF8F4",
    flex: 1,
    padding: 20,
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
