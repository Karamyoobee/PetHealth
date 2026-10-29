import {View, Text, StyleSheet, Button, ScrollView,Image } from "react-native";//React - Native Libraries
import {useEffect, useState} from 'react';
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

<<<<<<< HEAD
//Reusable Component function for My Log Symptom
export default function MyLogSymptom({onBack, petId}: MySymptomlog){
=======
export default function MyLogSymptom({onBack, petId, onNavigate}: MySymptomlog){
>>>>>>> a34ab36dd84535624f0348e0830277b1088e8933

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

    return(
        <View style={styles.maincontainer}>
            {/*Header main for screen */}
            <SectionHeader onBack={onBack} title="Symptom Logs"/>

            {/*Pet Profile Card*/}
            <View style={styles.pet_profilecard}>
                <View style={styles.left_container_content}>
                    {pet?.photoUri?(
                    <Image source={{ uri: pet?.photoUri}} style={styles.Image_avatar}/>
                ) : (
                <View style={[styles.Image_avatar, {backgroundColor: '#E6E8E3'}]}/>
                )}
            
            <View>

            </View>
            
            {/*Pet Profile Container - Displayed Pet Information and Symptom Logs*/}
                <View style={styles.petprofile_name_container}>
                    <Text style={styles.pet_name}>{pet?.name}</Text>
                    <View style={styles.Status_pill}>
                        <View style={styles.dot_status}/>
                            <Text style={styles.banner_title}>{pet?.status}</Text>
                    </View>
                </View>
            </View>
                
            {/*Display Breed & Age of Selected Pet*/}
                <View>
                    <Text style={styles.pet_meta}>{pet?.breed} • {pet?.age} years</Text>
                </View>

            {/* Pet Profile Card - Number of Symptom Logs*/}
            <View style={styles.right_content}>
                <Text style={styles.totallogs_label}>Total Logs:</Text>
                <Text style={styles.totallogs_value}>{logs.length} recorded</Text>
            </View>

            </View>

            <ScrollView contentContainerStyle={styles.scrollview_style}>

                {loading && <Text>Loading...</Text>}

                {!loading && logs.length === 0 && <Text>No symptoms logged yet.</Text>}

                        {/*Mapping*/}
            {sortedLogs.map((log) =>(
                <DetailCardSymptomLog 
                    key={log.id}
                    symptom={log.name}
                    note={log.notes}
                    loggedAt={`${new Date(log.recordedAt).toLocaleDateString('en-NZ', {day: 'numeric', month:'short', year:'numeric'})} • ${new Date(log.recordedAt).toLocaleTimeString('en-NZ',{hour:'2-digit', minute:'2-digit'})}`} //ISO string -> store actual real data
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

    //Left Aligned Row - Card Details: 
    left_container_content:{
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

    //Text Block Style - inside pet profile card
    text:{
        color:'lightgreen',
        borderRadius: 12,
    },

    //Right content - container
    right_content:{
        alignItems: 'flex-end',
        color:'lightgrey',
    },

    //Heading row (saved log symptoms)
    heading:{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    //Banner Style - Symptom Saved logs declared
    banner: {
        flexDirection:'row',
        backgroundColor: 'lightgreen',
        borderColor:'green',
    },

    //Icon - left side... 

    //Pet Profile Card
    pet_profilecard:{
        backgroundColor: '#fff', 
        borderWidth: 1,
        borderColor:'#E6E8E3',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    },

    //scroll view style 
    scrollview_style:{
        padding: 16,
        gap: 14,
    },
    
    //row - main container
    maincontainer:{
        flex:1,
        backgroundColor: '#FAF7F0',
    },
    
    //Pet Profile Name row container 
    petprofile_name_container:{
        flexDirection: 'row', 
        alignItems: 'center',
        gap: 8,
    },

    //Pet Profile Name Text Style 
    pet_name:{
        fontSize: 16,
        fontWeight:'700',
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
    },

    //Label for Total value symptom logs (number shown)
    totallogs_value:{
        fontSize: 11,
        color:'#2F7D5B',
        fontWeight: '700',
    },

    //Title Section Style: Quick Log Symptom Entries
    title_section:{
        fontSize: 11,
        color:'#2F7D5B',
        fontWeight: '700',
    },


    //Section Sorted - Button (maybe not include not enough time!)
    
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
