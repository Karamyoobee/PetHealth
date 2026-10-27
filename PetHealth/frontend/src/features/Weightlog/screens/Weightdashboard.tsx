import { useState, useEffect } from "react";
import {View, Text, StyleSheet,Alert} from "react-native";//React - Native Libraries
import { SaveWeight } from "../../../components/WeightLog/Saveweightbutton";
import Feather from '@expo/vector-icons/Feather';//Calendar Icon Import 
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { api } from "../../../api/client";
import { AddNewWeight } from "../../../components/WeightLog/Newweightentry";
import WeightHeader from "../../../components/WeightLog/Weight_header";
import BottomNavBar from "../../HomeScreen/components/TabBar";
import WeightCard from "../../../components/WeightLog/WeightCard";


import { WeightEntry } from "../../../types";

type Unit = 'kg'|'lb'

//Weight Conversion function 
const kg_to_lb = 2.20462;//kg to lb converion on toggle button

const toshow = (kg: number, unit: 'kg' | 'lb') => 
    Math.round((unit === 'lb' ? kg * kg_to_lb : kg)*10) / 10;

//Format Date (helper)
const Dateformat = (iso: string, withYear = false) =>
    new Date(iso).toLocaleDateString('en-NZ', {
        month: 'short',
        day: 'numeric',
        ...(withYear && {year: 'numeric'}),
    });

//Weight Props
type WeightDashboardProps = { 
  onBack: () => void;
  onLogNew: () => void;
  petId: string | null;
}; 

//Function - Log Weight
export default function WeightDashboard({onBack, onLogNew, petId}:WeightDashboardProps){
    const [unit, setUnit] = useState<Unit>('kg');
    const [weightentries, setWeightEntries] = useState<WeightEntry[]>([]);



    //Save Button - Store New Weight Entry into backend
    useEffect(() => {
        if (!petId) return;
        const load = async () =>{
            try{
                const data = await api.listWeights(petId);
                
                const sorted = [...data].sort((a, b) =>
                new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    setWeightEntries(sorted);//
            }catch(error){
                console.error(error);
            }
        };
        load();
    },[petId]);


    //delcare weight entry conversion
    const latest_weight = weightentries[0]



    return(
        
        <View style={styles.container}>
            
            {/*Header*/}
            <WeightHeader onBack={onBack} label="Weight Tracker"/>

            {/*Weight Chart (simple)*/}
            <WeightCard
                current_Weight={latest_weight ? toshow(latest_weight.weightKg, unit):0}
                last_Weighted_Date={latest_weight ? Dateformat(latest_weight.recordedAt, true): 'No Entries added yet!'}
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
                {weightentries.slice(0,4).map((entry, index) => {

        //previous weight entry 
        const previous = weightentries[index + 1];
        const diff = previous ? entry.weightKg - previous.weightKg: null;//Difference of Weight Enrty
        const increaseweight = diff !== null && diff > 0;//Increase Weight
        const decreaseweight = diff !== null && diff < 0;//Weight Descrease
    
                return(
                    
            <View key={entry.id} style={styles.individual_card}>

                

                <View>
                    <Text style={styles.Recent_weight}>{toshow(entry.weightKg, unit)}{unit}</Text>
                    <Text style={styles.miniweight_text}>{Dateformat(entry.recordedAt)}</Text>
                </View>

                {diff !== null && diff !== 0 && (
                <View style={[styles.ErrorChip, decreaseweight && {backgroundColor: '#E3F4EF'}]}>
                    <Text style={[styles.Chip_Text, decreaseweight && {color: '#167D6B'}]}>
                      {increaseweight ? '+': '-'}{toshow(Math.abs(diff), unit)}{unit} from previous weight entry  
                    </Text>
                </View>
                )}
                </View>
                );
            })}

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
