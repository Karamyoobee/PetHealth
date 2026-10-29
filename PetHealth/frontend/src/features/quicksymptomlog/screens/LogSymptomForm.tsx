import { useState, useEffect } from "react";
import {View, Text, StyleSheet, Alert, ScrollView } from "react-native";//React - Native Libraries
import DescriptionSymptomInput from "../../../components/QuickLogSymptom/DescriptionSymptomInput";
import { SaveLog } from "../../../components/QuickLogSymptom/SaveLogButton";
import { SymptomTextField } from "../../../components/QuickLogSymptom/DescriptionSymptomInput";
import SectionHeader from "../../../components/QuickLogSymptom/SectionHeader";
import PetDurationDropdownmenu from "../../../components/QuickLogSymptom/DurationDropdown";
import SelectPet from "../../../components/QuickLogSymptom/SelectPet";
import SelectCategory from "../../../components/QuickLogSymptom/SelectCategory";
import SeveritySegmentButton from "../../../components/QuickLogSymptom/Severity";
import { Pet,Symptom } from "../../../types";
import { api } from "../../../api/client";

//Log Symptom Props
type LogSymptomProps = { 
  onBack: () => void;
  petId: string | null;
  onSaved: (petId: string) => void;
}; 

const CategoryOptions:Symptom['category'][] = ['Digestive', 'Skin', 'Mobility', 'Appetite'];

//Covert duration text to number to store for ideal database storage
const durationtoDaysformat = (d: string): number => {
    const n = parseInt(d, 10);//what does this mean..
    if (!Number.isFinite(n)) return 0;
    const text = d.toLocaleLowerCase();
    if(text.includes('week')) return n * 7;//7 Days a week
    if(text.includes('month')) return n * 30; //30 Days a month
    return n;//days variable count

}

export default function LogSymptom({onBack, petId, onSaved}:LogSymptomProps){
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'Digestive' | 'Skin' | 'Mobility' | 'Appetite'>('Digestive');
    const [severity, setSeverity] = useState<'Mild' | 'Moderate' | 'Severe' >('Mild'); //Toggle Button - Spayed/Neutured or Intact
    const [pets, setPets] = useState<Pet[]>([]);
    const [duration, setDuration] = useState('');
    
    const [selectedPetId, setSelectedPetId] = useState<string | null>(petId);
    const [saving, setSaving] = useState(false);

    //Handle Save Button 
    const handleSave = async () => {
        if (saving) return;// if pet symptom log is saved 
        if (!selectedPetId){
            Alert.alert('No pet has been selected','Please choose a pet');
            return;
        }
        if(!description.trim()){
            Alert.alert('Add a descrption here: ', 'Please describe the symptoms');
            return;
        }
        try{
            setSaving(true);
            const symptomData = {
                name: category, //Display Title on Log Card
                category,
                severity:severity.toLowerCase() as Symptom['severity'],
                notes: duration
                    ? `${description.trim()} (Duration: ${duration})`
                    :description.trim(),
                durationDays: durationtoDaysformat(duration),
                recordedAt: new Date().toISOString(),
            };
            console.log('Quick Log Symptom sent', JSON.stringify(symptomData));
            const saved = await api.createSymptom(selectedPetId, symptomData);
            console.log('Quick Log Symptom returned to backend: ', saved);
            Alert.alert('Saved', 'Symptom logged!', [{text: 'OK', onPress: () => onSaved(selectedPetId)}]);
        } catch(error){
            console.error(error);
            Alert.alert('Symptom was unable to be saved!','Please, try again !');
        }finally{
            setSaving(false);
        }
    }

    useEffect(() => {
        api.listCurrentUserPets().then(setPets).catch(console.error);
    }, []);

    const selectedName = pets.find((p) => p.id === selectedPetId)?.name ?? '';

    return(
        <View style={styles.container}>
            <SectionHeader onBack={onBack} title="Log New Symptom"/>

            {/* 1. Pet Selector (select from their different pets) */}
            <View style={styles.Pet}>
            <SelectPet
                options={pets.map((p) => p.name)}
                value={selectedName}
                onChange={(name) => setSelectedPetId(pets.find((p) => p.name === name)?.id??null)}//Button
            />
            </View>


            {/*2. Category selector () */}    
            <View style={styles.Category_style}>
            <Text style={styles.section_Headiing}>Category</Text>
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
            <Text style={styles.section_Headiing}>Severity</Text>
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
            <View style={styles.Duration_style}>
                <Text style={styles.section_Headiing} >Duration</Text>
                <PetDurationDropdownmenu
                    duration={duration}
                    onDurationChange={setDuration}
                />

            </View>

            <View style={styles.Button}>
                    <SaveLog label="Save Entry" onPress={handleSave}/>
            </View>

        </View>
    );
}

//Styles Sheet 
const styles = StyleSheet.create({

    //Consistent Heading for all sections
    section_Headiing: {
        fontSize: 18, 
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },

    //Duration style
    Duration_style:{
        marginTop: 16,
    },

    container: {
        padding: 20,
        backgroundColor: '#FDFCF9',
    },
    
    //Main Save Button Style
    Button: {
        marginTop: 20,
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
        marginTop: 20,
        marginBottom: 18,
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

