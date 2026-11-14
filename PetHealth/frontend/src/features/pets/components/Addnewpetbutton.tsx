import React from "react";
import {
    View, Image, Text, Pressable, StyleSheet, 
} from "react-native";
import { Pet } from "../../../types";
import { api } from "../../../api/client";

type AddButtonProps = {
    onPress: () => void;
}


export default function AddButton({ onPress}: AddButtonProps){
    return (
        <Pressable
        onPress={onPress}
         style={({ pressed }) => [style.button, pressed && {opacity: 0.8}]}
        >
            <Text style={style.text}>+ Add</Text>
        </Pressable>
    )
}

const style = StyleSheet.create({
    button: {
        backgroundColor: "#F59E42",
        borderRadius: 18,
        minWidth:76,
        height:36,
        alignItems: "center",
        justifyContent: "center",
    },

    text: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
    },
})
