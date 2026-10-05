import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import StatCard from '../components/Statcard';
import QuickActions from '../components/Quickactions';

export default function HomeScreen(){
    return (
        <View style={styles.row}>
            {/*Add User Greetings*/}

            {/*Add Stat Card - Completed*/}
            <StatCard 
                icon={<MaterialIcons name="vaccines" size={24} color="green" />}
                tintcolor="#80EF80"
                label="Vaccines"
                value="0"
            />
            
            <StatCard
                icon={<AntDesign name="medicinebox" size={24} color="black" />}
                tintcolor="#FFC067"
                label="Meds"
                value="0"            
            />

            <StatCard
                icon={<FontAwesome5 name="clinicmedical" size={24} color="black" />}
                tintcolor="#FFC067"
                label="Vet Visits"
                value="0"            
            />

            {/*Add My Pets*/}
            
            {/*Add Quick Actions*/}
            <QuickActions 
            icon={<Text>🌡️</Text>} 
            tintcolor='#A1D99B'
            label="Log Symptom"
            onPress={() => {}} />
            
            <QuickActions 
            icon={<Text>⚖️</Text>} 
            tintcolor='#A1D99B'
            label="Weight Tracker"
            onPress={() => {}} />

            <QuickActions 
            icon={<Text>🩺</Text>} 
            tintcolor='#A1D99B'
            label="Vet Visits" 
            onPress={() => {}} />
            
            <QuickActions
            icon={<Text>💊</Text>}
            tintcolor='#FFC067' 
            label="Medications"
            onPress={() => {}} />

        </View>
)
}


const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 12, 
        paddingHorizontal: 16,
    },
});

