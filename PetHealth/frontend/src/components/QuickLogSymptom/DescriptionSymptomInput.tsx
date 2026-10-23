import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, spacing, radius } from "@theme";

type DescriptionSymptomInput = TextInputProps & {
  label: string;
};

export function SymptomTextField({ label, ...props }: DescriptionSymptomInput) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Describe Symptoms</Text>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({

  title: {
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight:'600',
  },

  wrap: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 13, fontWeight: "700" },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 120,
    paddingHorizontal: spacing.md,
  }
});

export default DescriptionSymptomInput;