import { useState, useEffect } from "react";
import {View, Text, StyleSheet,Alert, ScrollView} from "react-native";//React - Native Libraries
import NewAnalysis from "../components/RunNewAnalysisButton";
import MainHeader from "../components/Header";
import PredictiveFlaggingEngine from "./PredictiveFlagEngine";

//Predictive Flagging Engine Props
type PredictiveFlaggProps = { 
  onBack: () => void;
  petId: string | null;
}; 


//Main Function - Predictive Flagging Engine 
export default function PredictiveFlagging({onBack, petId}:PredictiveFlaggProps){

    const [showEngine, setShowEngine] = useState(false);

    //Placeholder for Template of Predictive Flagging Engine First Screen.
    const handleRunAnalysis = () =>{
       if(showEngine){
        return(
            <PredictiveFlagging
             petId={petId}
             onBack={() => setShowEngine(false)}
            />
        )
       }
    }

    return(
        <View style={styles.container}>
            <MainHeader onBack={onBack} title="Predictive Flagging"/>

            <ScrollView contentContainerStyle={styles.content_style}>
                <View style={styles.card}>
                    <Text style={styles.card_title}></Text>
                    <Text style={styles.card_body}></Text>
                </View>
            </ScrollView>
        

            {/*Run New Analysis Button*/}
            <View style={styles.footer}>
                    <NewAnalysis onPress={handleRunAnalysis}/>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    //Run New Analysis Button
    Button: {
        marginTop: 20,
    },

    // Main Container View
    container: {
        flex: 1,
        backgroundColor: '#F9F7F3',
    },

    //Card 
    card:{
        backgroundColor:'#fff',
        borderRadius:12,
        borderWidth:1,
        borderColor:'#E8E4DC',
        padding: 16,
        marginBottom: 10
    },

    //Title
    card_title:{
        fontSize: 13,
        color:"#444",
        marginBottom: 10,
    },

    //Body Card Style
    card_body:{
        fontSize: 13,
        lineHeight: 19,
        color:'#555',
    },

    //Footer Style
    footer:{
        padding:16,
        borderTopWidth: 1,
        borderColor:'#E8E4DC',
    },

    //Scrollview content style
    content_style:{
        padding: 16,
    },
})