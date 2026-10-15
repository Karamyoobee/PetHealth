//React Libraries
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

//Main Function for Header of Screen
export default function Header() { 
    return(
        <View style={styles.header}>
            {/*Icon */}
            <View>
               {/*Add Back Arrow Icon*/} 
                <Text style={styles.headerText}>Log Symptom</Text>
            </View>
        </View>


    )
}

const styles = StyleSheet.create({
    header: {
        width: '120%',
        height: '7%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderColor: 'gray',
        marginTop: 24,
        marginLeft:-29,
    },

    headerText: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#333',
        letterSpacing: 1,
    }
});