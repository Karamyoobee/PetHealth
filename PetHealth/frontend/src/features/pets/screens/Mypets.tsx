import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View, TouchableOpacity,FlatList} from 'react-native';
import { StatusBar } from "expo-status-bar";
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import PetCard from '../components/PetCard';
import { Pet } from '../../../types';
import { api } from '../../../api/client';


export default function App(){

    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const LoadPets = async () => {
                try{
                    const showpets = await api.listPets();
                    console.log("Pets from backend: ", showpets);
                    setPets(showpets);
                }
            catch(error){
                console.error(error)
            }
            finally{
                setLoading(false);
            }

        };
        LoadPets();
    },[]);

    return (
            <View style={styles.container}>


                <Header/>            
                   
 
                <View style={styles.greetingBlock}>
                    <Text style={styles.greeting}>My Pets</Text>
                </View>
 
                <FlatList
                    data={pets}
                    keyExtractor={(item) => item.id}
                    renderItem={( {item} ) => <PetCard pet={item}/>}
                />

                {/*Add My pets section here... */}

            </View>   
 
   
    )
}
 
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F4EC',
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