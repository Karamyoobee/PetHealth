// ====== IMPORTS ======
import { useState, useEffect, useMemo } from "react";
import {View, Text, StyleSheet, Alert, Dimensions, ScrollView} from "react-native";//React - Native Libraries
import { LineChart as RNLineChart } from 'react-native-chart-kit';
import type { ComponentType } from 'react';
const LineChart = RNLineChart as unknown as ComponentType<any>;//Connection for LineChart used for weight chart (avoid type errors)

import { api } from "../../../api/client";
import { AddNewWeight } from "../../../components/WeightLog/Newweightentry";
import WeightHeader from "../../../components/WeightLog/Weight_header";
import BottomNavBar from "../../HomeScreen/components/TabBar";
import WeightCard from "../../../components/WeightLog/WeightCard";


import { WeightEntry } from "../../../types";

// ==== TYPES AND HELPERS ====

//Unit Type = whic weight the user has toggled on "kg" or "lb"
type Unit = 'kg'|'lb'

//Weight Conversion function 
//Conversion factor (kg -> lb)
const kg_to_lb = 2.20462;//kg to lb converion on toggle button

//Convert kg to chosen unit | rounded by 1 decimal place
const toshow = (kg: number, unit: 'kg' | 'lb') => 
    Math.round((unit === 'lb' ? kg * kg_to_lb : kg)*10) / 10;

//Format date in New Zealand Format (optional year used)
//Turns date string to NZ format e.g "12 oct" - adds year if withYear is true
const Dateformat = (iso: string, withYear = false) =>
    new Date(iso).toLocaleDateString('en-NZ', {//Store based on NZ calendar
        month: 'short',//display month
        day: 'numeric',//day stored - number
        ...(withYear && {year: 'numeric'}),
    });

//Weight Props -> from Parent screen
type WeightDashboardProps = { 
  onBack: () => void;//Return to previous screen
  onLogNew: () => void;//Send User to new Symptom Log Screen
  petId: string | null;//Pet Id - from backend
  onNavigate?: (screen: 'home' | 'pets' | 'assistant' | 'reminders' | 'timeline') => void;
}; 


