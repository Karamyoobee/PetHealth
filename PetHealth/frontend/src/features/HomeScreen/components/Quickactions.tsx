import React from 'react';
import {StyleSheet, ColorValue,
        Text, Pressable, View} from 'react-native';

//Add different icons for Quick Actions (4 different cards)

type QuickActionsProps = {
    icon:React.ReactNode ,//Accepts piece of UI as an Icon
    tintcolor:  ColorValue,//background color of Card
    label:string;//Represent text 
    onPress: () => void;//function...
};

export default function QuickActions({icon, tintcolor, label, onPress}: QuickActionsProps) { 
    return(
        <Pressable style={styles.card} onPress={onPress}>
            <View style={[styles.iconCircle, {backgroundColor: tintcolor }]}>
                {icon}
            </View>
            <Text style={styles.label}>{label}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        width:'48%',
        backgroundColor: 'white',
        borderRadius: 15, 
        padding: 14, 
        flexDirection: 'row',//icon and label align side by side
        shadowColor: 'black',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'center',
        gap: 10,
    },

    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    }

})