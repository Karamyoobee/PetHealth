import { Picker } from "@react-native-picker/picker";

import { StyleSheet, View } from "react-native";
 
//Main list for duration
const Duration_time = [

  "Today",

  "1 Day",

  "2 days",

  "3 days",
  
  "1 Week",
   
  "2 Weeks",

];
 
type Props = {

  duration: string;

  onDurationChange: (duration: string) => void;

};
 
export default function PetDurationDropdownmenu({

  duration,

  onDurationChange,

}: Props) {

 
  return (
<View style={styles.container}>
<Picker

        selectedValue={duration}

        onValueChange={(value) => onDurationChange(String(value))}

        mode="dropdown"

        dropdownIconColor="#3E4946"

        style={styles.picker}
>
<Picker.Item

          label="Select duration"

          value=""

          color="#6B7280"

        />
 
        {Duration_time.map((option) => (
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
 