import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@theme";


type Props = {
    label: string;
    onPress?: () => void;
    disabled?:boolean;
};

export function SaveWeight({ label, onPress, disabled }: Props){
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

//Styles for Save Entry Button - Save Weight Log
const styles = StyleSheet.create({
  button:{
    backgroundColor: colors.secondary, 
    borderRadius: 10, 
    height:50,
    alignItems: "center",
    justifyContent: 'center',
    width: '100%',
    marginTop: 340,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: {
    color: colors.white,
    fontWeight: "700", 
    fontSize: 16,
  },

});

