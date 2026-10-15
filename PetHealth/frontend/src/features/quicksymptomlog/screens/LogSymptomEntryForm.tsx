import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";//React - Native Libraries
import DescriptionSymptomInput from "../components/DescriptionSymptomInput";//Calling Main
import { SymptomTextField } from "../components/DescriptionSymptomInput"; // Function or component for Text Field
import { SaveButton } from "../components/SaveButton";//Component for 'Save Entry Button'
//import segmentcontrol from "../components/segmentcontrol";
import Header from "../components/SectionHeader";
import SymptomSegmentControl from "../components/SelectCategory";

const LogSymptomEntryForm = () => {
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [category, setCategory] = useState<'Mild' | 'Moderate' | 'Severe' >('Mild'); //Toggle Button - Spayed/Neutured or Intact

    const handleSave = () => {
        //Add API call / local storage save
        setSubmitted(true);
    };

    return(
        <View style={styles.container}>
            <Header/>

            {/* 1. Pet Selector (select from their different pets) */}
            

            {/*2. Category selector () */}


            <SymptomTextField
              label="Describe Pet's Symptoms"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Vommiting after eating, reduced appetite for 2 days..."
              />

              {/*4. Severity (select from options) */}
              
              {/*5. Duration dropdown */}

              <Button title="Save Symptom Log Entry" onPress={handleSave} color="#1B6A60"/>
              {submitted && <Text style={styles.result}>Symptom Saved!</Text>}

        </View>
    );
};

//Styles Sheet 
const styles = StyleSheet.create({
    container: {
        padding: 20
    },
    title: {
        fontSize: 20, 
        fontWeight: 'bold',
        color: '#000', 
        textAlign: 'center',
    },
    titleCard: {
        backgroundColor:'#fff', 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 12
    },
    label: {
        fontSize: 14, 
        color: '#555',
        marginBottom: 6
    },
    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },
});

export default LogSymptomEntryForm;