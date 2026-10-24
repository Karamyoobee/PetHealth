import { useState } from "react";
import {View, Text, StyleSheet, Button } from "react-native";//React - Native Libraries
import { SaveWeight } from "../../../components/WeightLog/Saveweightbutton";
import Feather from '@expo/vector-icons/Feather';//Calendar Icon Import 
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import WeightCard from "../../../components/WeightLog/WeightCard";
import { Pet } from "../../../types";
import { api } from "../../../api/client";
import { AddNewWeight } from "../../../components/WeightLog/Newweightentry";
import WeightHeader from "../../../components/WeightLog/Weight_header";
import BottomNavBar from "../../HomeScreen/components/TabBar";

type Unit = 'kg'|'lb'

//Weight Props
type WeightDashboardProps = { 
  onBack: () => void;
  onLogNew: () => void;
}; 

//Function - Log Weight
export default function WeighDashboard({onBack, onLogNew}:WeightDashboardProps){
    const [submitted, setSubmitted] = useState(false);//State - use for Button
    const [unit, setUnit] = useState<Unit>('kg');

    //Save Button - Store New Weight Entry & 
    const handleSave = () => {
        //Add API call / local storage save
        setSubmitted(true);
    };

    return(
        <View style={styles.container}>
            
            {/*Header*/}
            <WeightHeader onBack={onBack} label="Weight Tracker"/>

            {/*Weight Chart (simple)*/}
            <WeightCard
                current_Weight={20}
                last_Weighted_Date="oct 20, 2023"
                unit={unit}
                onUnitChange={setUnit}
            />

            {/*Chart Placeholder*/}
            <View style={styles.Chart}>
                <Text style={styles.section_title}>6 Month Trend</Text>
            </View>
            
            {/*Log Weight Entry Button*/}
            <View style={styles.addentrybutton}>
                <AddNewWeight label="+ Log New Weight Entry" onPress={onLogNew}
                />
            </View>

            {/*Recent Entries*/}
            <Text style={styles.Recent_weight}>Recent Entries</Text>
            <View style={styles.individual_card}>
                <View>
                    <Text style={styles.Recent_weight}>34.5kg</Text>
                    <Text style={styles.miniweight_text}>Aug 10</Text>
                </View>
                <View style={styles.ErrorChip}>
                    <Text style={styles.Chip_Text}>+0.3kg from previous</Text>
                </View>
            </View>

                        <View style={styles.individual_card}>
                <View>
                    <Text style={styles.Recent_weight}>34.5kg</Text>
                    <Text style={styles.miniweight_text}>Aug 10</Text>
                </View>
                <View style={styles.ErrorChip}>
                    <Text style={styles.Chip_Text}>+0.3kg from previous</Text>
                </View>
            </View>

            {/*Navigation Tab Bar*/}
            <BottomNavBar/>
        </View>
    );
}

//Styles Sheet 
const styles = StyleSheet.create({

    //Recent Weight Title Style 
    Recent_weight:{
        fontSize: 18,
        color:'#000',
        fontWeight: '500',
        marginTop: 16,
    },

    //Chart Placeholder Style - to be completed...
    Chart: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E0',
        padding: 100,//adjust later (once completed full chart)
        marginTop: 16,
    },

    //Chart Title (sectoin)
    section_title: {
        fontSize: 18,
        fontWeight: '600',
        color:'#000',
    },

    container: {
        padding: 20,
        backgroundColor: '#FDFCF9',
        flex: 1,

    },

    addentrybutton: {
        marginTop: 16,
    },
    
    main_card:{
        backgroundColor:'#fff',
        borderRadius: 14,
        padding: 16,
        height:130,//Adjust while testing
        width: 130,//Adjust while Testing
    },

    Card: {
        borderRadius: 12,
        padding:16,
        gap:12,
    },

    Text_Field:{
        height:48,
        borderColor:'#EBEBEB',
        borderRadius: 8,
    },

    Button: {
        marginTop: 340,
    },

    Pet:{
        marginBottom: 16,
    },

    result: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },

    Chip: {
        backgroundColor: '#167D6B',
        color: 'white',
        borderRadius: 20,
        paddingVertical:8,
        paddingHorizontal: 16,
    },
    
    label_style:{
        fontWeight: '100',
        color: '#808080',
    },

    //Use for under "Recent Entries Cards"
    individual_card:{
        borderColor: '#E5E5E0',
        gap:2,
        borderRadius: 12,
        padding: 14,
        justifyContent: 'space-between',
        alignItems: 'center',
        flexDirection:'row',
        backgroundColor: '#fff',
        borderWidth:1,
        marginTop: 8,
    },

    miniweight_text:{
        color:'#808080',
        fontSize: 12,
    },
    
    //Use to display weigh increase / decrease overtime
    ErrorChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor:'#FDE8E8', //change from red to green (depending on weight)
        borderRadius:12,
    },
    
    Chip_Text:{
        color:'#D64545',
        fontSize:12,
    }
});

