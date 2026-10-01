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

//Styles for Primary Button - Save Pet 
const styles = StyleSheet.create({
  button:{
    backgroundColor: colors.secondary, 
    borderRadius: 10, 
    height:50,
    alignItems: "center",
    justifyContent: 'center',
    width: '100%',
    marginTop: 220,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: {
    color: colors.white,
    fontWeight: "700", 
    fontSize: 16,
  },

  saveButton: {
    height: 50, 
    backgroundColor: '#1F7A6C',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

