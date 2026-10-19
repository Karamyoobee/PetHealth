import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Pet } from "../types";

type Props = {
  pets: Pet[];
  selectedPetId: string;
  onSelectPet: (petId: string) => void;
  label?: string;
  emptyText?: string;
};

function petImage(pet: Pet) {
  return pet.imageUrl ?? pet.photoUrl ?? pet.avatarUrl;
}

export function PetSelector({
  pets,
  selectedPetId,
  onSelectPet,
  label = "SELECT PET",
  emptyText = "No pets found",
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {pets.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
          {pets.map((pet) => {
            const selected = pet.id === selectedPetId;
            const image = petImage(pet);

            return (
              <TouchableOpacity key={pet.id} style={styles.petOption} onPress={() => onSelectPet(pet.id)}>
                <View style={[styles.avatarRing, selected && styles.avatarRingSelected]}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Ionicons name={pet.species === "Cat" ? "logo-octocat" : "paw"} size={24} color="#3E4946" />
                    </View>
                  )}
                </View>
                <Text style={[styles.petName, selected && styles.petNameSelected]} numberOfLines={1}>
                  {pet.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyRow}>
          <View style={styles.emptyAvatar}>
            <Ionicons name="paw-outline" size={24} color="#3E4946" />
          </View>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}
    </View>
  );
}

export default PetSelector;

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  label: {
    color: "#3E4946",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  petRow: {
    gap: 16,
    paddingRight: 8,
  },
  petOption: {
    alignItems: "center",
    width: 58,
  },
  avatarRing: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarRingSelected: {
    borderColor: "#238575",
  },
  avatarImage: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: "#E5E1DB",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  petName: {
    color: "#3E4946",
    fontSize: 11,
    marginTop: 6,
    maxWidth: 64,
    textAlign: "center",
  },
  petNameSelected: {
    color: "#111827",
    fontWeight: "800",
  },
  emptyRow: {
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    width: 76,
  },
  emptyAvatar: {
    alignItems: "center",
    backgroundColor: "#E5E1DB",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  emptyText: {
    color: "#3E4946",
    fontSize: 11,
    textAlign: "center",
  },
});
