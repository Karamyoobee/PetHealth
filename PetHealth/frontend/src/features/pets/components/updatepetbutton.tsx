import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Feather from '@expo/vector-icons/Feather';
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
            <Feather name="edit-2" size={17} color="#087F70" />
        </Pressable>
    )
}

const style = StyleSheet.create({
    button: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        width:36,
        height:36,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-end",
        marginRight:18,
        marginTop: -54,
        borderWidth: 1,
        borderColor: '#E2DED7',
        elevation: 2,
    },

})
