import React from "react";
import { useState } from "react";
import { SafeAreaView, StyleSheet, Text, Pressable, View} from "react-native";
import { StatusBar } from "expo-status-bar";
import {Image} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { QuickButton } from "../components/Quickaccess_buttons";
import { DetailCard } from "../components/Detailcard";
import Tabbar, { BottomNavBar } from '../components/Tabbar';
import PetHeader from "../components/petheader";

import { Pet } from "../../../types";
import { api } from "../../../api/client";

import { colors, spacing } from "@theme";
import PhotoCover from "../components/Petimage";

const QuickAccessActions = [
    {label: "Log Symptom", icon:<Feather name="clipboard" size={20} />, route: "Log Symptom" },
    {}
]

const PetProfileScreen = () => {
    const [pet, setPet] = useState<Pet|null>(null);
    const [error, setError] = useState<string|null>(null);

    return(
        <View style={styles.root}>
            <PhotoCover >

            </PhotoCover>
            <Text>{setPet?.name}</Text>

            <Text>Quick Access</Text>

            <BottomNavBar/>

        </View>
    )
}

const styles = StyleSheet.create({
    root:{
        flex: 1,
        backgroundColor: 'white',
    },

    main: {flex: 1, backgroundColor: '#FEFBEA'},
    statistics: {flexDirection: 'row', gap: 8, paddingHorizontal: 16},
    section1: {fontSize: 16, fontWeight:'600', margin: 16},
    grid:{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 16,
    },
})

export default PetProfileScreen;