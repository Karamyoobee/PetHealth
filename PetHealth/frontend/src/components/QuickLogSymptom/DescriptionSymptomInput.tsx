import React from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, spacing, radius } from "@theme";

//Text Input - Type Props
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

//Styles Sheet for reusable component
const styles = StyleSheet.create({

  //Heading for reusable component
  title: {
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight:'600',
  },

  //Wrapped style
  wrap: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 13, fontWeight: "700" },
  input: {
    backgroundColor: colors.white,//Background color
    borderColor: colors.border,//Border Color
    borderRadius: 8,//Border Radius
    borderWidth: 1,//Width of Border
    color: colors.text,//Colors 
    minHeight: 120,//Height
    paddingHorizontal: spacing.md,
    textAlignVertical: 'top',//Ensure Text starts from top not middle
    paddingTop: 12,//space so text is not touching border of container
  }
});

export default DescriptionSymptomInput;