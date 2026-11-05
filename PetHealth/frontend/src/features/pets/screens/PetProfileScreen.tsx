import React from "react";
import { useState } from "react";
import { useEffect } from "react"; // check petId for pet being used here
import { Alert, StyleSheet, Text, ScrollView, View} from "react-native";
//All Icons Set - For Statistic Cards and Quick Access Buttons
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Feather from '@expo/vector-icons/Feather';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'; //Age - Birthday
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';//Medical Box & Weight Icon
import FontAwesome from '@expo/vector-icons/FontAwesome';//Vet Visits - Icon
import Entypo from '@expo/vector-icons/Entypo';//Predictive Flagging - Icon

//Reusable Components - UI
import { QuickButton } from "../components/Quickaccess_buttons";//Quick Access Section Buttons File
import { DetailCard } from "../components/Detailcard";//Detail Card File - Used for Stats cards
import BottomNavBar from "../components/Tabbar";//Bottom Navigation Bar
import PetHeader from "../components/petheader";
import UpdatePet from "../components/updatepetbutton";

//Pet Data Type and API Client Files 
import { Pet } from "../../../types";
import { api } from "../../../api/client";


import PhotoHeader from "../components/Photoheader";

//Props - useful for Parent Screen Menu
type PetHeaderProps = {
    onBack: () => void;//Return to previous Screen
    petId?: string | null;//Collect id of Pet (selected from myPets Screen)
    title?: string;//Optional title for screen
    onUpdate: () => void;//connection for update button
    onQuickLog: () => void; // connect to Quick Log Screen
    onWeightLog: ()=> void;//Button to connect to Add New Weight Log Screen
    onPredictiveFlag: () => void;//Button to connect to launch Predictive Flagging Engine Screen
    onVetVisits: () => void;//Button connected to Vet Visit Screen
    onMedications: () => void;//Button to launch Medications Screen
    onDeleted: () => void;//Delete Pet Profile Succesffully
    onNavigate?: (screen: 'home' | 'pets' | 'assistant' | 'reminders' | 'timeline') => void;//Bottom Navigation Bar Screen Switch
}

