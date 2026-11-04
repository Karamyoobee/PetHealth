import { Picker } from "@react-native-picker/picker";//React Dropdown (picker) component for selecting a breed
import { useEffect, useState } from "react";//React hooks: useEffect = runs code using load/change and useState = to store values
import { api } from "../../../api/client";//API connection to backend for fetching breed list
import { StyleSheet, View } from "react-native";//React Native UI - main components and styling
 
//Fallback dog breed - only shown if unable to connect and load backend breed list
const Dog_Breeds = [

  "Labrador Retriever",

  "Huntaway",

  "Border Collie",

  "New Zealand Heading Dog",

  "Staffordshire Bull Terrier",

  "Miniature Schnauzer",

  "Jack Russell Terrier",

  "German Shepherd",

  "Golden Retriever",

  "Fox Terrier",

  "Cocker Spaniel",

  "Shih Tzu",

  "Rottweiler",

  "Bichon Frise",

  "Cavalier King Charles Spaniel",

];

//Fallback of cat breed - only shown if unable to connect and load backend breed list
const Cat_Breeds = [

  "Domestic Shorthair",

  "Ragdoll",

  "Maine Coon",

  "Burmese",

  "British Shorthair",

  "Siamese",

  "Persian",

  "Devon Rex",

  "Sphynx",

  "Bengal",

  "Russian Blue",

  "Birman",

  "Abyssinian",

  "Norwegian Forest Cat",

  "Exotic Shorthair",

];
 
//Props for breed dropdown menu selection
type Props = {

  species: "dog" | "cat";//Species to be selected: only a dog or cat

  breed: string;//Selected breed accepted and stored as 'String' type

  onBreedChange: (breed: string) => void;//Only called when a new breed selected by pet is chosen

};
 
//Main dropdown component for breed list - according selected species only
export default function RNTriggerPetBreedDropdownmenu({species,breed,onBreedChange}: Props) {

  //Fallback list for chosen species
  const fallback = species === "dog" ? Dog_Breeds : Cat_Breeds;
  //Fallback list - shown first for breeds displayed on first launched dropdown menu selection for breed list
  const [breeds, setBreeds] = useState<string[]>(fallback);
 
  //Refresh breed list whenever species changes from (dog/cat)
  useEffect(() => {
    setBreeds(fallback); //display hardcoded (stored breed list above)
    api
      .listBreeds(species) //ask Flask for list from MongoDB
      .then((names) => {
        if(names.length > 0) setBreeds(names);//Only use backend list if it contains breed list
      })
      .catch(() => {}); // if unable to connect to database use above fallback - to display dropdown
  }, [species]);  

  return (
      <View style={styles.container}>
        {/*Breed dropdown - updates on change = occur's once chosen breed*/}
          <Picker
              selectedValue={breed}
              onValueChange={(value) => onBreedChange(String(value))}
              mode="dropdown"
              dropdownIconColor="#3E4946"
              style={styles.picker}
          >
      
        {/*Default Text - no breed has been selected yet*/}
          <Picker.Item 
              label="Select Breed"
              value=""
              color="#6B7280"
          />
 
        {/*One Dropdown menu for each breed in the entire combined list of
        1. Dogs 
        2. Cats */}
          {breeds.map((option) => (

          <Picker.Item
            key={option}
            label={option}
            value={option}
            color="#3E4946"
          />

        ))}
</Picker>
</View>

  );

}
 
//Main Style Sheet for Component
const styles = StyleSheet.create({

  //Dropdown menu box (border, rounded corners, size)
  container: {
    width: "100%",
    minHeight: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    justifyContent: "center",
    overflow: "hidden",

  },

  //dropdown menu style: text and size
  picker: {
    width: "100%",
    minHeight: 52,
    color: "#3E4946",
  },

});
 