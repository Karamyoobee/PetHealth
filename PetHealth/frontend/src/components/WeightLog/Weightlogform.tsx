//Imported React Libraries 
import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";//React - Native Libraries
import { SaveWeight } from "./Saveweightbutton";
import NewWeighHeader from "./Weight_header";
import { WeightEntry } from "../../types";
import { api } from "../../api/client";


type WeightProps = { 
  onBack: () => void;
  icon?: React.ReactNode,//icon
}; 


export default function AddWeightLog({onBack}:WeightProps){
    const [notes, setNotes] = useState('');
    const [submitted, setSubmitted] = useState(false);
    

    const handleSave = () => {
        //Add API call / local storage save
        setSubmitted(true);
    };

    return(
        <View style={styles.container}>
                {/*Header */}
                <NewWeighHeader onBack={onBack} label="New Weight Entry"/>

                {/*Notes - Tex Input */}

                {/*Weigh-in Entry Field*/}

              {/*Save Button*/}
              <View style={styles.Button}>
                    <SaveWeight label="Save Entry" onPress={handleSave} icon={null}/>
                    {submitted && <Text style={styles.result}>Entry Saved!</Text>}

              </View>

        </View>
    );
}

//Styles Sheet 
const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#FDFCF9',
        flex:1,
    },

    main_card:{
        backgroundColor:'#fff',
        borderRadius: 14,
        padding: 16,
    },

    Card: {
        borderRadius: 12,
        padding:16,
        gap:12,
    },

    Text_Field:{
        height:48,
        borderColor:'#EBEBEB',
        borderRadius: 8,
    },

    Button: {
        marginTop: 340,
    },

    Pet:{
        marginBottom: 16,
    },

    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },
});


