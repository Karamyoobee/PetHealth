import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';

//Header Type Props
type headerprops = {
    onBack: () => void;//Return to previous screen
    title: string;//display text used inside header screen
}

//Main Function - Main Header
export default function MainHeader({onBack, title}: headerprops) { 
    return(
        <View style={styles.header}>
            {/*Icon */}
            <View style={styles.innerheader}>
                {/*Back Button - return to previous screen*/}
                <TouchableOpacity onPress={onBack}
                    hitSlop={{top: 12, bottom: 12, left: 12, right:12}}//Control button 
                    style={styles.Backbutton}
                >   {/*Icon*/}
                    <AntDesign name="arrowleft" size={24} color="black" />
                </TouchableOpacity>                
                
            </View>
                <Text style={styles.headerText}>{title}</Text>
        </View>


    )
}

//Styles for Header 
const styles = StyleSheet.create({
    //Button Style
    Backbutton:{
        zIndex: 2,
        padding: 4,
    },

    //Inside Header Section
    innerheader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    //Main Header Style
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E4E2DA",
        paddingVertical: 12,
    },

    //Header Text 
    headerText: {
        fontWeight: '600',
        fontSize: 17,
        color: '#333',
        position:'absolute',
        width: '100%',
        textAlign: 'center',
    }
});