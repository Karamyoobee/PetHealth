import React from 'react';
import {Text, View, StyleSheet, Pressable} from 'react-native'
import { Pet } from '../../types';
import { api } from '../../api/client';

//declare Props 
type ChipSelectPetprops = {
    options: string [];//List of all Pets (from backend)
    value: string; //Selected Pet
    onChange: (option: string) => void;//chip calls when tapped
    selectedColor?: string;//colord filled for selected chip
}

export default function SelectPet({options, value, onChange, selectedColor, }: ChipSelectPetprops){
    return(

    <View style={styles.container}>
        { options.map((option) => (
            <Pressable onPress={() => onChange(option)} style={[styles.chip, option === value && styles.selectedChip]} key={option}>
                <Text style={[styles.petname, option === value && styles.selectedpetname]}>{option}</Text>
            </Pressable>
        ))}
    </View>

    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',//gap between rows for chips
        gap: 9,
    },

    chip: {
        backgroundColor: 'white',
        borderColor: '#E0E0E0',
        paddingVertical:8,
        paddingHorizontal: 16,
        borderWidth: 1, 
        borderRadius: 20,
    },

    petname: {
        fontSize: 15,
        fontFamily: 'normal',
        fontWeight: '400',
    },
    
    selectedChip: {
        backgroundColor: '#1F7A68',
        borderColor: '#1F7A68',
        paddingVertical:8,
        paddingHorizontal: 16,
        borderWidth: 1, 
        borderRadius: 20,
        color: 'white',
    },

    selectedpetname: {
        color: '#ffffff',
    }
})