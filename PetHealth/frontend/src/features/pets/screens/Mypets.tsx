import React, {useEffect, useState} from 'react'; //React Use State Management
import {StyleSheet, Text, View, FlatList} from 'react-native';//React Essential Imports for Components of Screen
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from '../components/header'; //Header for MyPets Screen
import BottomNavBar from '../components/Tabbar';//Bottom Navbar File 
import PetCard from '../components/PetCard';//PetCard to display Pet Owner Pet's from 
import { Pet } from '../../../types';//Import Backend Pet (Types Set Structure) for Data Types Validation
import { api } from '../../../api/client';//API connection for connection between pet details stored inside Mongodb Database
import AddButton from '../components/Addnewpetbutton';

//Props - Used to connect 
type MyPetsScreenProps = {
    onBack: () => void;//Return to Home Screen
    onSelectPet: (id: string) => void;//Open the selected pet's profile 
    onAddNewPet: () => void;//Add New Pet Screen - Open
    onNavigate?: (screen: 'home' | 'pets' | 'assistant' | 'reminders' | 'timeline') => void;//Main Navigation Bar
}

//Main Component for Mypets Screen
export default function MyPetsScreen({ onBack, onSelectPet, onAddNewPet, onNavigate }: MyPetsScreenProps){
    const insets = useSafeAreaInsets();
    //State for loading flag and pet list
    const [pets, setPets] = useState<Pet[]>([]);//Pet list to store all pet
    const [loading, setLoading] = useState(true);//True - only when pets are in process of being fetched, also false until loading is completed (success or fail)

    //Load all pets from each ID , once screen displays succesfully first!
    useEffect(() => {
        //Async function defines - effect, effects cannot be async directly
        const LoadPets = async () => {
                try{
                    const showpets = await api.listPets();//Reuse pet list from backend (API client via Mongodb)
                    setPets(showpets);//Save response of Pets state -> Flatlis can render with this data set
                }
            //Handle Error: log failure 
            catch(error){
                console.error(error)
            }
            //Always load and final check after try/catch process - stops loading state
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
                    <AddButton onPress={onAddNewPet} />
                </View>

                {/*Pet List Display: 
                    1. Only shows current user pets: 
                    2. Each pet is inside it's own individual card
                    3. Once tapped - opens pet's profile
                */}

                <FlatList
                    data={pets}
                    keyExtractor={(item) => item.id}//Unique key representing each pet in the list
                    renderItem={( {item} ) => <PetCard pet={item} onPress={ () => {
                        onSelectPet(item.id);
                    }}/>}
                    contentContainerStyle={[styles.petList, { paddingBottom: 96 + insets.bottom }]}
                />
                

                {/*Bottom Navigation Bar*/}
                <BottomNavBar
                    active="pets"
                    onHomePress={onBack} 
                    onPetsPress={() => onNavigate?.('pets')}
                    onActionPress={() => onNavigate?.('assistant')}
                    onAlertsPress={() => onNavigate?.('reminders')}
                    onTimelinePress={() => onNavigate?.('timeline')}
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
 
    //Greeting section - Main Screen Heading
    greetingBlock:{
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 14,
    },
 
    //Main Greeting Section
    greeting: {
        color: "#000000",
        fontSize: 28,
        fontWeight: "800",
    },
    petList: {
        paddingHorizontal: 20,
    },
 
});
