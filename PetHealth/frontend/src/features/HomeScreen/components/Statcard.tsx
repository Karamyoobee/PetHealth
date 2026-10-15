import React from 'react';
import {StyleSheet, ColorValue, StyleProp, TextStyle, ViewStyle, View, Text} from 'react-native';

type StatCardProps = {
    icon:React.ReactNode ,//Accepts piece of UI as an Icon
    tintcolor:  ColorValue,//background color of Card
    value: string | number ,//actual stat represented for pet
    label: string,//Text on Card "Vaccines"
};

export default function StatCard({icon, tintcolor, value, label}: StatCardProps) { 
    return(
            <View style={styles.card}>
                <View style={[styles.iconCircle, {backgroundColor: tintcolor}]}>
                    {icon}
                </View>
                <Text>
                    {value}
                </Text>
                <Text>
                    {label}
                </Text>

            </View>
    )
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15, 
        padding: 16, 
        shadowColor: 'black',
        shadowOpacity: 3,
        shadowRadius: 8,
        elevation: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    value: {
        fontSize: 22, 
        fontWeight: '700'
    },
    label: {
        fontSize: 12,
        color: '#6B7280',
    }

})