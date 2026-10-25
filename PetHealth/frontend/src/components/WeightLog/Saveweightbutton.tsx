import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors} from "@theme";
import AntDesign from '@expo/vector-icons/AntDesign';
import {ReactNode} from 'react';

//Button Props
type SaveButtonProps = {
    label: string;
    onPress?: () => void;
    disabled?:boolean;
    icon: ReactNode;
};

//Main Function - Save Weight Button
export function SaveWeight({ label, onPress, disabled, icon }: SaveButtonProps){
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
          {icon}
          <Text style={styles.label}>{label}</Text>
       </Pressable>  
    ); 
}

//Styles for Save Entry Button - Save Weight Log
const styles = StyleSheet.create({
  //Main Button Style
  button:{
    backgroundColor: colors.secondary, 
    borderRadius: 10, 
    height:50,
    alignItems: "center",
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
    flexDirection: 'row',
    gap: 8,
  },

  //Button: Pressed
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },

  //Label Style
  label: {
    color: colors.white,
    fontWeight: "700", 
    fontSize: 16,
  },

});

