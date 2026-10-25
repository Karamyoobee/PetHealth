import react from "react";
import {
    View, Image, Text, Pressable, StyleSheet, 
} from "react-native";

type DetailCardProps = {
    onBack: () => void;
    icon: React.ReactNode;//Element - Icon representing Pet's health status
    value: string;//Heading for Symptom Log Card
    label: string; //caption for symptom details
    duration: string;//caption for duration detail
    Date: string;
    health_status: string;//health status details (right top pill)
    health_detail: string;//Detail for pet health (bottom left pill)
}

//Functoin for health Status Labels
//Moderate - Orange
//Mild - Yellow 

export default function DetailCardSymptomLog({ onBack, icon, value, label, duration, health_status, Date }: DetailCardProps){
    return (
        //Display 
    <View style={styles.card}>
        
        {/*Icon for Log*/}
        {icon}
        {/*Display Pet Health Status*/}
        <Text style={styles.symptom_heading}>{value}</Text>
        
        {/*Display Pet Health Details*/}
        <Text style={styles.label}>{label}</Text>

        {/**/}        
     </View>   
    )
}

const styles = StyleSheet.create({

        

        card: {
            flex: 1,
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: 15,
            paddingVertical: 5,
        },

        icon: {
            backgroundColor: 'lightgreen',
        },

        symptom_heading: {
            textAlign: 'center',
            fontStyle: 'normal',
            fontWeight: '700',
            color:'light gray',
        },

        label: {
            fontSize: 16,
            color: 'grey'
        },

        Duration: {
            fontStyle: 'normal',
            color:'grey',

        }
})