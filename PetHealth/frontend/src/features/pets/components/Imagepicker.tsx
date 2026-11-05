import { View, StyleSheet, TouchableOpacity, Alert} from 'react-native';//React Native UI components and stylesheet
import React, { useState } from 'react';//React Native State Managementment
import { ImageSourcePropType, Image } from 'react-native';//Display Image component and type
import * as ImagePicker from 'expo-image-picker';//Use expo gallery access - allows user to pick from their photos
import AntDesign from '@expo/vector-icons/AntDesign';//Icon foe ideal add photo button
 
import ImageButton from './imagebutton';

//Props for Image Picker Component
type ImagepickerProps = {
  onImageSelected: (uri: string | null) => void;//Sends chosen image link (clodinary) to the database or Main screen
}

//Main component for Image Picker
export default function Imagepicker({ onImageSelected }: ImagepickerProps) {
 
  //local image link (stored inside mobile phone) to display 
  const [image, setImage] = useState<string | null>(null);

  //Open Gallery function, allow croping and saving image
  const pickImageAsync = async () => {
    //Allow Images, edit/cropping at full quality
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
 
    //user decides to close Image Picking
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);
      onImageSelected(selectedUri);
    } else {
      Alert.alert('You did not select any image.');
    }
  };
  //Display Reminder alert message (pop-up message)
 
  return (
    
    <View style={styles.container}>
        {/* Display selected image or grey placeholder if no image chosen*/}
        {image ? <Image source={{ uri: image }} style={styles.image} />:
        (<View style={[styles.image, { backgroundColor: '#eee'}]}/>)}
         
        {/* (+) Plus button - open up phone gallery for user */}
        <TouchableOpacity
          onPress={pickImageAsync}
          style={styles.floatbutton}>
          <AntDesign name="plus" size={24} color="#fff"/>
        </TouchableOpacity>
 
 
    </View>
  );
}
 
//Main Style Sheet
const styles = StyleSheet.create({

  //Wrapper Container for photo and plus button
  container: {
    position: 'relative',
    width:120,
    height: 120,
    margin: 20,
    right:30,
  },
 
  //Plus button - position at the corner of the photo placeholder
  floatbutton:{
    position: 'absolute',
    top: 130,
    left: 125,
    width: 52,
    height: 52,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: "#fff",
    padding: 0,
    backgroundColor:'#FFA500',
  },
 
  //Circle Photo / Placeholder for user
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
});
 