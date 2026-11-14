import {View, Text, StyleSheet} from "react-native";

//
 type WeightAdviceProps={
    level: string;
    differenceText: string;
};


const WeightAdvice: Record<string, {level: string; advice: string[]; color:string;}>={
    //Typical - Pet's Weight is in expected weight range
    Typical:{
        level:"Pet's Weight is on Track!",
        advice:["Continue with the exact present diet and exercise routine",
            "Regularly check your pet's weight and record it inside the app!"
        ],
        color:"#2E7D6B",
    },

    //Watch - Warning Pet owner of their pet's weight
    Watch:{
        level:"Your pet’s weight is slightly outside the expected range",
        advice:["Monitor food portion and amount of treats per day. ",
            "Maintain balanced daily exercise routine"
        ],
        color:"#FF9F00",
    },

    //Elevated - Exceeded Weight Range
    Elevated:{
        level:"Your pet’s weight is well outside the expected range.",
        advice:["Visit a veterinary as soon as possible, can cause health concern",
            "Note any other changes, such as appetite, energy or drinking"
        ],
        color:"#D32F2F",
    }
}

//Pet Weight Advice Function
export default function WeightAdviceCard({level, differenceText}:WeightAdviceProps){
    //Variable to store weight advice by level
    const info = WeightAdvice[level];

    //if info is not valid; return null
    if (!info) 
        return null;



}
