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
        marginBottom: 16,
    },
    
    //label on top of 
    label:{
        fontSize: 13,
        color: '#3E4946',
        marginBottom: 6,
        fontWeight: '600',
    },

    //User Input Field 
    input: {
        borderColor: '#E2DED7',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        fontSize: 15,
        height: 50,
        width: '100%',
    },

    //Displayed Message for user
    result: {
        marginTop: 10, 
        fontSize: 16,
        fontWeight: '600'
    },

    smallInput: {
        height: 50,
        width: '100%',
    }

});

export default PetFormField;
