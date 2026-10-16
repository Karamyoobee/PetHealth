import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { colors, spacing, radius } from "@theme";
import { Pet } from "../../../types";

type cardProps = {
    icon: React.ReactNode;
    value: string;
    label: string;
};

export function DetailCard({icon, value, label}: cardProps){
    return(
        <View style={styles.container}>
            {icon}
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 5,
    },

    value: {
        fontStyle: 'normal',
        fontSize: 20,
        fontWeight: '700',
    },

    label: {
        fontSize: 15,
        color:'white',
    },
})
