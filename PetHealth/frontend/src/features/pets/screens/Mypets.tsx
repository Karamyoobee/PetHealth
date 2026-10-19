import React, {useEffect, useState} from 'react'; //React Use State Management
import {StyleSheet, Text, View, Pressable, FlatList} from 'react-native';//React Essential Imports for Components of Screen
import { StatusBar } from "expo-status-bar";
import Header from '../components/header'; //Header for MyPets Screen
import StatusBadge from '../components/StatusBadge';
import BottomNavBar from '../components/Tabbar';//Bottom Navbar File 
import PetCard from '../components/PetCard';//PetCard to display Pet Owner Pet's from 
import { Pet } from '../../../types';//Import Backend Pet (Types Set Structure) for Data Types Validation
import { api } from '../../../api/client';//API connection for connection between pet details stored inside Mongodb Database
import AddButton from '../components/Addnewpetbutton';

//Props - Used to connect 
type MyPetsScreenProps = {
    onBack: () => void;
    onSelectPet: (id: string) => void;
    onAddNewPet: () => void;
    onNavigate?: (screen: 'home' | 'pets' | 'assistant' | 'reminders') => void;
}

//Function for Backend 
export default function MyPetsScreen({ onBack, onSelectPet, onAddNewPet, onNavigate }: MyPetsScreenProps){
    //State set for - display (pets lists), load flags and error messages
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    //Load all pets from each ID , once screen displays succesfully first!
    useEffect(() => {
        //Async function defines - effect, effects cannot be async directly
        const LoadPets = async () => {
                try{
                    const showpets = await api.listPets();//Reuse pet list from backend (API client via Mongodb)
                    console.log("Pets from backend: ", showpets);//Log for Debugging: backend response check only
                    setPets(showpets);//Save response of Pets state -> Flatlis can render with this data set
                }
            //Handle Error: log failure 
            catch(error){
                console.error(error)
            }
            //Always load and final chekc after try/catch process - stops loading state
            finally{
                setLoading(false);
            }

        };
        //Enforce Trigger to fetch() details of all pets that match the user ID
        LoadPets();
    },[]);

    return (
            <View style={styles.container}>
                {/*Header for Mypets screen*/}
                <Header onBack={onBack} />            
                   
                {/* Display Title for Users - Mypets screen */}
                <View style={styles.greetingBlock}>
                    <Text style={styles.greeting}>My Pets</Text>
                </View>

                {/*Add Pet - New Button*/}
                <AddButton onPress={onAddNewPet} />
                {/*Pet List - Display only per UserId*/}
                <FlatList
                    data={pets}
                    keyExtractor={(item) => item.id}
                    renderItem={( {item} ) => <PetCard pet={item} onPress={ () => {
                        console.log("You Tapped the Button!", item.id);
                        onSelectPet(item.id);
                    }}/>}
                />

                {/*Bottom Navigation Bar*/}
                <BottomNavBar
                    active="pets"
                    onHomePress={onBack}
                    onPetsPress={() => onNavigate?.('pets')}
                    onActionPress={() => onNavigate?.('assistant')}
                    onAlertsPress={() => onNavigate?.('reminders')}
                />
            </View>   
 
   
    )
}

//Main Styles Sheet for Mypets Screen
const styles = StyleSheet.create({

    //Main container for Mypets Screen
    container: {
        flex: 1,
        backgroundColor: '#FBF9F5',
    },
 
    //Greeting section
    greetingBlock:{
        padding: 20,
    },
 
    //Main Greeting Section
    greeting: {
        color: "#000000",
        fontSize: 35,
        fontWeight: "800",
    },
 
    //Sub Text - Greeting Section
    greetingSub:{
        color:"#000000",
        fontSize:13,
        marginTop:5,
    },
});
