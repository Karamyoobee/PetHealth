import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";
import PetFormField from "../components/PetFormfield";
import Header from "../components/header";
import SegmentControl from "../components/segmentcontrol";
import { PrimaryButton } from "../components/primarybutton";
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
    const [status, setStatus] = useState<'spayed/neutered' | 'intact'>('spayed/neutered'); //Toggle Button - Spayed/Neutured or Intact

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
    const pet_statusoptions = [
        {label: 'Spayed/Neutered', value: 'spayed/neutered' as const},
        {label: 'Intact', value: 'intact' as const},
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

        {/*2. Add Pet Species (Toggle button - dog or cat) */}
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
              />
        </View>


        {/*5. Add Weight */}
        <View style={styles.halfEntryField}>
            <PetFormField 
                label = "Weight"
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g 45"
            />
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
            options={pet_statusoptions}
            value={status}
            onChange={setStatus}
        >
        </SegmentControl>

        <PrimaryButton label="Save Pet" onPress={handleSave} />
        {submitted && <Text style={styles.result}>Your new pet has been saved!</Text>}

        </View>
    );
 }

 //style sheet
const styles = StyleSheet.create({
    container:{
        flex: 1,
    },

    //enable content scroll 
    Contentscroll: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },

    footer: {
        paddingHorizontal: 20, 
        paddingTop: 12,
        paddingBottom: 24,
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
        fontWeight: '600',
        textAlign: 'center',
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
        minWidth: 0,
        },

    //Row for Age & Weight User Entry 
    row: { 
        flexDirection: 'row',
        gap: 12,
    },

    //Input rectangle for Age & Weight
    smallInput: {
        height: 40,
        width: 150,
    }
});

//Display Add Pet Screen - New Form 
export default AddPetScreen;