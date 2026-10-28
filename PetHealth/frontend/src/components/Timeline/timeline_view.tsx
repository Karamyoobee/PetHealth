import React from "react";
import {useState, useEffect} from "react";
import MainHeader from "./header";
import {View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import BottomNavBar from "../../features/HomeScreen/components/TabBar";
import { api } from "../../api/client";
import { Pet } from "../../types";

type EntryType = 'logged' | 'visit' | 'rx' | 'note';

//Entry Type
type TimelineEntry = {
    id: string;
    date: string;
    sortKey: number;
    type: EntryType;
    title: string;
    subtitle: string;
    pet: string; //display pet name
    petId: string //chip filter - for pets
};

type TimelineProps = {
    onBack: () => void;
    onHomePress: () => void;
    onPetsPress: () => void;
};

export default function Timeline({onBack, onHomePress, onPetsPress}: TimelineProps){
    
    //Use State 
    //when a chip is selected: e.g 'all'
    const [selectedPetId, setSelectedPetId] = useState<string>('all');
    
    //Load Pet's only fron backend, empty until API is connected and retrieves information
    const [pets, setPets] = useState<{id: string; name: string}[]>([]);

    //Chip List: 'All', 'other chips' represeting pets added
    const chips = [{ id: 'all', name: 'All'}, ...pets]

    //Run only 1 time, only when timeline screen opens and (empty [] dependency arrat)
    useEffect(() => {
        //Async function included, effect callback cannot be just 'async'
        async function loadPetaccount(){
            try{
                //Search backend to fetch current user's pet list
                const result = await api.listCurrentUserPets();
                //only keep pet id and name 
                setPets(result.map(p => ({id: p.id, name: p.name})))
                
                //Testing - debugging only (to check the saved logs for the 4 main features below for current pet id)
                const pet = result[0];
                console.log('weights', await api.listWeights(pet.id));
                console.log('visits', await api.listMedications(pet.id));
                console.log('symptoms', await api.listSymptoms(pet.id))
                console.log('visits', await api.listVetVisits(pet.id));

                console.log(result);//Debugging log (testing only) - check if pet actually loaded - to be removed!

            } catch(e){
                console.log(e);//If the request does fail!, log error
            }
        }
        //Call function - define (in order to run backend connection)
        loadPetaccount();
    },[]);

    return(
        <View style={styles.screen}>

            {/*Header - Text only: Pet Timeline*/}
            <MainHeader title="Pet Timeline"/>

            <ScrollView contentContainerStyle={styles.content}>
             
            {/*Timeline Heading: Timeline */}
            <Text style={styles.heading_text}>Timeline</Text>

            {/*Pet via Chip*/}
            {/*Horizontal Row for chips: no scroll bar*/}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {chips.map(chip => {{/* Map: loop over chip (All + real pets from backend), each chip is pressable / tapable*/}
                    
                    //true  = chip for the exact id that is being selected
                    const Active = chip.id === selectedPetId;

                    return(
                        <Pressable
                            key={chip.id}  
                            onPress={() => setSelectedPetId(chip.id)}
                            style={[styles.pet_chip, Active && styles.active_pet_chip]}
                        >   
                        <Text style={[styles.pet_chip_text, Active && styles.active_pet_chip_text]}>{chip.name}</Text> 
                        </Pressable>
                    );
                })}

                    {/*Style for only, when Pet-Chip is Active (tapped on by user)*/} 

                    {/*Chip Label Section: Display and enable tappable chip button (text turns white when active) */}

            </ScrollView>
            
            {/*Pop-up Cards*/}

            </ScrollView>

            {/*Bottom Navigation Bar*/}
            <BottomNavBar
                active="timeline"
                onHomePress={onHomePress}
                onPetsPress={onPetsPress}
                onTimelinePress={() => {}}
            />

        </View>
    )
}

//Styles Map view
const styles = StyleSheet.create({

    //ScrollView Style
    content: {
        padding: 16,
        paddingBottom: 96,
    },

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
        borderRadius:999, 
        borderWidth: 1,
        backgroundColor: '#D8D2C6',
        borderColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight:8,
    },

    pet_chip_text:{
        fontWeight: '600',
        color: '#333',
    },

    active_pet_chip: {
        backgroundColor: '#1F6F5C',
        borderColor:'#1F6F5C',
    },

    active_pet_chip_text:{
        color:'#fff',
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