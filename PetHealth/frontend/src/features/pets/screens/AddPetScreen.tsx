//React Management State (required to use 'usestate')
import { useState } from "react";

//React Native UI components and alerts
import {ScrollView, View, Text, StyleSheet, Button , Alert} from "react-native";

//Reusable access to Pet Form file  for (add new pet screen)
import PetFormField from "../components/PetFormfield";

//Access to Pet Header file  for (Add New Pet Screen)
import PetHeader from "../components/petheader";

//Access to Segment Control file  for (Add New Pet Screen)
import SegmentControl from "../components/segmentcontrol";

//Access to Primary Button file for (Add New Pet Screen)
import { PrimaryButton } from "../components/primarybutton";

//Access to dropdown menu file for (Add New Pet Screen)
import RNTriggerPetBreedDropdownmenu from "../components/dropdownmenu";

//Access to Image picker file for (Add New Pet Screen)
import Imagepicker from "../components/Imagepicker";

//Connect Backend database usage -> display and store frontend user input fields
import { api } from "../../../api/client";

//Connect local uri stored to cloud stored on Cloudinary (swap photoUri used to real live image link) - https://
import { uploadImageToCloudinary } from "../../../api/cloudinary";

type AddPetProps = { 
  onBack: () => void;//Return to previous screen
  onSaved?: () => void;//Optional only: Called only after pet has been successfully saved
};

//Main Component fo (Add Pet Screen) - UI (Add New Pet Form)
export default function AddPetScreen({ onBack, onSaved }: AddPetProps) {
    const [petName, setPetName] = useState('');//Pet Name
    const [age, setAge] = useState('');//Age Entry Field
    const [weight, setWeight] = useState(''); /// Weight Entry Field
    const [submitted, setSubmitted] = useState(false); // Submit Button
    const [species, setSpecies] = useState<'dog' | 'cat'>('dog'); // Toggle Button - Dog / Cat
    const [gender, setGender] = useState<'female' | 'male'>('female'); // Toggle Button - Female / Male
    const [status, setStatus] = useState<'spayed/neutered' | 'intact'>('spayed/neutered'); //Toggle Button - Spayed/Neutured or Intact
    const [breed, setBreed] = useState('') // Breed's DrowpDown Menu
    const [saving, setSaving] = useState(false);//Start saving State for Image
    const [photoUri, setPhotoUri] = useState<string|null>(null);//Set Image photoUri link / file

    //Handles: saving all pet's profile and uploading it's image 
    const handleSave = async () => {
      
      //Avoid the conflict of duplicate save requests!
      if (saving) return;


        try{
            setSaving(true);//Saving pet profile image
            //Upload user selected file (image) + copy and send to Cloudinary + send back URL for Mongodb database
            let finalPhotoUrl: string | null = null; //empty box for image final uri link

            //if conidition check : for origin (photoUri) - image link (project owned) + collect and store image link inside Cloud (cloudinary)
            if (photoUri){
              finalPhotoUrl = await uploadImageToCloudinary(photoUri)
            }
          
      //Prepare basic pet profile details & backend API connections
      const petData = {
        name: petName.trim(),//Pet Name
        species: species === 'dog' ? 'Dog' as const: 'Cat' as const, // Pet Breed
        breed: breed,//Pet Breed
        age: Number(age),//Pet Age
        sex: gender,//Pet Gender
        weightKg: Number(weight),//Weight of Pet
        spayedNeutered: status === 'spayed/neutered',//Pet Status
        photoUri: finalPhotoUrl,//Photo URL link - from cloundinary
      };

            //Pet profile being "Saved" and sent to Backend API & Mongodb Database
            const savedPet = await api.createPet(petData);

            //Verify: Saved Pet Profile Details securely into database 
            console.log("Pet returned by backend:", savedPet);
            setSubmitted(true);//Pet Profile confirmation - details saved!
            onSaved?.();

          } catch(error){//1. If a user's photo was selected
            //2. Uploaded to Cloundinary 
            //3. Cloundinary live image URL - stored in backend database
            console.error(error)//error message
            Alert.alert('Unable to Save Pet!', 'Please, try again!');
          } finally{
            //Saving state stoped once request has finished either (success or fail)
            setSaving(false)
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

    return(
        <View style={styles.container}>
        {/*Header for Screen*/}
        <PetHeader  onBack={onBack}/>
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>

              <View style={styles.photoSection}>
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
        <Text style={styles.label}>Species</Text>
        <SegmentControl 
            options={options}
            value={species}
            onChange={setSpecies}
        />
        </View>
        {/*3. Add Breed Selection - based on chosen pet (dog/cat) {drop down menu} */}
        <View style={styles.sectionContainer}>
        <Text style={styles.label}>Breed</Text>
        <RNTriggerPetBreedDropdownmenu
            species={species}
            breed={breed}
            onBreedChange={setBreed}
        />
        </View>

        {/*4. Add Age */}
        <View style={styles.halfRow}>
            <View style={styles.halfInput}>
              <PetFormField 
                label = "Age (Years)"
                value={age}
                onChangeText={setAge}
                placeholder="e.g. 3"
                keyboardType="numeric"
              />
        </View>

        {/*5. Add Weight */}
        <View style={styles.halfInput}>
            <PetFormField 
                label = "Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 45"
                keyboardType="numeric"
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

        {/*Main Save Button - Create new pet for User */}
        <PrimaryButton label="Save Pet" onPress={handleSave} />
        {submitted && <Text style={styles.result}>Your new pet has been saved!</Text>}
        {/*Display Success Message - after pet has been saved*/}
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

    container:{
        flex: 1,
    },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32, // Space at the bottom so you can scroll past the last button
    paddingTop: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  
  // Standard Input Group
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#3E4946',
    marginBottom: 6, // Pushes the input down so it doesn't overlap
    fontWeight: '600',
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
    marginBottom: 16,
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
    gap: 12,
    marginBottom: 0,
  },
  halfInput: {
    flex: 1, 
  },
});
