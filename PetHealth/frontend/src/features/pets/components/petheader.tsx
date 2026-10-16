import React from 'react';
import {StyleSheet, Text, View, Pressable} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';


export default function PetHeader({ onBack }: { onBack: () => void }) { 

    return(
        <View style={styles.header}>
            {/*Icon */}
            <View style={styles.innerheader}>
                <Pressable onPress={onBack}>
                    <AntDesign name="arrowleft" size={24} color="black" />
                </Pressable>                
                
            </View>
                <Text style={styles.headerText}>Add New Pet</Text>
        
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
        position:'absolute',
        width: '100%',
        textAlign: 'center',
    }
});