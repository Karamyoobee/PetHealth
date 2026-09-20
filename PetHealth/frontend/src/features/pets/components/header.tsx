import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Header() { 
    return(
        <View style={styles.header}>
            {/*Icon */}
            <View>
                <Text style={styles.headerText}>Add New Pet</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    header: {
        width: '120%',
        height: '15%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderColor: 'gray',
        marginTop: 7,
        marginLeft:-29,
    },

    headerText: {
        fontWeight: 'bold',
        fontSize: 20,
        color: '#333',
        letterSpacing: 1,
    }
});