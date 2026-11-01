import React from "react";
import {
    View, Image, Text, Pressable, StyleSheet, 
} from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pet } from "../../../types";
import { api } from "../../../api/client";

type AddButtonProps = {
    onPress: () => void;
}


export default function NewAnalysis({ onPress}: AddButtonProps){
    return (
        <Pressable
        onPress={onPress}
         style={({ pressed }) => [styles.button, pressed && {opacity: 0.8}]}
        >
            <FontAwesome name="search" size={24} color="white" style={styles.icon} />
            <Text style={styles.text}>Run New Analysis</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({

    //Main container style 
    main_container:{
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 12,
    },

    //Run Simple Short Predictive Weight Analysis
    button: {
        backgroundColor: "#1F7A6A",
        borderRadius: 12,
        height:48,
        flexDirection:"row",
        alignItems: "center",
        justifyContent: "center",
    },

    text: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    
    //Icon style 
    icon: {
        marginRight: 9,
    }
})