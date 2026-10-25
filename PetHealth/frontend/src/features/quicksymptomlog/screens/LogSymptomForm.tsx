import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";//React - Native Libraries
import DescriptionSymptomInput from "../../../components/QuickLogSymptom/DescriptionSymptomInput";
import { SaveLog } from "../../../components/QuickLogSymptom/SaveLogButton";
import { SymptomTextField } from "../../../components/QuickLogSymptom/DescriptionSymptomInput";
import SectionHeader from "../../../components/QuickLogSymptom/SectionHeader";
import PetDurationDropdownmenu from "../../../components/QuickLogSymptom/DurationDropdown";
import SelectPet from "../../../components/QuickLogSymptom/SelectPet";
import SelectCategory from "../../../components/QuickLogSymptom/SelectCategory";
import SeveritySegmentButton from "../../../components/QuickLogSymptom/Severity";
import { Symptom } from "../../../types";

type LogSymptomProps = { 
  onBack: () => void;
}; 

const CategoryOptions:Symptom['category'][] = ['Digestive', 'Skin', 'Mobility', 'Appetite'];

export default function LogSymptom({onBack}:LogSymptomProps){
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [category, setCategory] = useState<'Digestive' | 'Skin' | 'Mobility' | 'Appetite'>('Digestive');
    const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' >('Mild'); //Toggle Button - Spayed/Neutured or Intact
    const [pet, setPet] = useState('');
    
    const pets=['Luna','Max']

    const handleSave = () => {
        //Add API call / local storage save
        setSubmitted(true);
    };

    return(
        <View style={styles.container}>
            <SectionHeader onBack={onBack}/>

            {/* 1. Pet Selector (select from their different pets) */}
            <View style={styles.Pet}>
            <SelectPet
                options={pets}
                value={pet}
                onChange={setPet}//Button
            />
            </View>


            {/*2. Category selector () */}    
            <View style={styles.Category_style}>
            <Text style={styles.Category_title}>Category</Text>
            <SelectCategory
                category_option={CategoryOptions}
                value={category}
                onChange={setCategory}
            />

            </View>

            {/*3. Symptom Description Notes Area */}        
            <SymptomTextField
              label=""
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Vommiting after eating, reduced appetite for 2 days..."
              />

            {/*4. Severity (select from options) - Segment Control Button */}
            <Text>Severity</Text>
            <SeveritySegmentButton
            options={[
                {label: 'Mild', value: 'Mild'},
                {label: 'Moderate', value: 'Moderate'},
                {label: 'Severe', value: 'Severe'},
            ]}
                value={severity}
                onChange={setSeverity}
            />

            {/*5. Duration dropdown */}
            {/*Add below...*/}

            <View style={styles.Button}>
                    <SaveLog label="Save Entry" onPress={handleSave}/>
                    {submitted && <Text style={styles.result}>Symptom Saved!</Text>}

            </View>

        </View>
    );
}

//Styles Sheet 
const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#FDFCF9',
    },
    
    Button: {
        marginTop: 340,
    },

    Category_title:{
        color:'#000',
        fontWeight: '500',
        marginLeft: 8,
        marginBottom:8,
        marginTop: 16,
    },
    
    Category_style:{
        marginBottom: 16,
    },

    Pet:{
        marginBottom: 16,
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

