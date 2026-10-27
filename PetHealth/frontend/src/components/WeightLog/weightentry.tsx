//Imported React Libraries 
import {useState} from 'react';
import { Pressable, Text, View, StyleSheet, TextInput} from 'react-native';
import { colors, spacing, radius } from "@theme";

//Note: just need to connect and save weigh to backend (database)



export function WeightEntry(){

    const [text, onChangeText] = useState('Resusable Text');
    const [number, onChangeNumber] = useState('');

    return(
        <View>
            <TextInput
            style={styles.input}
            onChangeText={onChangeText}
            value={text}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    input: { 
        height:100,
        margin: 12,
        borderWidth: 1,
        borderColor: '#006400',
        padding: 10,
    }
})

export default WeightEntry;