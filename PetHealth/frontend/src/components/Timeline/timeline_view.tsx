import react from "react";
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


export default function Timeline(){
    return(
        <View>

            {/*Header - Text only: Pet Timeline*/}

            {/*Timeline Heading: Timeline */}

            {/*Pet via Chip*/}

            {/*Pop-up Cards*/}

            {/*Bottom Navigation Bar*/}

        </View>
    )
}

//Styles Map view
const style = StyleSheet.create({
    
    heading:{
        fontSize: 24,
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