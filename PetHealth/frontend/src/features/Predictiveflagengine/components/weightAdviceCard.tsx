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
    //Level name from predictive flagging engine used here: (1.Typical, 2. Watch, 3, Elevated)
    //Spelling is crucial in order to match engine.js content exactly
    const info = WeightAdvice[level];

    //if info is not valid; return null
    if (!info) 
        return null;

    //Layout of Main Card: heading, kg difference, advice, disclaimer. 
    //1. only 1 card shown for the specific pet
    return(
        <View style={[styles.card, {borderColor:info.color}]}>
            {/*Heading: Display short message about level*/}
            <Text style={[styles.heading, {color: info.color}]}>
                {info.level}
            </Text>

            {/*Difference text: from Engine screen e.g "2.3 kg over the weight range" */}
            <Text style={styles.difference_style}>
                {differenceText}
            </Text>

            {/*Advice for Pet Owners - steps are in fixed order*/}
            {info.advice.map((step, index)=>(
                <Text key={index} style={styles.advice}>
                    {index+1}.{step}
                </Text>
            ))}

            {/*Disclaimer Text only!*/}
            <Text style={styles.disclaimer}>
                This is only general advice,
                seek professional veterinary for accurate health advice.
            </Text>
        </View>
    )

}

//Main Style Sheet
const styles=StyleSheet.create({
    
    //Main Card Style
    card:{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 2,
        padding: 16,
        marginTop: 12,
    },

    //Heading for Card
    heading:{
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
    },

    //Difference Text Style
    difference_style:{
        fontSize: 14,
        marginBottom: 8,
    },
    
    //Advice Text Style
    advice:{
        fontSize: 13, 
        color: "#555",
        marginBottom: 4,
    },

    //Disclaimer Text Style
    disclaimer:{
        fontSize: 11,
        color:'#888',
        marginTop: 10,
    },
})