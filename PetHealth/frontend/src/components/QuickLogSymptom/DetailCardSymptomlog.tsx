import React from "react";
import {
    View, Text, StyleSheet, 
} from "react-native";

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


//<MaterialCommunityIcons name="stomach" size={24} color="black" />
//<MaterialCommunityIcons name="lungs" size={24} color="black" />
//<MaterialCommunityIcons name="battery-low" size={24} color="black" />

//Function 1: Date formatter: 

//Function2: Duration text...


//Detailed Card Props
type DetailCardProps = {
    symptom: string;//Heading for Symptom Log Card
    note: string; //caption for symptom details
    loggedAt: string;
    severity: 'mild'|'moderate'|'severe';//health status details (right top pill)
    durationDays: number;//Detail for pet health (bottom left pill)
    category: keyof typeof categoryIcons,//Connect to the ideal Category map
}


//Severity Map: Mild/Moderate/Severe background color to text color
const severityStyles = {
    mild: {bg: '#FFF4CC', text: '#9A6B00'},
    moderate: {bg: '#FFE9D6', text: '#C2570C'},
    severe: {bg: '#FDE2E2', text: '#B42318'},
}

//Category Map - Matchs all backend calls to store inside database...
const categoryIcons = {
    Digestive: 'stomach',
    Skin: 'paw',
    Respiratory:'lungs',
    Mobility: 'battery-low',
    Appetite: 'food-drumstick',
} as const // add comment here... 

export default function DetailCardSymptomLog({symptom, note, severity, loggedAt, category, durationDays}: DetailCardProps){
    return (
        //Display 
    <View style={styles.card}>
        
        <View style={styles.sub_container}>

            <View style={styles.left_group}>

                <View style={styles.icon_tile}>
                    <MaterialCommunityIcons
                        name={categoryIcons[category]}
                        size={18}
                        color='#2F7D5B'
                    >
                    </MaterialCommunityIcons>
                </View>

                <View>
                    <Text style={styles.symptom_heading}>{symptom}</Text>
                    <Text style={styles.text_date}>{loggedAt}</Text>
                </View>

            </View>

                <View style={[styles.pill, {backgroundColor: severityStyles[severity].bg}]}>
                    <Text style={[styles.pill_textstyle, {color:severityStyles[severity].text}]}>{severity}</Text>
                </View>

        </View>
    
                {/*Symptom Log - Notes Section (Pet Owner Notes Section)*/}
                <View style={styles.note_section}>
                    <Text style={styles.text_note}>"{note}"</Text>
                </View>
            

                {/*Footer Style Secton */}
            <View style={styles.footerstyle}>
            <View style={styles.durationgroup}>
                <MaterialCommunityIcons 
                    name="clock-outline"
                    size={14}
                    color="#7A7F7C"
                />
                <Text style={styles.durationLabel}>Duration: </Text>
                <Text style={styles.durationvalue}>{durationDays}</Text> {/*Add days later*/}
            
            <Text style={styles.categoryText}>{category}</Text>


            </View>

        </View>
        
    </View>   
    )
}

const styles = StyleSheet.create({

        //Profile card style 
        profile_card:{
            backgroundColor: 'white',
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
        },

        //duration label 
        durationLabel:{
            fontSize: 12,
            color: '#7A7F7C',
        },

        //Label for Duration
        durationgroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },

        durationvalue:{
            fontSize: 12,
            fontWeight: '700',
            color: '#1F2A24',
        },

        //icon background
        icon_tile:{
            width:36,
            height: 36,
            borderRadius: 10,
            backgroundColor:'#E3F1EA',
            alignItems: 'center',
            justifyContent: 'center',
        },

        //Top Row Style 
        sub_container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },

        //Date & Text Style
        text_date:{
            fontSize: 12,
            color:'#7A7F7C',
        },

        //Icon background Style: 

        pill: {
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
        },

        pill_textstyle:{
            fontSize: 12,
            fontWeight: '600',
        },

        note_section: {
            backgroundColor:'#FAF7F0',
            borderRadius:8,
            padding:10,
            borderWidth: 1,
            borderColor:'#EFEAE0',
        },

        text_note:{
            fontSize:13,
            color:'#5A5448',
        },

        //footer style
        footerstyle:{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTopWidth: 1,
            borderTopColor: '#EDEDE8',            
            paddingTop: 8,
        },

        categoryText:{
            fontSize: 12, 
            fontWeight:'600',
            color:'#2F7D5B',
        },

        //Symptom Log Detail Card
        card: {
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            padding: 12,
            marginBottom: 12,
            gap: 10,
            borderColor: '#E6E8E3',
        },

        //Left Group Row 
        left_group:{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },

        symptom_heading: {
            fontStyle: 'normal',
            fontWeight: '700',
            color:'#1F2A24',
            fontSize:15,
        },

})