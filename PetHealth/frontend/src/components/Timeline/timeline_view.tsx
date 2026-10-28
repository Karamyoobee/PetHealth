import React from "react";
import MainHeader from "./header";
import {View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

type EntryType = 'logged' | 'visit' | 'rx' | 'note';

//Entry Type
type TimelineEntry = {
    id: string;
    date: string;
    sortKey: number;
    type: EntryType;
    title: string;
    subtitle: string;
    pet: string;
};

type TimelineProps = {
    onBack: () => void;
};

export default function Timeline({onBack}: TimelineProps){
    return(
        <View style={styles.screen}>

            {/*Header - Text only: Pet Timeline*/}
            <MainHeader title="Pet Timeline"/>

            <ScrollView>
             
            {/*Timeline Heading: Timeline */}
            <Text style={styles.heading_text}>Timeline</Text>

            {/*Pet via Chip*/}

            {/*Pop-up Cards*/}

            </ScrollView>
           

            {/*Bottom Navigation Bar*/}

        </View>
    )
}

//Styles Map view
const styles = StyleSheet.create({

    //Main Screen 
    screen:{
        flex:1,
        backgroundColor: '#F6F4EF',
    }, 

    //Heading Text: 
    heading_text:{
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 16,
    },

    pet_chip:{

    },

    pet_chip_text:{

    },

    card:{
        backgroundColor:'#fff',
        borderRadius:12,
        borderWidth:1,
        borderColor:'#E8E4DC',
        padding: 16,
        marginBottom: 10
    },



})