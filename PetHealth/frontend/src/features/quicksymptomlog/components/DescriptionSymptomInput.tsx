import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, spacing, radius } from "@theme";

type DescriptionSymptomInputProps = TextInputProps & {
  label: string;
};

export function TextField({ label, ...props }: DescriptionSymptomInputProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 13, fontWeight: "700" },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  multiline:{
    minHeight: 100, 
    paddingTop: spacing.sm,
    textAlignVertical: "top",
  },
});

export default DescriptionSymptomInput;