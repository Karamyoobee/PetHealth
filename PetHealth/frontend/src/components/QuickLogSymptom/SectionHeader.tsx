import React from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';//Essential React Native Components
import FontAwesome from '@expo/vector-icons/FontAwesome';//Declear Icon set
import AntDesign from '@expo/vector-icons/AntDesign';//Declear Icon - Back Arrow

//Pet Header Props  - used to go back to previous screen
type PetHeaderProps = {
    onBack: () => void;
    title:string,
};

//Frontend compnents Function - UI Build Screen
export default function SectionHeader({ onBack, title }: PetHeaderProps) { 

    return(
        <View style={styles.header}>
                    <Text style={styles.headerText}>Log Symptom</Text>

            {/*Main Style - Display Header for Screen*/}
            <View style={styles.innerheader}>
        <Pressable onPress={onBack} >
            <AntDesign name="arrowleft" size={24} color="black" />
            {title}
        </Pressable>   
                
            </View>{/*Header Text - Text Centered inside Header Section */}        
        </View>


    )
}

//Main Style Sheet
const styles = StyleSheet.create({

    //Row for Back Arrow Icon
    innerheader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    //Header Bar Style - White Background with thin bottom border
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

    //Title Text - stretched for full width and center position
    headerText: {
        fontWeight: '600',
        fontSize: 17,
        color: '#333',
        position:'absolute',
        width: '100%',
        textAlign: 'center',
        pointerEvents: 'none',
    }
});