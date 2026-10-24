import { useState } from "react";
import {View, Text, StyleSheet, TextInput, Pressable } from "react-native";//React - Native Libraries
import { SaveWeight } from "../../../components/WeightLog/Saveweightbutton";
import Feather from '@expo/vector-icons/Feather';//Calendar Icon Import 
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import WeightHeader from "../../../components/WeightLog/Weight_header";

//<Feather name="calendar" size={24} color="black" /> = use for after

//<AntDesign name="clock-circle" size={24} color="black" /> use later on

//<MaterialIcons name="notes" size={24} color="black" /> - Notes Icon

type Unit = 'kg' | 'lb'

//Weight Props
type WeightProps = { 
  onBack: () => void;
}; 

//Function - Log Weight
export default function LogWeight({onBack}:WeightProps){
    const [notes, setNotes] = useState('');//State - use for Note Text Input Field
    const [submitted, setSubmitted] = useState(false);//State - use for Button
    const [unit, setUnit] = useState<Unit>('kg');//declaring unit (kg,lb)
    const [weight, setWeight] = useState('');//Weight State
    
    //Save Button - Store New Weight Entry into database (to be connected)
    const handleSave = () => {
        //Add API call / local storage save
        setSubmitted(true);
    };

    return(
        <View style={styles.container}>

            {/*Header for New Weight Form Screen */}
            <WeightHeader onBack={onBack} label="Log Weight"/>
        
            <View style={styles.content_style}>
{/* Weight Text Input Field*/}

            <View style={styles.Weight_InputStyle}>
                <TextInput style={styles.Weight_TextInput}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="0.0"
                    placeholderTextColor='#B5C5C0'
                    keyboardType="decimal-pad"
                />
    
            </View>

            {/*Toggle Button (KG/LB) for Text Input - Weight*/}
            <View style={styles.weight_toggle}>
                    <Pressable style={[styles.main_togglebutton, unit == 'kg' && styles.Chip]} onPress={() => setUnit('kg')}>
                        <Text style={unit == 'kg' ? styles.toggle_buttontext_active: styles.toggle_buttontext_inactive}>KG</Text>
                    </Pressable>

                    <Pressable style={[styles.main_togglebutton,unit == 'lb' && styles.Chip]} onPress={() => setUnit('lb')}>
                        <Text style={unit == 'lb' ? styles.toggle_buttontext_active: styles.toggle_buttontext_inactive}>LB</Text>
                    </Pressable>
            </View>

            {/*Add Calendar Import here*/}
            


            {/*Notes - Tex Input */}

                {/*Weigh-in Entry Field*/}
              <View style={styles.Button}>
                    <SaveWeight label="Save Entry" onPress={handleSave}/>
                    {submitted && <Text style={styles.result}>Entry Saved!</Text>}

              </View>

            </View>
            
        </View>
    );
}

//Styles Sheet 
const styles = StyleSheet.create({
   
    content_style:{
        flex: 1,
        padding: 20,
    },

    //Weight Log - Toggle Chip (tracking switching button)
    weight_toggle:{
        flexDirection:'row',
        backgroundColor: '#D5E8E3',
        borderRadius: 16,
        padding: 4,
        alignSelf: 'center',
        marginTop: 12,
    },

    main_togglebutton:{
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16
    },

    //Weight toggle Button - Text (active Chip)
    toggle_buttontext_active:{
        color: 'white',
        fontWeight: '600',
    },

    //Weight Toggle Button - Text (inactive Chip)
    toggle_buttontext_inactive:{
        color:'#4A6B64',
        fontWeight: '600',
    },

    //Weight Input (Section Style)
    Weight_InputStyle:{
        alignItems: 'center'
    },

    //Weight Input Placeholder Section
    Weight_TextInput:{
        fontSize: 44, 
        textAlign: 'center',
        width: 200, 
        borderWidth: 1, 
        borderColor: '#167D6B',
        marginTop: 20,
        padding: 10,
    },
    
    //Main Container Style
    container: {
        flex: 1,
        backgroundColor: '#FDFCF9',
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
    },
    
    label_style:{
        fontWeight: '100',
        color: '#808080',
    }
});

