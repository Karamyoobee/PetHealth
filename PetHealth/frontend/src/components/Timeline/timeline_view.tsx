import React, { useEffect, useState } from "react";
import MainHeader from "./header";
import {ActivityIndicator, View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { api } from '../../api/client';
import PetSelector from '../PetSelector';
import BottomNavBar from '../BottomNavBar';
import type { Pet } from '../../types';

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
        </View>
    )
}

//Styles Map view
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
