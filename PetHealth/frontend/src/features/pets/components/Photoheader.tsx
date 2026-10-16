import React from "react";
import { Pressable, Text, StyleSheet, View, Image } from "react-native";
import { colors, spacing, radius } from "@theme";
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';


type PhotoProps = {
    photoUri? : string | null;
    onBack: () => void;
    onDelete: () => void;
};

export default function PhotoHeader({photoUri, onBack, onDelete }: PhotoProps) { 

    return(
        <View style={styles.container}>

        {/*Photo uri - cover */}
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover"></Image>         ):(
            <View style={[styles.photo, styles.placeholder]}/>
        )}   

        {/*Back Icon */}        
        <Pressable style={[styles.button, styles.left]} onPress={onBack}>
            <AntDesign name="arrowleft" size={24} color="black" />
        </Pressable>


        {/*Delete Icon */}
        <Pressable style={[styles.button, styles.right]} onPress={onDelete}>
            <Ionicons name="trash-bin" size={24} color="black" />            
        </Pressable>

        </View>


    )
}

const styles = StyleSheet.create({

    container: {
        width: '100%',
        height: 240,
    },

    photo: {
        width:"100%",
        height: "100%",
    },

    placeholder: {
        backgroundColor: 'gray',
    },

    button:{
        position:'absolute',
        borderRadius: 20,
        backgroundColor: 'white',
        alignItems: 'center',
        top: 16,
        width: '40%',
        height: '40%',
        justifyContent: 'center',
    },

    right:{
        right: 20,
    },

    left: {
        left: 20,
    }
});