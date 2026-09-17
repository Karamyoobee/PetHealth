import {useState} from "react";
import { View, Pressable, Text, StyleSheet, TextInput, Button } from "react-native";
import { colors, spacing, radius } from "@theme";

type PetFormFieldProps = { 
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric';
}

//Form Structure 
const PetFormField = ({ label, value, onChangeText, placeholder, keyboardType }: PetFormFieldProps) =>{
    return(
        //Style declaration 
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
            >
            </TextInput>
            </View>
    );    
};

//To Do 
//1. Add back arrow 


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
    },
    //label on top of 
    label:{
        fontSize: 14,
        color: '#555', 
        marginBottom: 6,
    },

    //User Input Field 
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12, 
        padding: 10, 
        marginBottom: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        width:300,
        height:50,
    },

    //Displayed Message for user
    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },


});


export default PetFormField;
