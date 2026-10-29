<<<<<<< HEAD
import React from "react";
import {useState, useEffect} from "react";
import MainHeader from "./header";
import {View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import BottomNavBar from "../../features/HomeScreen/components/TabBar";
import { api } from "../../api/client";
import { Pet } from "../../types";
=======
import React, { useEffect, useState } from "react";
import MainHeader from "./header";
import {ActivityIndicator, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { api } from '../../api/client';
import PetSelector from '../PetSelector';
import BottomNavBar from '../BottomNavBar';
import type { Pet } from '../../types';
>>>>>>> a34ab36dd84535624f0348e0830277b1088e8933

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

//Function 1: Sort By Date / Month for Timeline View 
function toSortKey(raw?: string | null): number{
    const time = raw ? new Date(raw).getTime() : NaN;

    return Number.isNaN(time) ? 0 : time;
}

//Function 2: Display Date for Cards: 
function toDisplayDate(raw? : string | null): string{
    //1. No Date provided at all - missing or empty
    if (!raw) return 'No Date!';

    //Create Date object from text
    const date = new Date(raw);

    //if Text does not have a valid date: An Invalid Date's getTime() is NaN.
    if (Number.isNaN(date.getTime())) return 'No date';

    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}


const TYPE_COLORS: Record<EntryType, {stripe: string, pillBg: string, pilltext: string}> = {
    logged:{stripe:'#1F6F5C', pillBg: '#DDEFE8', pilltext: '#1F6F5C'},
    visit: {stripe:'#E8A15A', pillBg: '#FCE8D2', pilltext: '#B5651D'},
    rx: {stripe:'#1F6F5C', pillBg: '#E1E8E4', pilltext: '#4A6258'},
    note: {stripe:'#E8A15A', pillBg: '#FBDDE0', pilltext: '#B42318'},
};

const TYPE_LABELS: Record<EntryType, string> = {
    logged: 'LOGGED', visit: 'VISIT', rx: 'RX', note: 'NOTE',
};


<<<<<<< HEAD
export default function Timeline({onBack, onHomePress, onPetsPress}: TimelineProps){
    
    //Use State 
    //when a chip is selected: e.g 'all'
    const [selectedPetId, setSelectedPetId] = useState<string>('all');
    
    //Load Pet's only fron backend, empty until API is connected and retrieves information
    const [pets, setPets] = useState<{id: string; name: string}[]>([]);

    //Chip List: 'All', 'other chips' represeting pets added
    const chips = [{ id: 'all', name: 'All'}, ...pets]

    const [entries, setEntries ] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    //Run only 1 time, only when timeline screen opens and (empty [] dependency arrat)
    async function LoadTimeline(){
        setLoading(true);
        setError('');

        try{
            //Fetch all current user's pet's list
            const result = await api.listCurrentUserPets();
             //only keep pet id and name 
                setPets(result.map(p => ({id: p.id, name: p.name})))

                //Display all pets load at 1 time
            const perPet = await Promise.all(result.map(async (p) => {

            //2 pet lists to load at the same time 
            //Results return back in the oder as per listed - weight - 1, symptoms - 2
            const [weights, symptoms] = await Promise.all([
                api.listWeights(p.id),
                api.listSymptoms(p.id)
            ]);

            //Shared details for every entry that belongs to the pet
            const base = {pet: p.name, petId: p.id};

            //Display Weight Entries 
            const WeightEntries = weights.map((w): TimelineEntry =>({
                ...base,
                id: `logged-${w.id}`,
                type: 'logged',
                date: toDisplayDate(w.recordedAt),//Display on Date - text format
                sortKey: toSortKey(w.recordedAt), //Number used to order all cards
                title: 'Weight Recorded',
                subtitle: w.weightKg != null ? `${w.weightKg} kg` : 'No details!',
            }));

            //Symptom Entries ()
            const symptomEntries = symptoms.map((s): TimelineEntry =>({
                ...base,
                id:`note-${s.id}`,
                type: 'note',
                date: toDisplayDate(s.recordedAt),
                sortKey: toSortKey(s.recordedAt),
                title:s.name || 'Symptoms',             //Symptom Name
                subtitle: s.notes || 'No details',      //Owner's notes - text
            }));

        return [...WeightEntries, ...symptomEntries];

        }));

            //perPet an arry of arrays (one per pet) - flatten it into one list
            const allEntries = ([] as TimelineEntry[]).concat(...perPet);
            setEntries(allEntries);
            console.log('entries:', allEntries.length);
            
        } catch(e){
            console.log(e);
            setError('Unable to load timeline!');
        }finally{
            setLoading(false);
        }
    }    

    useEffect(() => {
        LoadTimeline();
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

=======
type TimelineProps = {
    onBack: () => void;
    onNavigate: (screen: 'home' | 'pets' | 'assistant' | 'timeline' | 'reminders') => void;
};

export default function Timeline({onBack, onNavigate}: TimelineProps){
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [entries, setEntries] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setError('');

        async function loadTimeline(){
            try {
                const savedPets = await api.listCurrentUserPets();
                if (!mounted) return;
                setPets(savedPets);
                const pet = savedPets.find((savedPet) => savedPet.id === selectedPetId) ?? savedPets[0];
                if (!pet) {
                    setEntries([]);
                    return;
                }
                if (pet.id !== selectedPetId) {
                    setSelectedPetId(pet.id);
                    return;
                }
                const [visits, medications, symptoms, weights] = await Promise.all([
                    api.listVetVisits(pet.id), api.listMedications(pet.id),
                    api.listSymptoms(pet.id), api.listWeights(pet.id),
                ]);
                if (!mounted) return;
                const entry = (type: EntryType, id: string, date: string, title: string, subtitle: string): TimelineEntry => ({
                    id: `${type}:${id}`, type, date, sortKey: Date.parse(date) || 0,
                    title, subtitle, pet: pet.name,
                });
                const savedEntries = [
                    ...visits.map((visit) => entry('visit', visit.id, visit.appointmentDate, 'Vet Visit', [visit.clinicName, visit.reason, visit.diagnosis].filter(Boolean).join(' - '))),
                    ...medications.map((medication) => entry('rx', medication.id, medication.startDate, medication.name, [medication.dosage, medication.schedule].filter(Boolean).join(' - '))),
                    ...symptoms.map((symptom) => entry('logged', symptom.id, symptom.recordedAt, symptom.name, symptom.notes)),
                    ...weights.map((weight) => entry('note', weight.id, weight.recordedAt, `Weight: ${weight.weightKg} kg`, weight.notes ?? '')),
                ];
                setEntries(savedEntries.sort((a, b) => b.sortKey - a.sortKey));
            } catch (error) {
                if (mounted) setError(error instanceof Error ? error.message : 'Could not load the timeline.');
            } finally {
                if (mounted) setLoading(false);
            }
        }

        loadTimeline();
        return () => { mounted = false; };
    }, [selectedPetId, attempt]);

    return(
        <View style={style.screen}>
            <MainHeader onBack={onBack} title="Pet Timeline"/>
            <ScrollView contentContainerStyle={style.content}>
                <PetSelector pets={pets} selectedPetId={selectedPetId} onSelectPet={setSelectedPetId}/>
                {loading ? <ActivityIndicator color="#00796B"/> : error ? (
                    <Pressable onPress={() => setAttempt((value) => value + 1)}>
                        <Text style={style.error}>{error} Tap to retry.</Text>
                    </Pressable>
                ) : entries.length === 0 ? (
                    <Text>{pets.length ? 'No health records saved for this pet yet.' : 'Add a pet to view their timeline.'}</Text>
                ) : entries.map((entry) => (
                    <View key={entry.id} style={style.card}>
                        <Text style={style.pet_chip_text}>{entry.pet} - {entry.sortKey ? new Date(entry.date).toLocaleDateString() : 'Date not recorded'}</Text>
                        <Text style={style.title}>{entry.title}</Text>
                        {entry.subtitle ? <Text>{entry.subtitle}</Text> : null}
                    </View>
                ))}
            </ScrollView>
            <BottomNavBar
                active="timeline"
                onHomePress={onBack}
                onPetsPress={() => onNavigate('pets')}
                onActionPress={() => onNavigate('assistant')}
                onTimelinePress={() => setAttempt((value) => value + 1)}
                onAlertsPress={() => onNavigate('reminders')}
            />
>>>>>>> a34ab36dd84535624f0348e0830277b1088e8933
        </View>
    )
}

//Styles Map view
<<<<<<< HEAD
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
=======
const style = StyleSheet.create({
    screen:{
        flex:1,
        backgroundColor:'#FAF8F4',
    },
    content:{
        padding:20,
        paddingBottom:90,
    },
    title:{
        color:'#293B35',
        fontWeight:'600',
        marginVertical:6,
    },
    error:{
        color:'#B42318',
    },
    
    heading:{
>>>>>>> a34ab36dd84535624f0348e0830277b1088e8933
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
        marginBottom: 10,
        borderLeftWidth: 4,
    },

    card_top:{
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    //Date for Card
    card_date:{
        fontSize: 13, 
        fontWeight: '600',
        color:'#333',
    },

    //Tag
    tag: {
        paddingHorizontal: 8, 
        paddingVertical: 3,
        borderRadius:999
    },

    //Tag Text 
    tag_text:{
        fontSize: 10, 
        fontWeight: '700',
    },
    
    //Title for Card
    card_title:{
        fontSize: 17, 
        fontWeight: '700',
        color:'#111'
    },
    
    //Subtitle for Card 
    card_subtitle: {
        fontSize:13,
        color:'#666',
        marginTop: 2
    },

    //empty_text
    empty_text:{
        color:'#666',
        marginTop: 24,
    }

})
