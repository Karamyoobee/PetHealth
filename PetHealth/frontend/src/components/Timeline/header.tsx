import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';

//Props for Header Section
type headerprops = {
    title: string;
}

//Reusable Component for Header inside Timeline Screen
export default function MainHeader({ title}: headerprops) { 
            {/*Header Title only - reusable via the main Predictive Flagging Screen */}
    return( 
        <View style={styles.header}>
            <View style={styles.innerheader}>
            </View>
                <Text style={styles.headerText}>{title}</Text>
        </View>

    )
}

//Main StyleSheet for Header Component
const styles = StyleSheet.create({

    //Inner layer header style
    innerheader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    //Main Header style
    header: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: "#E4E2DA",
        paddingVertical: 12,
    },

    //Text for Header Style
    headerText: {
        fontWeight: '600',
        fontSize: 17,
        color: '#333',
        textAlign: 'center',
        pointerEvents: 'none',
    }
});
