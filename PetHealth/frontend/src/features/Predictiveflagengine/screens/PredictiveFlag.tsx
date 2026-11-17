import { useState } from "react";
import {View, Text, StyleSheet,Alert, ScrollView} from "react-native";//React - Native Libraries
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Entypo from '@expo/vector-icons/Entypo';
import NewAnalysis from "../components/RunNewAnalysisButton";
import MainHeader from "../components/Header";
import PredictiveFlaggingEngine from "./PredictiveFlagEngine";

//Predictive Flagging Engine Props
type PredictiveFlaggingProps = { 
  onBack: () => void;
  petId: string | null;
}; 


//Intro Screen - Predictive Flagging Engine #1
export default function PredictiveFlagging({onBack, petId}:PredictiveFlaggingProps){
    const insets = useSafeAreaInsets();

    const [showEngine, setShowEngine] = useState(false);

    //Launches the second screen to the analysis engine screen
    const handleRunAnalysis = () => {
        setShowEngine(true);
    };

       if(showEngine){
        return(
            <PredictiveFlaggingEngine
             petId={petId}
             onBack={() => setShowEngine(false)}
            />
        );

    }

    return(
        <View style={styles.container}>
            <MainHeader onBack={onBack} title="Predictive Flagging"/>

            <ScrollView contentContainerStyle={styles.content_style}>
                <View style={styles.card}>
                    <Entypo name="leaf" size={24} color="#90EE90" />
                    <Text style={styles.card_title}>AI-Driven Health Insights</Text>
                    <Text style={styles.card_body}>
                        Our simple pet weight prediction, provides you with an estimated 
                        analysis on your pet's weight. That is only currently available for pets aged 2 years old!.
                    </Text>
                </View>

                 {/*Information card information for Predictive Flagging Engine (How it works:)*/}               
                <View style={styles.card}>
                    <Text style={styles.card_title}>Predictive Flagging Engine:</Text>
                    
                    
                        <View style={styles.flag_style}>
                            {/*Heading for Flag Level: TYPICAL */}
                            <Text style={styles.flag_text}>
                                <Text style={styles.flag_bold_heading}>🟢Typical :</Text>{" "}
                                current pet weight is within the expected pet weight range (Healthy!)
                            </Text>
                        </View>

                        <View style={styles.flag_style}>
                            {/*Heading for Flag Level: WATCH */}
                            <Text style={styles.flag_text}>
                                <Text style={styles.flag_bold_heading}>🟠Watch: </Text> {" "}
                                    under expected weight range or near 10% over maximum (Warning!)        
                            </Text>
                        </View>

                        <View style={styles.flag_style}>
                            {/*Heading for Flag Level: ELEVATED*/}
                            <Text style={styles.flag_text}>
                                <Text style={styles.flag_bold_heading}>🔴Elevated:</Text>{" "}
                                    10% or more outside of expected weight        
                            </Text>
                        </View>

                </View>


            </ScrollView>
        

            {/*Run New Analysis Button*/}
            <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
                    <NewAnalysis onPress={handleRunAnalysis}/>
            </View>
        </View>
    )
}

//Style Sheet
const styles = StyleSheet.create({

    //Aligned rows for flag content
    flag_style:{
        alignItems: 'flex-start',
    },

    //Flag Text 
    flag_text:{
        fontSize: 16,
    },

    //Flag Heading 
    flag_bold_heading:{
        fontWeight: "bold",
        fontSize: 14, 
    },

    //Heading Section Style : 
    heading_section: {
        fontSize: 13,
        fontWeight: "bold",
        color:'#444',
        marginTop: 10,
        marginBottom: 4,
    },

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

    //Card Title
    card_title:{
        fontSize: 20,
        color:"#444",
        marginBottom: 10,
        fontWeight:'bold',
    },

    //Body Card Style
    card_body:{
        fontSize: 15,
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
