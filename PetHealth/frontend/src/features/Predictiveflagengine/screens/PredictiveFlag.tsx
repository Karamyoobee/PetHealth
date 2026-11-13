import { useState, useEffect } from "react";
import {View, Text, StyleSheet,Alert, ScrollView, TouchableOpacity} from "react-native";//React - Native Libraries
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
                    {/*Add Icon - leaf! */}
                    <Text style={styles.card_title}>AI-Driven Health Insights</Text>
                    <Text style={styles.card_body}>
                        Our advanced predictive models analyze your pet's historical data, 
                        however our analysis is only limited to predicting the health analysis of 
                        these 6 selective breeds: 
                        Dog Breed
                        1. Labrador Retriever 
                        2. Huntaway
                        3. Golden Retriever
                        
                        Cat Breed
                        1. British Shorthair 
                        2. Domestic Shorthair
                        3. Ragdoll
                    </Text>
                </View>
                
                {/*Information card for Predictive Flagging Engine Analysis*/}
                <View style={styles.card}>
                    <Text style={styles.card_title}>Weight Tracking - 6 Animal Breeds only!</Text>
                    <Text style={styles.card_body}>
                        Real-time analysis - only for weight tracking though!   
                        limited to only 6 breeds (3 dogs | 3 cats) 
                    </Text>
                </View>

                 {/*Information card information for Predictive Flagging Engine (How it works:)*/}               
                <View style={styles.card}>
                    <Text style={styles.card_title}>Predictive Flagging Engine: Information</Text>
                    <Text style={styles.card_body}>
                        <View style={styles.flag_style}>
                            {/*Heading for Flag Level */}
                            <Text style={styles.flag_bold_heading} >
                                    🟢  Typical :
                                <Text style={styles.flag_text}>
                                    less than 5% (Healthy - normal range)
                                </Text>
                            </Text>
                        </View>
                       
                       <View style={styles.flag_style}>
                                <Text style={styles.flag_bold_heading} >
                                    🟠  Watch:  
                                 </Text>
                                 <Text style={styles.flag_text}>
                                    5% - 10% outside of expected weight (Warning!)
                                 </Text>
                       </View>

                        
                        <View style={styles.flag_style}>
                                <Text style={styles.flag_bold_heading} >
                                    🔴  Elevated: 
                                </Text>
                                <Text style={styles.flag_text}>
                                    10% or more outside of expected weight range 
                                </Text>
                       </View>


                    <View style={styles.viewstyle}>

                    </View>
                        🐶 Labrador - Female: 25-32kg | Male: 29-36kg
                        🐶 Huntaway: Female: 25-35kg | Male: 30-40kg 
                        🐶 Golden Retriever: Female: 25-29.5kg | Male: 29.5 - 34 kg


                        🐱 British Shorthair - Female: 3.2 - 5.4 kg |   Male: 4.1 - 7.7 kg
                        🐱 Domestic Shorthair - Female: 2.5 - 5.5kg | Male: 3.5 - 5.5 kg
                        🐱 Ragdoll - Female: 2.6 - 6.8 kg | Male: 5.4 - 9.1 kg

                    </Text>
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

    //flag_levels style
    flag_style:{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    flag_text:{
        fontSize: 14,
    },

    flag_bold_heading:{
        fontWeight: "bold",
        fontSize: 14, 
    },

    //Breed Divider style 
    viewstyle: {
        height: 1,
        borderColor: "#E8E4DC",
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