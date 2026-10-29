import React from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Feather from '@expo/vector-icons/Feather';

export default function Header({ onBack }: { onBack: () => void }) { 
    return(
        <View style={styles.header}>
            {/*Icon */}
            <View style={styles.innerheader}>
                <Pressable onPress={onBack}>
                <FontAwesome name="paw" size={24} color="#1F7A66" />                    
                </Pressable>
                <Text style={styles.headerText}>PetHealth</Text>
                
                
            </View>
                {/*Notification Button*/}
                <Pressable>
                    <Feather name="bell" size={24} color="black" />
                </Pressable>

            
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E4E2DA",
        paddingVertical: 12,
    },

    headerText: {
        fontWeight: '600',
        fontSize: 17,
        color: '#333',
    }
});
