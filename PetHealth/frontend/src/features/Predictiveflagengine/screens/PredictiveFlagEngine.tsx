import { useState, useEffect } from "react";
import {View, Text, StyleSheet,Alert} from "react-native";//React - Native Libraries
import NewAnalysis from "../components/RunNewAnalysisButton";
import MainHeader from "../components/Header";

//Predictive Flagging Engine Props
type PredictiveEngineProps = { 
  onBack: () => void;
  petId: string | null;
}; 

//Main Function - Predictive Flagging Engine 
export default function PredictiveFlaggingEngine({onBack, petId}:PredictiveEngineProps){

    return(
        <View>
            <MainHeader onBack={onBack} title="Predictive Flagging Engine"/>
        </View>
    )
}

const styles = StyleSheet.create({
    //
})