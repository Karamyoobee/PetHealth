import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";
import PetFormField from "../components/PetFormfield";
//import PrimaryButton from "../components/primarybutton"; - once complete
//import segmentcontrol from "../components/segmentcontrol";

//Function Component - UI 
const AddPetScreen = () => {
    const [petName, setPetName] = useState('');
    const [age, setAge] = useState('');
    const [weight, setWeight] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSave = () =>{
        //ToDo: during the work of API call / local storage database 
        setSubmitted(true);
    }

    return(
        <View style={styles.container}>
            <View style={styles.titleCard}>
                <Text style={styles.title}>Add New Pet</Text>
            </View>

        <PetFormField 
            label="Pet Name"
            value={petName}
            onChangeText={setPetName}
            placeholder="e.g Bella"
        />

        {/*2.Add Pet Specie (Togglet button - dog or cat) */}
        {/*3. Add Breed Selection - based on chosen pet (dog/cat) */}
        {/*4. Add Age */}
        {/*5. Add Weight */}
        {/*6. Add Gender */}
        {/*7. Add Status - Spayed/Neutered or Intact */}

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
});

//Display Add Pet Screen - New Form 
export default AddPetScreen;