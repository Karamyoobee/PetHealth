import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";
import DescriptionSymptomInput from "../components/DescriptionSymptomInput";
//import PrimaryButton from "../components/primarybutton"; - once complete
//import segmentcontrol from "../components/segmentcontrol";

const LogSymptomEntryForm = () => {
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSave = () => {
        //Add API call / local storage save
        setSubmitted(true);
    };

    return(
        <View style={styles.container}>
            <View style={styles.titleCard}>
                <Text style={styles.title}>Quick Log Symptom</Text>
            </View>

            {/* 1. Pet Selector (select from their different pets) */}
            {/*2. Category selector () */}

            <DescriptionSymptomInput
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
    }
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

export default LoySymptomEntryForm;