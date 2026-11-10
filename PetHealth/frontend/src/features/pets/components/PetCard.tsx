// 1. IMPORTS: React, the react-native pieces you need, the icon, PetImage, StatusBadge, the Pet type
import React from 'react';
import {StyleSheet, Text, View, Pressable, TouchableOpacity} from 'react-native';
import PhotoCover from './Petimage';
//import { Pet } from '../data/pets';
//import { Background } from 'expo-router/build/react-navigation';
import Entypo from '@expo/vector-icons/Entypo';//Logo Icon
import { Pet } from '../../../types';
import { api } from '../../../api/client';

// 2. PROPS: the card receives one pet (use the Pet type from data/pets.ts)
type PetTypeProps = { 
    pet: Pet;
    onPress: () => void;
}


export default function PetCard({ pet, onPress }: PetTypeProps){
    return(
        <Pressable style={styles.card} onPress={onPress}>
            <PhotoCover uri={pet.photoUri} size={56}/>
            <View style={styles.middleblock}>
                <Text style={styles.petnametext}>{pet.name}</Text>
                <Text style={styles.subtext}>{pet.breed} {pet.age ? `, ${pet.age} yrs` : ''}</Text>
            </View>
            <TouchableOpacity onPress={onPress}>
                <Entypo name="chevron-right" size={20} color="#65716E" />
            </TouchableOpacity>
        </Pressable>
    );
}

const styles = StyleSheet.create({

    card: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding:12,
        borderRadius: 12,
        marginBottom: 10,
        borderColor: '#E5E1DB',
        borderWidth: 1,
        elevation: 1,
    },

    middleblock: {
        flex: 1,
        marginLeft:12,
    },

    petnametext:{
        fontWeight: 'bold',
        fontSize: 16,
    },

    subtext:{
        color: '#6B7280',
        fontSize:12,
        marginTop: 3,
    },


});



// 4. LEFT: the round photo (PetImage)
// 5. MIDDLE: a View with two Text lines
//    - line 1: the pet's name
//    - line 2: breed and age together
// 6. RIGHT: the status badge, then the chevron icon
// 7. STYLES: card, middle block, name text, small grey text
