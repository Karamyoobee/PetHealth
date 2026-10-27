import React from 'react';
import {Text, View, StyleSheet, Pressable} from 'react-native'
import { Pet } from '../../types';
import { api } from '../../api/client';
import { Symptom } from '../../types';

//declare Props 
type ChipSelectCategoryProps = {
    category_option:  Symptom['category'][];//List of all Category Options (from backend)
    value: Symptom['category']; //Selected Pet
    onChange: (CategoryOptions: Symptom['category']) => void;//chip calls when tapped
    selectedColor?: string;//colord filled for selected chip
}

export default function SelectCategory({category_option, value, onChange, selectedColor, }: ChipSelectCategoryProps){
    return(

    <View style={styles.container}>
        { category_option.map((CategoryOptions) => (
            <Pressable onPress={() => onChange(CategoryOptions)} style={[styles.chip, CategoryOptions === value && styles.selectedChip]} key={CategoryOptions}>
                <Text style={[styles.category_label, CategoryOptions === value && styles.selectedCategory]}>{CategoryOptions}</Text>
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

    category_label: {
        fontSize: 15,
        fontFamily: 'normal',
        fontWeight: '400',
    },
    
    selectedChip: {
        backgroundColor: '#FFEBD6',
        paddingVertical:8,
        paddingHorizontal: 16,
        borderWidth: 1, 
        borderRadius: 20,
        color: '#F29B4A',
        fontWeight: '500',
    },

    selectedCategory: {
        color: '#F29B4A',
    }
})