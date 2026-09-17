import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@theme";


type Props = {
    label: string;
    onPress?: () => void;
    disabled?:boolean;
};

export function PrimaryButton({ label, onPress, disabled }: Props){
return (
    <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
        styles.button, 
        pressed && styles.pressed, 
        disabled && styles.disabled,
        ]}
        >
          <Text style={styles.label}>{label}</Text>
       </Pressable>  
    ); 
}

const styles = StyleSheet.create({
  button:{
    backgroundColor: colors.secondary, 
    paddingVertical: spacing.md + 2, 
    borderRadius: 15, 
    width: 200,
    height:90,
    alignItems: "center",
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: {
    color: colors.white,
    fontWeight: "700", 
    fontSize: 16,
  },
});

