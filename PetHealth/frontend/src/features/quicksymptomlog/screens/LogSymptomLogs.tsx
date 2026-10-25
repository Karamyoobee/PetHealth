import {View, Text, StyleSheet, Button, ScrollView,Image } from "react-native";//React - Native Libraries
import {useState} from 'react';
import DetailCardSymptomLog from "../../../components/QuickLogSymptom/DetailCardSymptomlog";
import SectionHeader from "../../../components/QuickLogSymptom/SectionHeader";
import BottomNavBar from "../../HomeScreen/components/TabBar";


type MySymptomlog={
    onBack: () => void;
}

export default function MyLogSymptom({onBack}: MySymptomlog){
    return(
        <View style={styles.maincontainer}>
            
            <SectionHeader onBack={onBack} title="Symptom Logs"/>
            
            <ScrollView contentContainerStyle={styles.scrollview_style}>
                {/*Pet Profile Card*/}
                <View style={styles.pet_profilecard}>
                    <Text></Text>
                </View>
            </ScrollView>


            <BottomNavBar/>
        </View>
    )
}

const styles = StyleSheet.create({

    //Pet Profile Card
    pet_profilecard:{
        backgroundColor: '#fff', 
        borderWidth: 1,
        borderColor:'#E6E8E3',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    },

    //scroll view style 
    scrollview_style:{
        padding: 16,
        gap: 14,
    },
    
    //row - main container
    maincontainer:{
        flex:1,
        backgroundColor: '#FAF7F0',
    }
    
})