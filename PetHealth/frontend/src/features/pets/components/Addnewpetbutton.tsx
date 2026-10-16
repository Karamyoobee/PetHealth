import React from "react";
import {
    View, Image, Text, TouchableOpacity, StyleSheet, 
} from "react-native";
import { Pet } from "../../../types";
import { api } from "../../../api/client";

export default function AddButton(){
    return (
        <TouchableOpacity
         style={style.button}
         activeOpacity={0.8}
        >
            <Text style={style.text}>+Add</Text>
        </TouchableOpacity>
    )
}

const style = StyleSheet.create({
    button: {
        backgroundColor: "orange",
        borderRadius: 20,
        width:60,
        height:60,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-start",
    },

    text: {
        fontSize: 15,
        color: '#FFFFFF',
    },
})