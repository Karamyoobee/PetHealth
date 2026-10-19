import React from "react";//React Import - Required for JSX and ReactNode Type
import {Text, StyleSheet, View } from "react-native";//React Native Essential Build Blocks for Text and Layout Usage

//Props - Data to be used for each Statistics Card for the Pet Profile Screen
type cardProps = {
    icon: React.ReactNode;//Element - Icon shown for top of Card
    value: string;//Heading for Stat Card
    label: string;//caption under Value
};

//Reusable Stat Card - Weight, Age, Health Status on Pet Profile
export function DetailCard({icon, value, label}: cardProps){
    return(
        //Display Main Pet Health Container
        <View style={styles.container}>
            {icon}{/* Display Icon First */}
            <Text style={styles.value}>{value}</Text>{/*2. Display and render Pet Detail*/}
            <Text style={styles.label}>{label}</Text>{/*3. Display Pet Heading for Card*/}
        </View>
    )
}

//Main StyleSheet - Control Layout, Color, Text of Detail Card
const styles = StyleSheet.create({

    //main container for detail card
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        paddingVertical: 5,
    },

    //Display rendered Pet Detail from (Mongodb Database)
    value: {
        fontStyle: 'normal',
        fontSize: 20,
        fontWeight: '700',
    },

    //Heading - Statistics Card
    label: {
        fontSize: 15,
        color:'grey',
    },
})
