import React from "react";
import { useState } from "react";
import { useEffect } from "react"; // check petId for pet being used here
import { StyleSheet, Text, Pressable, View} from "react-native";
//All Icons Set - For Statistic Cards and Quick Access Buttons
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

//Reusable Components - UI
import { QuickButton } from "../components/Quickaccess_buttons";//Quick Access Section Buttons File
import { DetailCard } from "../components/Detailcard";//Detail Card File - Used for Stats cards
import BottomNavBar from "../components/Tabbar";//Bottom Navigation Bar
import PetHeader from "../components/petheader";

//Pet Data Type and API Client Files 
import { Pet } from "../../../types";
import { api } from "../../../api/client";

//
import { colors, spacing } from "@theme";
import PhotoHeader from "../components/Photoheader";

//Quick Access Shortcuts (Setups) 
const QuickAccessActions = [
    {label: "Log Symptom", icon:<Feather name="clipboard" size={20} />, route: "Log Symptom" },
]

//Props - useful for Parent Screen Menu
type PetHeaderProps = {
    onBack: () => void;//Return to previous Screen
    petId?: string | null;//Collect id of Pet (selected from myPets Screen)
    title?: string;
}

//Main Function for Pet Profile Screen - (Call Props inside function [Parameters])
export default function PetProfileScreen({ onBack, petId }: PetHeaderProps){
    const [pet, setPet] = useState<Pet|null>(null);//Select pet's data
    const [error, setError] = useState<string|null>(null);//Display error message if fails to load
    const [loading, setLoading] = useState(true)//True - during the fetch of pet details

    //Display and retrieve pet's detail's
    useEffect(() =>{
        async function loadPet(){
            //No Pet ID found: loads nothing, stops loading!
            if(!petId) {setLoading(false); return;}
            try{//Try : display Pet current list
                const pets = await api.listCurrentUserPets(); // pick Ideal pet
                const found = pets.find((p) => p.id === petId) //save details
                setPet(found ?? null);
            }
            catch(e){//Catch Error: Display Error message if failed
                setError("Unable to load Pet!")
            }
            finally{//Runs: stop loading state
                setLoading(false)
            }

        }
        loadPet();//Fetch when Effect loads
        console.log("pet:", pet)//display pet details - selected from Mypets Screen
    },[petId]);//Repeat when selected pet changes

    return(
        <View style={{ flex: 1}}>

            {/*Pet Photo Cover*/}
            <PhotoHeader
                photoUri={pet?.photoUri}
                onBack={onBack}
                onDelete={() => console.log("delete")}
            />

            {/*Display Pet Name*/}
            <Text style={styles.petname}>{pet?.name}</Text>

            {/*Display Pet Breed & Pet Age*/}
            <Text style={styles.otherpetdetails}>{`${pet?.breed ?? "-"} • ${pet?.age ?? "-"} years`}</Text>

            {/*Details Cards - Statistic of Pet*/}

            {/* Display Pet Quick Access Buttons*/}
            <Text>Quick Access</Text>
            
            {/*Bottom Navigation Bar*/}
            <BottomNavBar/>
        </View>
    )
}


const styles = StyleSheet.create({
    root:{
        flex: 1,
        backgroundColor: 'white',
    },

    //Main Style for Background Screen of PetProfile
    main: {flex: 1, backgroundColor: '#FEFBEA'},
    //Statistics - using DetailCard.tsx file Components (Style)
    statistics: {flexDirection: 'row', gap: 8, paddingHorizontal: 16},

    section1: {fontSize: 16, fontWeight:'600', margin: 16},
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

