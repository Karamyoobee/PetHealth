import {View, Text, StyleSheet, Button, ScrollView,Image } from "react-native";//React - Native Libraries
import {useEffect, useState} from 'react';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DetailCardSymptomLog from "../../../components/QuickLogSymptom/DetailCardSymptomlog";
import SectionHeader from "../../../components/QuickLogSymptom/SectionHeader";
import BottomNavBar from "../../HomeScreen/components/TabBar";
import { Symptom, Pet } from "../../../types";
import { api } from "../../../api/client";

//Symptom Log Type
type MySymptomlog={
    onBack: () => void;
    petId: string | null;
    onNavigate?: (screen: 'home' | 'pets' | 'assistant' | 'reminders' | 'timeline') => void;
}

export default function MyLogSymptom({onBack, petId, onNavigate}: MySymptomlog){
    const insets = useSafeAreaInsets();

    //Use States Declared
    const [logs, setLogs] = useState<Symptom[]>([]);//Symptom Logs
    const [loading, setLoading] = useState(true);//Show Backend Logs
    const [pet, setPet] = useState<Pet | null>(null);//Pet State

    //UseEffect
    //Screen First opened by User
    useEffect(() => {
        //No pet being selected: nothing to fetch, stop loading and exit
        if(!petId){ setLoading(false); return; }

        api.listSymptoms(petId) //retreieve backend pet's symptom log
            .then(setLogs)      //Successfull save: saved quick log in state (screen re-renders)
            .catch(console.error)   //Failed: print error message inside console
            .finally(() => setLoading(false)); // stop showing "Loading"
        
    },[petId]);//only show when petId changes

    //s
    useEffect(() => {
        if(!petId) return;//If their is no pet that has been returned
        api.listPets()//api connection for pet list 
            .then(pets => setPet(pets.find(p => p.id === petId) ?? null))
            .catch(console.error);//Error 
    }, [petId]);

    //Sort Logs by Date ()
    const sortedLogs = [...logs].sort(
        (a,b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()//Display logs by recorded time and based on real time
    );
    const petDetails = [pet?.breed, pet?.age ? `${pet.age} years` : null].filter(Boolean).join(' \u2022 ');

    return(
        <View style={styles.maincontainer}>
            {/*Header main for screen */}
            <SectionHeader onBack={onBack} title="Symptom Logs"/>

            {/*Pet Profile Card*/}
            <View style={styles.pet_profilecard}>
                <View style={styles.petInfo}>
                    {pet?.photoUri?(
                    <Image source={{ uri: pet?.photoUri}} style={styles.Image_avatar}/>
                ) : (
                <View style={[styles.Image_avatar, {backgroundColor: '#E6E8E3'}]}/>
                )}
                <View style={styles.petDetails}>
                    <Text style={styles.pet_name}>{pet?.name ?? 'Selected pet'}</Text>
                    <Text style={styles.pet_meta}>{petDetails || 'Pet profile'}</Text>
                    {!!pet?.status && (
                        <View style={styles.Status_pill}>
                            <View style={styles.dot_status}/>
                            <Text style={styles.banner_title}>{pet.status}</Text>
                        </View>
                    )}
                </View>
            </View>
            <View style={styles.logCount}>
                <Text style={styles.totallogs_value}>{logs.length}</Text>
                <Text style={styles.totallogs_label}>Logs</Text>
            </View>
            </View>
            <ScrollView style={styles.scrollview} contentContainerStyle={[styles.scrollview_style, { paddingBottom: 96 + insets.bottom }]}>

                {loading && <Text>Loading...</Text>}

                {!loading && logs.length === 0 && <Text>No symptoms logged yet.</Text>}

                        {/*Mapping*/}
            {sortedLogs.map((log) =>(
                <DetailCardSymptomLog 
                    key={log.id}
                    symptom={log.name}
                    note={log.notes}
                    loggedAt={`${new Date(log.recordedAt).toLocaleDateString('en-NZ', {day: 'numeric', month:'short', year:'numeric'})} \u2022 ${new Date(log.recordedAt).toLocaleTimeString('en-NZ',{hour:'2-digit', minute:'2-digit'})}`} //ISO string -> store actual real data
                    severity={log.severity}
                    durationDays={log.durationDays ?? parseInt(log.notes?.match(/Duration:\s*(\d+)/)?.[1]??'0')}
                    category={(log.category ?? log.name) as any}
                />
            )
        )}

            </ScrollView>


            <BottomNavBar
                onHomePress={() => onNavigate?.('home')}
                onPetsPress={() => onNavigate?.('pets')}
                onActionPress={() => onNavigate?.('assistant')}
                onTimelinePress={() => onNavigate?.('timeline')}
                onAlertsPress={() => onNavigate?.('reminders')}
            />
        </View>
    )
}

const styles = StyleSheet.create({

    //Left aligned pet details in the summary card.
    petInfo:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10, 
    },

    //Circle Mini Image Style
    Image_avatar:{
        width:44,
        height:44,
        borderRadius:22,
    },

    logCount:{
        alignItems: 'flex-end',
        minWidth: 48,
    },

    //Icon - left side... 

    //Pet Profile Card
    pet_profilecard:{
        backgroundColor: '#fff', 
        borderWidth: 1,
        borderColor:'#E6E8E3',
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginHorizontal: 16,
        marginTop: 16,
    },

    //scroll view style 
    scrollview_style:{
        padding: 16,
        gap: 14,
    },

    scrollview: {
        flex: 1,
    },
    
    //row - main container
    maincontainer:{
        flex:1,
        backgroundColor: '#FAF7F0',
    },
    
    petDetails:{
        gap: 3,
    },

    //Pet Profile Name Text Style 
    pet_name:{
        fontSize: 16,
        fontWeight:'700',
        color: '#23332F',
    },

    //Status Pill Container Style
    Status_pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap:4,
        backgroundColor: '#E3F1EA',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },

    //Status Dot 
    dot_status: {
        width: 6, 
        height: 6, 
        borderRadius:3,
        backgroundColor: '#2F7D5B',
    },

    //Pet Data
    pet_meta:{
        fontSize: 12,
        color:'#7A7F7C',
    },

    //Label for Total Symptom Logs Entered
    totallogs_label:{
        fontSize: 11,
        color:'#7A7F7C',
        marginTop: 2,
    },

    //Label for Total value symptom logs (number shown)
    totallogs_value:{
        fontSize: 20,
        color:'#2F7D5B',
        fontWeight: '700',
    },

    //Banner Title Style
    banner_title:{
        fontSize: 13,
        color:'#2F7D5B',
        fontWeight: '700',
    },

    //Banner body Style
    banner_body:{
        fontSize: 12,
        color:'#5A6B2',
        fontWeight: '700',
        lineHeight: 17,
    },

})
