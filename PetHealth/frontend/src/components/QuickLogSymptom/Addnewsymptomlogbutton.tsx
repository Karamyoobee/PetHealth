import React from "react";
import {
    View, Image, Text, Pressable, StyleSheet, 
} from "react-native";

//Add New symptom Log Button
type AddNewSymptomButtonProps = {
    onPress: () => void;
}

//Main Reusable Component for Adding a new symptom log 
export default function NewSymptom({ onPress}: AddNewSymptomButtonProps){
    return (
        <Pressable
        onPress={onPress}
         style={({ pressed }) => [style.button, pressed && {opacity: 0.8}]}
        >
            <Text style={style.text}>New Symptom Log</Text>
        </Pressable>
    )
}

const style = StyleSheet.create({
    button: {
        backgroundColor: "#1F7A6C",
        borderRadius: 30,
        width:150,
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