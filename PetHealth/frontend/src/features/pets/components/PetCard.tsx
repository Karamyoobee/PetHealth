// 1. IMPORTS: React, the react-native pieces you need, the icon, PetImage, StatusBadge, the Pet type
import React from 'react';
import {StyleSheet, Text, View, Pressable, TouchableOpacity} from 'react-native';
import StatusBadge from './StatusBadge';
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
            <PhotoCover uri={pet.photoUri} size={80}/>
            <View style={styles.middleblock}>
                <Text style={styles.petnametext}>{pet.name}</Text>
                <Text style={styles.subtext}>{pet.breed} {pet.age}</Text>
            </View>
            <StatusBadge status={pet.status}/>    
            <TouchableOpacity onPress={onPress}>
                <Entypo name="chevron-right" size={24} color="black" />
            </TouchableOpacity>
        </Pressable>
    );
}

const styles = StyleSheet.create({

    card: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        padding:5,
        borderRadius: 3,
        marginBottom: 5,
        elevation: 2,
    },

    middleblock: {
        flex: 1,
        marginLeft:4,
    },

    petnametext:{
        fontWeight: 'bold',
        fontSize: 20,
    },

    subtext:{
        color: 'grey',
        fontSize:14,
    },


});



// 4. LEFT: the round photo (PetImage)
// 5. MIDDLE: a View with two Text lines
//    - line 1: the pet's name
//    - line 2: breed and age together
// 6. RIGHT: the status badge, then the chevron icon
// 7. STYLES: card, middle block, name text, small grey text
