import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme";

type Props = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
};

export function Button({ title, onPress, variant = "primary" }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, variant === "secondary" && styles.secondary]}
      onPress={onPress}
    >
      <Text style={[styles.text, variant === "secondary" && styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  secondary: {
    backgroundColor: colors.primarySoft,
  },
  text: {
    color: colors.white,
    fontWeight: "800",
  },
  secondaryText: {
    color: colors.primary,
  },
});