// - - - - - -  WEIGHT DASHBOARD SCREEN - - - - - 
export default function WeightDashboard({onBack, onLogNew, petId, onNavigate}:WeightDashboardProps){
    
    //States: chosen UNIT and List of Weight Entries
    const [unit, setUnit] = useState<Unit>('kg');   //selected (kg/lb) unit
    const [weightentries, setWeightEntries] = useState<WeightEntry[]>([]);//Store all weight entries for pet

    //Save Button - Store New Weight Entry into backend
    // ===== DISPLAY pet Weight Entries for this pet (newest first) from backend =====
    useEffect(() => { //Fetch pet weight entries
        if (!petId) return;//if Pet Id cannot be found (skip)
        const load = async () =>{
            try{
                const data = await api.listWeights(petId);//Display pet weight's stores inside backend (database)

                //Sort from newest to oldest (for pet weight entries)
                const sorted = [...data].sort((a, b) =>
                new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    );
    setWeightEntries(sorted);//
            }catch(error){//
                console.error(error);
            }
        };
        load();
    },[petId]);


    //display new weight entry (newest entry) [new to old] - used by weight card
    const latest_weight = weightentries[0]

    //Creating Chart Data
    const chartWidth = Dimensions.get('window').width - 80;

    //Create chart labels and values to be used 
    const chartData = useMemo(() =>{
        //filter to display only previous 6 months
        const previoussixMonths = new Date();
        //6 Month's ago only for line chart
          previoussixMonths.setMonth(previoussixMonths.getMonth() - 6);
        
          const points = [...weightentries]
            //filter only by the last 6months of weight records only
            .filter((e) => new Date(e.recordedAt) >= previoussixMonths)
            //Sort from oldest first showing on chart to newest
            .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

        //provide space to labels 
        const step = Math.ceil(points.length / 5) || 1; // display all 5 date labels
            return{
                //label every nth point, otherwise else remain blank
        labels: points.map((e, i) => (i % step === 0 ? Dateformat(e.recordedAt): " ")),
        values: points.map((e) => toshow(e.weightKg, unit)), //Weight's to be shown in selected unit (kg/lb)

    };
},[weightentries, unit]);//re-calculate on data/unit change

    return(
        //Main container for "Weight Dashboard Screen"
        <View style={styles.container}>
            
            {/*Header for Weight Dashboard Screen*/}
            <WeightHeader onBack={onBack} label="Weight Tracker"/>
        
        {/*Scrollable View for Weight Entries */}
        <ScrollView contentContainerStyle={styles.scrollContent}>

            {/*Weight Chart (simple)*/}
            <WeightCard
                //Display Current Weight and unit toggle (kg/lb)
                current_Weight={latest_weight ? toshow(latest_weight.weightKg, unit):0}
                //Latest previous entry or 
                last_Weighted_Date={latest_weight ? Dateformat(latest_weight.recordedAt, true): 'No Entries added yet!'}
                
                unit={unit} //kg or lb - selected unit by pet owner
                onUnitChange={setUnit}//Updated on toggle for either kg or lb
            />

            {/*6 Month Weight Line Chart*/}
            <View style={styles.Weight_log_Chart}>
                {/*Title For Line Chart */}
                <Text style={styles.section_title}>6 Month Trend</Text>
                {chartData.values.length >= 2? (//require 2 weight logs maximum - to show weight dashboard
                    <LineChart
                    data={{
                        labels:chartData.labels,
                        datasets: [{data: chartData.values}],
                    }}
                    width={chartWidth}  // Screen minus padding (to show good size of Chart Width)
                    height={200}    //Fixed height for chart height
                    yAxisSuffix={unit} //show kg/lb on y-axis only
                    bezier //curve made smooth
                    withInnerLines={false}//
                    chartConfig={{//Colors and decimals set for Chart Style
                        backgroundGradientFrom: '#fff',
                        backgroundGradientTo: '#fff',
                        decimalPlaces: 1,
                        color:() => '#167D6B',
                        labelColor: () => "#808080",
                    }}//Card Sizing for Weight Chart
                    style={{marginTop: 12, marginLeft: -16}}
                    />    
                ): ( //Important Message for user
                    <Text style={styles.miniweight_text}>
                        You must log at least 2 weigh-in to see your overall weight log trend.
                    </Text>
                )}
            </View>
            
            {/*Log Weight Entry Button - Allow user's to create new weight*/}
            <View style={styles.addentrybutton}>
                <AddNewWeight label="+ Log New Weight Entry" onPress={onLogNew}
                />
            </View>

            {/*Recent Entries*/}
            <Text style={styles.Recent_weight}>Recent Entries</Text>
                {weightentries.slice(0,4).map((entry, index) => {//display the previous of 4 entries

        //previous weight entry 
        const previous = weightentries[index + 1];//List new weigh entries first (next weight entry is old)
        const diff = previous ? entry.weightKg - previous.weightKg: null;//Difference of weight change vs old weight entry
        const increaseweight = diff !== null && diff > 0;//Increase Weight (only if weight increases)
        const decreaseweight = diff !== null && diff < 0;//Weight Descrease (only if weight decreases)
    
                return(
            //Individual Weight Entry Card
            <View key={entry.id} style={styles.individual_card}>

                

                <View>{/*Display Weight and Date */}
                    <Text style={styles.Recent_weight}>{toshow(entry.weightKg, unit)}{unit}</Text>
                    <Text style={styles.miniweight_text}>{Dateformat(entry.recordedAt)}</Text>
                </View>

                {/*Display Chip - only if weight entry has changed (increase or decreased)  */}
                {diff !== null && diff !== 0 && (
                <View style={[styles.ErrorChip, decreaseweight && {backgroundColor: '#E3F4EF'}]}>
                    <Text style={[styles.Chip_Text, decreaseweight && {color: '#167D6B'}]}>
                      {increaseweight ? '+': '-'}{toshow(Math.abs(diff), unit)}{unit} from previous weight entry  {/*Show size of change without sign*/}
                    </Text> 
                </View>
                )}
                </View>
                );
                //1. First Style: Green for Pet Weight Loss 
                //2. Secont Style: Red for Pet Weight gain 
                //+ or - sign (representing weight increase or decrease difference for pet weight)
            })}

            </ScrollView>


            {/*Navigation Tab Bar*/}
            <BottomNavBar
                onHomePress={() => onNavigate?.('home')}//Home Screen
                onPetsPress={() => onNavigate?.('pets')}//My Pets Screen
                onActionPress={() => onNavigate?.('assistant')}//AI Health Assistant 
                onTimelinePress={() => onNavigate?.('timeline')}//Timeline Screen
                onAlertsPress={() => onNavigate?.('reminders')}//Reminders Screen
            />
        </View>

    );

}

//Styles Sheet 
const styles = StyleSheet.create({

    //Scroll View Style
    scrollContent:{
        padding: 20,
    },

    //Recent Weight Title Style 
    Recent_weight:{
        fontSize: 18,
        color:'#000',
        fontWeight: '500',
        marginTop: 16,
    },

    //Chart Placeholder Style - to be completed...
    Weight_log_Chart: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5E0',
        padding: 16,//adjust later (once completed full chart)
        marginTop: 16,
        backgroundColor: '#fff'
    },

    //Chart Title (sectoin)
    section_title: {
        fontSize: 18,
        fontWeight: '600',
        color:'#000',
    },

    container: {
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
