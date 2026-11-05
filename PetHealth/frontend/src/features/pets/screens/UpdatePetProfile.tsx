import { useState, useEffect } from "react";
import {ScrollView, View, Text, StyleSheet, Button, Pressable, Alert } from "react-native";
import PetFormField from "../components/PetFormfield";
import UpdatePetHeader from "../components/updatepetheader";
import SegmentControl from "../components/segmentcontrol";
import { PrimaryButton } from "../components/primarybutton";
import RNTriggerPetBreedDropdownmenu from "../components/dropdownmenu";
import Imagepicker from "../components/Imagepicker";
import { showToast } from "../../../components/Toast";
import { api } from "../../../api/client";
import { Pet } from "../../../types";

//Props for Updating pet profile screen 
type updatepetProps = {
  petId: string | null; //identify the pet ID from the backend (that is to be edited)
  onBack: () => void;//return to previous screen
}

//Function Component - UI 
export default function UpdatePetProfile({petId, onBack}: updatepetProps)  {
    const [petName, setPetName] = useState('');//Pet Name
    const [age, setAge] = useState('');//Age Entry Field
    const [weight, setWeight] = useState(''); /// Weight Entry Field
    const [submitted, setSubmitted] = useState(false); // Submit Button
    const [species, setSpecies] = useState<'dog' | 'cat'>('dog'); // Toggle Button - Dog / Cat
    const [gender, setGender] = useState<'female' | 'male'>('female'); // Toggle Button - Female / Male
    const [status, setStatus] = useState<'spayed/neutered' | 'intact'>('spayed/neutered'); //Toggle Button - Spayed/Neutured or Intact
    const [breed, setBreed] = useState('') // Breed's DrowpDown Menu
    const [saving, setSaving] = useState(false);//only true when updating as a request is in progress
    const [errorMessage, setErrorMessage] = useState('');//If pet fails to load (show error message)
    const [photoUri, setPhotoUri] = useState<string|null>(null);//Set Image photoUri link / file
    const [pet, setPet]  = useState<Pet | null>(null);//pet data fetched from database
    const [loading, setLoading] = useState(true);//only True - when pet details are being fetched from backend
    const [error, setError] = useState<string|null>(null);//Display error message if fails to load
    //Delete state
    const [deleting, setDeleting] = useState(false);

    useEffect(() =>{
        async function loadPet(){
            //No Pet ID found: loads nothing, stops loading!
            if(!petId) {setLoading(false); return;}
            try{//Try : display Pet current list
                const pets = await api.listCurrentUserPets(); //update pet details
                const found = pets.find((p) => p.id === petId) //save details
                if(found){//Compare existing form details with pet details (stored in database)
                  setPetName(found.name);//form Name vs Name(database stored)
                  setGender(found.sex === 'female' ? 'female': 'male');//Form Gender vs Gender(database stored))
                  setBreed(found.breed);//Form Breed vs Breed(database stored))
                  setAge(String(found.age));//Form Age vs Age(database stored))
                  setWeight(String(found.weightKg));//Form Weight vs Weight(database stored))
                  setSpecies(found.species === 'Dog' ? 'dog' : 'cat');//Form Gender vs Gender(database stored))
                  setStatus(found.spayedNeutered ? 'spayed/neutered': 'intact');//Form Gender vs Gender(database stored))
                  setPhotoUri(found.photoUri ?? null);
                }
            }
            catch(e){//Catch Error: Display Error message if failed
                setErrorMessage("Unable to load Pet!")
            }
            finally{//Runs: stop loading state
                setLoading(false)
            }

        }
        loadPet();//Fetch when Effect loads
    },[petId]);//Repeat when selected pet changes

    //Updated form values being saved and sent to database only for Selected Pet
    const handleSave = async () => {
      //Create updated pet object from current form values and backend 
      const petData = {
        name: petName.trim(),//Pet Name
        photoUri: photoUri,//Photo Image
        species: species === 'dog' ? 'Dog' as const: 'Cat' as const, //Pet Species (Dog/Cat)
        breed: breed,//Breed of Pet
        age: Number(age),//Age of Pet
        sex: gender,//Gender of Pet
        weightKg: Number(weight),//Weight of pet
        spayedNeutered: status === 'spayed/neutered',//Sp
      };

        if (!petId || saving || loading) return;
        setSaving(true);
        setSubmitted(false);
        setErrorMessage('');

        try{
            await api.updatePet(petId, petData);
            setSubmitted(true);
            showToast("Pet profile updated successfully.");
          } catch(error){
            setErrorMessage(error instanceof Error ? error.message : "Could not update the pet profile. Please try again.");
          } finally {
            setSaving(false);
      }
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

    //Handler function for Pet Dog / Cat Dropdown select
    const handleSpeciesChange = (newSpecies: 'dog' | 'cat') => {
        setSpecies(newSpecies);
        ('');
    };

    //Handle home screen for pet profile
    const [screen, setScreen] = useState('home');

    return(
        <View style={styles.container}>
        {/*Header for Screen*/}
        <UpdatePetHeader onBack={onBack}/>{/*Back Button - Previous Screen */}

    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
              {/*Pet Photo Picker Feature - allow pet to access their mobile phone files 
              and pick an image to display in their avatar*/}
              <View style={{ alignItems: 'center', marginBottom: 20}}>
                  <Imagepicker onImageSelected={setPhotoUri}/>
              </View>



        {/*1. Add Pet Name - Entry Field */}
        <PetFormField 
            label="Pet Name"
            value={petName}
            onChangeText={setPetName}
            placeholder="e.g Bella"
        />
        
        {/*2. Add Pet Species (Toggle button - dog or cat) */}
        <View style={styles.sectionContainer}>
        <SegmentControl 
            options={options}
            value={species}
            onChange={setSpecies}
        />
        </View>
        
        {/*Species Title*/}
        <Text style={styles.label}>Species</Text>

        {/*3. Add Breed Selection - based on chosen pet (dog/cat) {drop down menu} */}
        <View style={styles.sectionContainer}>
        <Text style={styles.label}>Select Breed</Text>
        <RNTriggerPetBreedDropdownmenu
            species={species} //need to fix
            breed={breed}
            onBreedChange={setBreed}
        />
        </View>

        {/*4. Add Age */}
        <View style={styles.halfRow}>
            <View style={styles.halfInput}>
              <PetFormField 
                label = "Age"
                value={age}
                onChangeText={setAge}
                placeholder="age"
              />
        </View>

        {/*5. Add Weight */}
        <View style={styles.halfInput}>
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

        {/*Submit Button - Save updated pet details */}
        <PrimaryButton label={saving ? "Saving..." : "Update Pet Details"} disabled={loading || saving || !petId} onPress={handleSave} />
        {errorMessage ? <Text style={styles.result}>{errorMessage}</Text> : null}
        {submitted && <Text style={styles.result}>Pet Details have been updated!</Text>}
        {/*Success Message - one user has clicked on "Update Pet Details" = Button*/}

    </ScrollView>

        </View>
    );
 }

 //Main Style Sheet
const styles = StyleSheet.create({
    
    //Displayed Message for user
    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600',
        textAlign: 'center',
    },

    //Container Style for Main Form 
    container:{
        flex: 1,
    },
  
    //Scroll View Style #1
    scrollView: {
      flex: 1,
    },


    //Scroll View Content Style 
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40, // Space at the bottom so you can scroll past the last button
      paddingTop: 10,
    },


  //Species Label Style
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8, // Pushes the input down so it doesn't overlap
    fontWeight: '500',
  },

  // Section Wrapper (Species, Gender, etc.)
  sectionContainer: {
    marginBottom: 20,
  },

  // Age and Weight Half Row
  halfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },

  halfInput: {
    flex: 1, 
  },
});

