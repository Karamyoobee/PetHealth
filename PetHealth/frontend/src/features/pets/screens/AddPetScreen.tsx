import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";
import PetFormField from "../components/PetFormfield";
import Header from "../components/header";
import SegmentControl from "../components/segmentcontrol";
//import PrimaryButton from "../components/primarybutton"; - once complete
//import segmentcontrol from "../components/segmentcontrol";

//Function Component - UI 
const AddPetScreen = () => {
    const [petName, setPetName] = useState('');//Pet Name
    const [age, setAge] = useState('');//Age Entry Field
    const [weight, setWeight] = useState(''); /// Weight Entry Field
    const [submitted, setSubmitted] = useState(false); // Submit Button
    const [species, setSpecies] = useState<'dog' | 'cat'>('dog'); // Toggle Button - Dog / Cat
    const [gender, setGender] = useState<'female' | 'male'>('female'); // Toggle Button - Female / Male
    const [status, setStatus] = useState<'spayed/neutered' | 'Intact'>('spayed/neutered'); //Toggle Button - Spayed/Neutured or Intact

    const handleSave = () =>{
        //ToDo: during the work of API call / local storage database 
        setSubmitted(true);
    }

    //Species - Dog or Cat = Segment Options
    const options = [
        { label: 'Dog', value: 'dog' as const },
        { label: 'Cat', value: 'cat' as const },
    ];

    //Male / Female Segment Option 
    const genderoptions = [
        {label: 'Female', value:'female' as const},
        {label: 'Male', value: 'male' as const},
    ];

    //Pet_Status Options 
    const statusoptions = [
        {label: 'Spayed/Neutered', value: 'spayed/neutered'},
        {label: 'Intact', value: 'intact'},
    ];

    return(
        <View style={styles.container}>
        {/*Header for Screen*/}
        <Header />

        {/*1. Add Pet Name - Entry Field */}
        <PetFormField 
            label="Pet Name"
            value={petName}
            onChangeText={setPetName}
            placeholder="e.g Bella"
        />

        {/*2. Add Pet Species (Togglet button - dog or cat) */}
        <Text style={styles.label}>Species</Text>
        <SegmentControl 
            options={options}
            value={species}
            onChange={setSpecies}
        >
        </SegmentControl>

        {/*3. Add Breed Selection - based on chosen pet (dog/cat) {drop down menu} */}
        
        {/*4. Add Age */}
        <View style={styles.row}>
            <View style={styles.halfEntryField}>
            <PetFormField 
                label = "Age"
                value={age}
                onChangeText={setAge}
                placeholder="age"
            >
            </PetFormField>
        </View>


        {/*5. Add Weight */}
        <View style={styles.halfEntryField}>
            <PetFormField 
                label = "Weight"
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g 45"
            >
            </PetFormField>
        </View>
        </View>

        {/*6. Add Gender */}
        <Text style={styles.label}>Gender</Text>
        <SegmentControl 
            options={genderoptions}
            value={gender}
            onChange={setGender}
        >
        </SegmentControl>
        {/*7. Add Status - Spayed/Neutered or Intact */}
        <Text style={styles.label}>Status</Text>
        <SegmentControl 
            options={statusoptions}
            value={status}
            onChange={setStatus}
        >
        </SegmentControl>
        <Button title="Save Pet" onPress={handleSave} color="#1B6A60"/>
        {submitted && <Text style={styles.result}>Your new pet has been saved!</Text>}

        </View>
    );
 }

 //style sheet
const styles = StyleSheet.create({
    container:{
        padding: 20, 
    },
    //Main Title for Form Screen - 'Add New Pet'
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
    },

    //Title Card background only 
    titleCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16, 
        marginBottom: 12,
    },

    //label on top of 
    label:{
        fontSize: 14,
        color: '#555', 
        marginBottom: 6,
    },

    //Displayed Message for user
    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },

    //Form Card - behind Add New Pet 
    Card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
    },

    //Half Entry Field for Pet Age & Weight 
    halfEntryField: {
        flex: 1,
        },

    //Row for Age & Weight User Entry 
    row: { 
        flexDirection: 'row',
        gap: 12,
    }
});

//Display Add Pet Screen - New Form 
export default AddPetScreen;