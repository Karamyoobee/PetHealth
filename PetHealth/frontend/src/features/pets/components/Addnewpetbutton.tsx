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
            <Text style={style.text}>+Add</Text>
        </Pressable>
    )
}

const style = StyleSheet.create({
    button: {
        backgroundColor: "orange",
        borderRadius: 30,
        width:100,
        height:50,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
        marginLeft:280, 
        marginTop: -60,
    },

    text: {
        fontSize: 15,
        color: '#FFFFFF',
    },
})