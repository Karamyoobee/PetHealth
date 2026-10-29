import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';

type headerprops = {
    title: string;
}

export default function MainHeader({ title}: headerprops) { 
    return(
        <View style={styles.header}>
            {/*Icon */}
            <View style={styles.innerheader}>
      
                
            </View>
                <Text style={styles.headerText}>{title}</Text>
        </View>


    )
}

const styles = StyleSheet.create({


    innerheader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },

    header: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: "#E4E2DA",
        paddingVertical: 12,
    },

    headerText: {
        fontWeight: '600',
        fontSize: 17,
        color: '#333',
        textAlign: 'center',
        pointerEvents: 'none',
    }
});
