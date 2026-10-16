import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, spacing, radius } from "@theme";


type ButtonProps = {
    label: string;
    onPress?: () => void;
    disabled?: boolean;
    icon: React.ReactNode,
};

export function QuickButton({ icon, label, onPress, disabled}: ButtonProps){
    return(
        <Pressable style={({ pressed }) => 
        [styles.card, pressed && {opacity: 0.7}, disabled && {opacity: 0.5}]} 
        onPress={onPress}
        disabled={disabled}>

        <View style={styles.iconbackground}>{icon}</View>
        <Text style={styles.label}>{label}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    Container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 12,
        marginBottom: 10, 
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'flex-start',
        gap: 10,   
        width: '48%',
    },

    iconbackground: {
        width: 40,
        height: 40, 
        borderRadius: 20, 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'lightgreen',
    },

    iconCircle: {
        width:36, 
        height: 36, 
        borderRadius: 18, 
        backgroundColor: "#DCEFE9",
        alignItems: "center",
        justifyContent: 'center',
    },

    label: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
        flexShrink: 1,
    },

})