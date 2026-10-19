import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { ImageSourcePropType, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AntDesign from '@expo/vector-icons/AntDesign';
 
import ImageButton from './imagebutton';

type ImagepickerProps = {
  onImageSelected: (uri: string | null) => void;
}
 
export default function Imagepicker({ onImageSelected }: ImagepickerProps) {
 const [image, setImage] = useState<string | null>(null);

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
 
    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setImage(selectedUri);
      onImageSelected(selectedUri);
    } else {
      alert('You did not select any image.');
    }
  };
 
  return (
    <View style={styles.container}>
         
          {image ? <Image source={{ uri: image }} style={styles.image} />:
          (<View style={[styles.image, { backgroundColor: '#eee'}]}/>)}
         
 
        <TouchableOpacity
          onPress={pickImageAsync}
          style={styles.floatbutton}>
          <AntDesign name="plus" size={24} color="#fff"/>
        </TouchableOpacity>
 
 
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width:120,
    height: 120,
    margin: 20,
    right:30,
  },
 
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
 
  image: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
});
 