import { Picker } from "@react-native-picker/picker";

import { StyleSheet, View } from "react-native";
 
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
 
type Props = {

  species: "dog" | "cat";

  breed: string;

  onBreedChange: (breed: string) => void;

};
 
export default function RNTriggerPetBreedDropdownmenu({

  species,

  breed,

  onBreedChange,

}: Props) {

  const breeds = species === "dog" ? Dog_Breeds : Cat_Breeds;
 
  return (
<View style={styles.container}>
<Picker

        selectedValue={breed}

        onValueChange={(value) => onBreedChange(String(value))}

        mode="dropdown"

        dropdownIconColor="#3E4946"

        style={styles.picker}
>
<Picker.Item

          label="Select Breed"

          value=""

          color="#6B7280"

        />
 
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
 
const styles = StyleSheet.create({

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

  picker: {

    width: "100%",

    minHeight: 52,

    color: "#3E4946",

  },

});
 