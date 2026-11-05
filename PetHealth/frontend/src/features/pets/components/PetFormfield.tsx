import {useState} from "react";
import { TouchableOpacity, View, Pressable, Text, StyleSheet, TextInput, Button } from "react-native";
import { colors, spacing, radius } from "@theme";

//Props for Pet Form Field
type PetFormFieldProps = { 
    label: string;//Lable for Pet Form Details (subtitle)
    value: string;//Value 
    onChangeText: (text: string) => void;
    placeholder?: string;//Placeholder text
    keyboardType?: 'default' | 'numeric';//Keyboard 
}

//Main reusable component for Pet Form Field
const PetFormField = ({ label, value, onChangeText, placeholder, keyboardType }: PetFormFieldProps) =>{
    return(
        //Style for main outer container
        <View style={styles.container}>
            
            <Text style={styles.label}>{label}</Text>
            
            <TextInput
                style={[styles.input, styles.smallInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                keyboardType={keyboardType}
            >
            </TextInput>
            </View>
    );    
};


//style sheet
const styles = StyleSheet.create({
    container:{
        padding: 20, 
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
        width:200,
        height:67,
    },

    //Displayed Message for user
    result: {
        marginTop: 10, 
        fontSize: 16,
        fontWeight: '600'
    },

    smallInput: {
        height: 60,
        width: 155,
    }

});

export default PetFormField;
