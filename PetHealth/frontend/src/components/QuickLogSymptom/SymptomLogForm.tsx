// Library Import 
import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@theme";

//Set Functions 
type LogSymptomFormProps = {
    label: string;
    value: string; 
    onChangeText: (text: string) => void;
    placeholder?: string;
    
}

//Layout of main like form structure

// Styles Declaration