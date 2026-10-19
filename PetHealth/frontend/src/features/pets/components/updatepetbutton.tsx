import React from "react";
import {
    View, Image, Text, Pressable, StyleSheet, 
} from "react-native";
import { Pet } from "../../../types";
import { api } from "../../../api/client";

type UpdatePetButtonProps = {
    onPress: () => void;
}


export default function UpdatePet({ onPress}: UpdatePetButtonProps){
    return (
        <Pressable
        onPress={onPress}
         style={({ pressed }) => [style.button, pressed && {opacity: 0.8}]}
        >
            <Text style={style.text}>Update</Text>
        </Pressable>
    )
}

const style = StyleSheet.create({
    button: {
        backgroundColor: "#238B45",
        borderRadius: 34,
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