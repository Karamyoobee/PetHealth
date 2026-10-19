import React from "react";//Essential React Import
import { Pressable, Text, StyleSheet, View } from "react-native";

//Props - Used to collect user data and Card Details
type ButtonProps = {
    label: string;//Text displaed beneath icon
    onPress?: () => void;//Function for Button
    disabled?: boolean;//When Tapped, if true - ignored taps and appears faded
    icon: React.ReactNode,//icons from @expo/vector-icons
};

//Main Function - Reusable format of Quick Access Buttons Style, Icon and Label
export function QuickButton({ icon, label, onPress, disabled}: ButtonProps){
    return(
        <Pressable style={({ pressed }) => //Pressed Style 
        //Faded slightly - 0.7 & Disabled: Fadeded by (0.5)
        [styles.card, pressed && {opacity: 0.7}, disabled && {opacity: 0.5}]} 
        onPress={onPress}
        disabled={disabled}>{/*Taps Blocked when disabled*/}
        {/*Icon Background Style + Icon*/}
        <View style={styles.iconbackground}>{icon}</View>
        <Text style={styles.label}>{label}</Text>{/**/}
        </Pressable>
    )
}

const styles = StyleSheet.create({

    //Main Quick Access Card (Wraps icon and label for Button)
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 12,
        marginBottom: 8,        
        shadowColor: 'black',   //Shadow:Elevation used for Android Style
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'flex-start',   //Align Icon and text to left of Card
        gap: 8,                     //Space between icon and label
        width: '48%',               //2 Cards fit in 1 row with small gap
        marginTop: 18, 
    },

    //Circle - Light green behind icon
    iconbackground: {
        width: 40,
        height: 40, 
        borderRadius: 20, 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DCEFE9',
    },

    //Label : Text for Quick Access Button
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: 'black',
        flexShrink: 1,
    },

})