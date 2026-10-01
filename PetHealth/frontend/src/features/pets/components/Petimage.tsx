import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "@theme";

type Props = { 
    uri?: string; 
    onChange: (uri: string) => void; 
    size?: number;
};

export default function PetImage({ uri, onChange, size = 120 }: Props){
    const pick = async() => { 
        //ToDo - 
    };

    return (
        //Add (Press button > Image + absolute position + badge on photo frame)
        null
    )
}

//Pet Profile - Circular photo frame 
//+ Badge on photo frame 