//Main Function for Pet Profile Screen - (Call Props inside function [Parameters])
export default function PetProfileScreen({ onBack, petId, onUpdate, onQuickLog, onWeightLog,onPredictiveFlag, onVetVisits, onMedications, onDeleted, onNavigate }: PetHeaderProps){
    const [pet, setPet] = useState<Pet|null>(null);//Select pet's data
    const [error, setError] = useState<string|null>(null);//Display error message if fails to load
    const [loading, setLoading] = useState(true)//True - during the fetch of pet details
    const [deleting, setDeleting] = useState(false);//True - only when delete request has been clicked (No double taps)
    const [latestweight, setlatestweight] = useState<number | null>(null)//Store New Weight from weight log (updated weight)
    //Latest weight (kg) from the weight log | null - no logs stored yet -> fallback to pet.weightKg
 
    //Delete pet via API, notified the parent function (onDeleted), in order to navigate to previous screen
    //Displayes alert on fail only, No-options if there's no petId or delete in progress at that time
    const deletePet = async () => {
        if (!petId || deleting) return; //Avoid nothing to delete and prevent double click's
        setDeleting(true);
        try {
            await api.deletePet(petId);
            onDeleted();//Parent (onDeleted) handles navigation / list refresh
        } catch (error) {
            //API error message - unable to delete pet
            Alert.alert('Could not delete pet', error instanceof Error ? error.message : 'Please try again.');
        } finally {
            //Re-use delete button, whether success or fail occurs
            setDeleting(false);
        }
    };

    //Display Options menu: Edit / Delete (deletion of pet profile [confirmation asked first])
    const openPetOptions = () => {
        if (!pet || loading || deleting) return;//If no pet and unable to delete pet - return
        Alert.alert('Pet options', pet.name, [
            { text: 'Edit Pet', onPress: onUpdate },//Edit Button -> Send User to Update Pet Form 
            { text: 'Delete Pet', style: 'destructive', onPress: () => {//Delete Pet Button
                Alert.alert('Delete Pet', `Delete ${pet.name} and their saved health records? This cannot be undone.`, [
                    { text: 'Cancel', style: 'cancel' },//Confirmation Notice for pet owner for deletion of pet profile & Details
                    { text: 'Delete', style: 'destructive', onPress: deletePet },//Delete Button - official delete of pet profile details inside backend
                ]);
            } },
            { text: 'Cancel', style: 'cancel' },//Cancel Button - Close Options Menu Button
        ]);
    };

    //Display and retrieve pet's detail's
    useEffect(() =>{
        async function loadPet(){
            //No Pet ID found: loads nothing, stops loading!
            if(!petId) {setLoading(false); return;}
            try{//Try : display Pet current list
                const pets = await api.listCurrentUserPets(); // pick Ideal pet
                const found = pets.find((p) => p.id === petId) //save details
                setPet(found ?? null);
                //Fetch all weight logs for the selected pet from (Pet Profile Screen)
                const weights = await api.listWeights(petId);
                const sorted = [...weights].sort((a,b) =>//Sort from newest first to oldest | copy [...weights] | original array is not changed
                    new Date(b.recordedAt).getTime() -new Date(a.recordedAt).getTime()
            );
            //Newest weight log stored at sorted[0], if no logs, store null (card uses or fallback to pet.weightKg) from inital pet profile details
            setlatestweight(sorted[0]?.weightKg ?? null);
            }
            catch(e){//Catch Error: Display Error message if failed
                setError("Unable to load Pet!")//
            }
            finally{//Runs: stop loading state
                setLoading(false)
            }

        }
        loadPet();//Fetch when Effect loads
    },[petId]);//Repeat when selected pet changes


    return(
        <View style={styles.root}>
        {/*Scrollable Profile Content Style*/}
        <ScrollView style={{ flex: 1}}
            contentContainerStyle={{ paddingBottom: 114}}
            >

            {/*Pet Photo Cover*/}
            <PhotoHeader
                photoUri={pet?.photoUri}
                onBack={onBack}
                onDelete={openPetOptions}
            />
            
            {/*Edit Pet Profile Details - Button */}
            <UpdatePet onPress={onUpdate}/>
            {/*Display Pet Name*/}
            <Text style={styles.petname}>{pet?.name}</Text>

            {/*Display Pet Breed & Pet Age*/}
            <Text style={styles.otherpetdetails}>{`${pet?.breed ?? "-"} • ${pet?.age ?? "-"} years`}</Text>

            {/*Details Cards - Statistic of Pet*/}
            <View style={styles.statistics}>

            {/*Add Comment to new updated weight below:  */}

            {/*Pet Weight*/}
            <DetailCard
                label="Weight"
                value={`${latestweight ?? pet?.weightKg ?? 0} kg`}
                icon={<FontAwesome6 name="weight-scale" size={24} color="black" />}
            />

            {/*Pet Age*/}
            <DetailCard
                label="Age"//Age Declared
                value={`${pet?.age ?? 0 } yrs`}//Value Declared and collected from real database stored
                icon={<MaterialCommunityIcons name="cake-variant-outline" size={24} color="black" />}
            />

            {/*Pet Health Status*/}
            <DetailCard
                label="Status"//Label for Health Stats
                value={`${pet?.status ?? "Unknown" }`}//Not connected to backend yet!
                icon={<Feather name="heart" size={24} color="#90EE90" />}
            />
            </View>

            {/* Display Pet Quick Access Buttons*/}
            <Text style={styles.quickaccessheading}>Quick Access</Text>
            
            <View style={styles.Container}>
            {/*Quick Access: Log Symptom Button*/}
            <QuickButton onPress={onQuickLog}
                label="Log Symptom"
                icon={<FontAwesome5 name="briefcase-medical" size={24} color="#2F7B6D" />}
            />

            {/*Quick Access: Weigh-in Button*/}
            <QuickButton onPress={onWeightLog}
                label="Weigh-in"
                icon={<FontAwesome5 name="weight" size={24} color="#2F7B6D" />}
            />

            {/*Quick Access: Vet Visits Button*/}
            <QuickButton onPress={onVetVisits}
                label="Vet Visits"
                icon={<FontAwesome name="calendar" size={24} color="#2F7B6D" />}
            />

            {/*Quick Access: Medications*/}
            <QuickButton onPress={onMedications}
                label="Medications"
                icon={<MaterialCommunityIcons name="pill" size={24} color="#2F7B6D" />}
            />

            {/*Quick Access: Predictive Flagging Engine Button*/}
            <QuickButton onPress={onPredictiveFlag}
                label="Predictive Flagging Engine"
                icon={<Entypo name="flag" size={24} color="#2F7B6D" />}
            />
        </View>
           
            
        </ScrollView>
            {/*Bottom Navigation Bar*/}
            <BottomNavBar
                active="pets"
                onHomePress={() => onNavigate?.('home')}
                onPetsPress={onBack}
                onActionPress={() => onNavigate?.('assistant')}
                onAlertsPress={() => onNavigate?.('reminders')}
                onTimelinePress={() => onNavigate?.('timeline')}
            />
         </View>    
)

}


const styles = StyleSheet.create({
    root:{
        flex: 1,
        backgroundColor: '#F8F8F6',
    },

    //Quick Access Container
    Container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    //Quick Access Heading
    quickaccessheading:{
        marginLeft:10,
        fontWeight: '500',
        fontSize: 30,
        top:20,
        color:'black',
        paddingHorizontal: 16,
    },

    //Main Style for Background Screen of PetProfile
    main: {
        flex: 1, 
        backgroundColor: '#FEFBEA',
        borderWidth: 1,
        borderColor:"#D3D3D3",
    },

    //Statistics - using DetailCard.tsx file Components (Style)
    statistics: {
        flexDirection: 'row',
        gap: 8, 
        paddingHorizontal: 16,
        marginTop: 12,
    },

    section1: {
        fontSize: 16, 
        fontWeight:'600', 
        margin: 16},

    grid:{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 16,
    },

    //Display Real Pet Name
    petname: {
        fontSize: 35,
        fontStyle:"normal",
        textAlign: 'center',
        fontWeight: '600',
    },
    
    //Display Other Pet Details - Breed & Age
    otherpetdetails:{
        fontSize: 25,
        textAlign: 'center',
        color:'#3F4A42',
    }
})

