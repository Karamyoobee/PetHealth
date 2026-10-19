import { useState, useEffect } from "react";
import {ScrollView, View, Text, StyleSheet, Button } from "react-native";
import PetFormField from "../components/PetFormfield";
import UpdatePetHeader from "../components/updatepetheader";
import SegmentControl from "../components/segmentcontrol";
import { PrimaryButton } from "../components/primarybutton";
import RNTriggerPetBreedDropdownmenu from "../components/dropdownmenu";
import Imagepicker from "../components/Imagepicker";
import { api } from "../../../api/client";
import { Pet } from "../../../types";

//Props for 
type updatepetProps = {
  petId: string | null;
  onBack: () => void;
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
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [photoUri, setPhotoUri] = useState<string|null>(null);//Set Image photoUri link / file
    const [pet, setPet]  = useState<Pet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string|null>(null);//Display error message if fails to load

    useEffect(() =>{
        async function loadPet(){
            //No Pet ID found: loads nothing, stops loading!
            if(!petId) {setLoading(false); return;}
            try{//Try : display Pet current list
                const pets = await api.listCurrentUserPets(); //update pet details
                const found = pets.find((p) => p.id === petId) //save details
                console.log("found: ", found)
                if(found){//Compare existing form details with pet details (stored in database)
                  setPetName(found.name);//form Name vs Name(database stored)
                  setGender(found.sex === 'female' ? 'female': 'male');//Form Gender vs Gender(database stored))
                  setBreed(found.breed);//Form Breed vs Breed(database stored))
                  setAge(String(found.age));//Form Age vs Age(database stored))
                  setWeight(String(found.weightKg));//Form Weight vs Weight(database stored))
                  setSpecies(found.species === 'Dog' ? 'dog' : 'cat');//Form Gender vs Gender(database stored))
                  setStatus(found.spayedNeutered ? 'intact': 'spayed/neutered');//Form Gender vs Gender(database stored))
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


    const handleSave = async () => {

      const petData = {
        name: petName.trim(),
        species: species === 'dog' ? 'Dog' as const: 'Cat' as const,
        breed: breed,
        age: Number(age),
        sex: gender,
        weightKg: Number(weight),
        spayedNeutered: status === 'spayed/neutered',
      };

        if (!petId) return;

        try{
            await api.updatePet(petId, petData);
            setSubmitted(true);
          } catch(error){
            console.error(error)
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
        <UpdatePetHeader onBack={() => setScreen('home')}/>

    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>

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

        <PrimaryButton label="Update Pet Details" onPress={handleSave} />
        {submitted && <Text style={styles.result}>Pet Details have been updated!</Text>}

    </ScrollView>

        </View>
    );
 }

 //style sheet
const styles = StyleSheet.create({
      //Displayed Message for user
    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600',
        textAlign: 'center',
    },

    container:{
        flex: 1,
    },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40, // Space at the bottom so you can scroll past the last button
    paddingTop: 10,
  },
  
  // Standard Input Group
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8, // Pushes the input down so it doesn't overlap
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E4E2DA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  // Section Wrapper (Species, Gender, etc.)
  sectionContainer: {
    marginBottom: 20,
  },

  // Row for Toggle Buttons (Dog/Cat, Male/Female)
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // Creates space between the two buttons
  },
  toggleButton: {
    flex: 1, // CRUCIAL: Makes both buttons take up exactly 50% of the row
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  activeToggle: {
    backgroundColor: '#1E7A6C', // Your teal color
    borderColor: '#1E7A6C',
  },
  inactiveToggle: {
    backgroundColor: '#fff',
    borderColor: '#1E7A6C',
  },
  activeToggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  inactiveToggleText: {
    color: '#1E7A6C',
    fontWeight: '600',
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

