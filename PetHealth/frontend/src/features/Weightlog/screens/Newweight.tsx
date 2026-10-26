//New Log Weight Screen Form - Pet Owners can record their pet's weight (weight, unit, date, time, notes)

//Essential Import for react
import { useState } from "react";
import { Alert } from "react-native";//Import to display clear Alert buttons...
import {View, Text, StyleSheet, TextInput, Pressable, ScrollView } from "react-native";//React - Native Libraries
import { SaveWeight } from "../../../components/WeightLog/Saveweightbutton";

//Icon's from @expo/vector-icons
import Feather from '@expo/vector-icons/Feather'; 
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import WeightHeader from "../../../components/WeightLog/Weight_header";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import Weightformfield from "../../../components/WeightLog/Newweightform";

import WeightEntry from "../../../components/WeightLog/weightentry";
import { api } from "../../../api/client";

//Types: Unit
type Unit = 'kg' | 'lb'

//Weight Props
type WeightProps = { 
  onBack: () => void;//return to preivous screen (main - PetProfile screen)
  petId: string |null;//Declare pet id
}; 

//Main Function [local date returned] (display current date (to be fixed on full calendar display!))
function getTodayDate() {
    const now = new Date();//Collect real date
    const year = now.getFullYear();//Collect Real Year
    const month = now.getMonth() + 1;//Current Month
    const day = now.getDate();//Full Date (day)
    const monthText = String(month).padStart(2, '0');
    const dayText = String(day).padStart(2, '0');

    return(
       `${year}-${monthText}-${dayText}`
    )
}

//Function - Log Weight
export default function LogWeight({onBack, petId}:WeightProps){
    //State - Form Field
    const [notes, setNotes] = useState('');//State - use for Note Text Input Field
    const [submitted, setSubmitted] = useState(false);//State - use for Button
    const [unit, setUnit] = useState<Unit>('kg');//declaring unit (kg,lb)
    const [weight, setWeight] = useState('');//Weight State
    
    const [date, setDate] = useState(getTodayDate());//Date State declared 
    const [showCalendar, setShowCalendar] =  useState(false);//Calendar State
    const [time, setTime] = useState<Date|null>(null);//Display current time
    const [showTime, setShowTime] = useState(false);//Time


    //State - Save Pet Weight 
    const [savingweight, setSavingWeight] = useState(false);

    //Save Weight Entry (Button Connection) - validtes user input & send's to backend (api.createWeight) - database 
    const handleSave =  async () => {
        //Avoiding duplicate save requests (made by user to save weight of pet)
        if (savingweight) return;

            //Check Pet Profile Id
            if (!petId) {
                Alert.alert('No pet selected', 'Please open from a pet profile only!')
                return;
            }

        //Text Weigh - convert to number (accepts numbers and commas) e.g 11,5
        const weightNumber = parseFloat(weight.replace(',','.'));
        if(!Number.isFinite(weightNumber) || weightNumber <= 0){//Convert user inputed weight to a number
            Alert.alert('Check the weight', 'Please, enter a valid weight entry:');//Error Message
            return;
        }

        try{//Save entered weight - prepare data and send it to backend
            setSavingWeight(true)
            console.log('petId being used is: ', petId)

            const weightData = {//Weight Data  - matching backend data stored 
                weightKg: Math.round((unit === 'kg' ? weightNumber: weightNumber * 0.45359237) * 100) / 100,
                recordedAt: new Date(`${date}T12:00:00`).toISOString(),
                notes: notes.trim(),
            };
            //Send Saved Weight data to backend API and mongodb database
            console.log("Date for Weight has been sent to database: ", JSON.stringify(weightData));
            const savedWeight = await api.createWeight(petId, weightData);

            console.log("Weight has been returned by backend", savedWeight);
            
            Alert.alert('Saved', 'Weight entry saved!', [{ text: 'OK', onPress: onBack}]);

            setSubmitted(true);//handl errors - inform user if saved fails
        } catch(error){
            console.error(error);
            Alert.alert('Weight was unable to be saved.', 'Please, try again!');
        }finally{
            setSavingWeight(false);
        }//Always reset on new saving state
    
    };

    return(
        //Scrollable Form - including Header & Save Button
        <ScrollView contentContainerStyle={styles.contentContainerstyle}>
        <View style={styles.container}>

            {/*Header for New Weight Form Screen */}
            <WeightHeader onBack={onBack} label="Log Weight"/>
        
            <View style={styles.content_style}>
            {/*Section 1: Weight Input */}
            <View style={styles.Weight_InputStyle}>
                <TextInput style={styles.Weight_TextInput}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="0.0"
                    placeholderTextColor='#B5C5C0'
                    keyboardType="decimal-pad"
                />
    
            </View>

            {/*Section 2: Toggle Button (KG/LB) for Text Input - Weight*/}
            <View style={styles.weight_toggle}>
                    <Pressable style={[styles.main_togglebutton, unit == 'kg' && styles.Chip]} onPress={() => setUnit('kg')}>
                        <Text style={unit == 'kg' ? styles.toggle_buttontext_active: styles.toggle_buttontext_inactive}>KG</Text>
                    </Pressable>

                    <Pressable style={[styles.main_togglebutton,unit == 'lb' && styles.Chip]} onPress={() => setUnit('lb')}>
                        <Text style={unit == 'lb' ? styles.toggle_buttontext_active: styles.toggle_buttontext_inactive}>LB</Text>
                    </Pressable>
            </View>

            {/*Section 3: Date | Time | Notes Field Input Form */}
            <View style={styles.UserInputField}>
                {/*Date Field - User Input*/}
                <Weightformfield
                    icon = {<Feather name="calendar" size={16} color="#4A6B64" />}
                    label={"Date"}>
                    <Pressable style={styles.fieldBox}>
                            <Text style={styles.Textfield}>{date}</Text>
                    </Pressable>
                </Weightformfield>

                {/*Time Field - User Input*/}
                <Weightformfield
                    icon = {<AntDesign name="clockcircle" size={16} color="#4A6B64" />}
                    label={"Time (Optional)"}>
                        <Pressable style={styles.fieldBox}>
                            <Text style={styles.placholederTextStyle}>--:-- --</Text>
                        </Pressable>
                </Weightformfield>

                {/*Notes Text Field - User Input*/}
                <Weightformfield
                    icon = {<MaterialIcons name="notes" size={16} color="#4A6B64" /> }
                    label={"Notes"}>
                    <TextInput
                        multiline
                        maxLength={250}
                        placeholder="Add details about your weigh-in (e.g time of day, feeling)"
                        style={styles.NoteInputField}
                        value={notes}
                        onChangeText={setNotes}
                    >
                    </TextInput>
                </Weightformfield>

            </View>

            </View>
        
        {/*Section 4: Save Weight Entry Button and Success Message*/}
         <View style={styles.Button}>
                    <SaveWeight icon  = {<AntDesign name="checkcircle" size={20} color="white" />} label="Save Entry" onPress={handleSave}/>
                    {submitted && <Text style={styles.Success_Message}>Entry Saved!</Text>}

         </View>
    </View>
    </ScrollView>


    );
}

//Styles Sheet 
const styles = StyleSheet.create({
   
    //Date Text Field Style 
    Textfield:{
        fontSize: 16,
        color:'#1F2D2A',
    },

    //Weight Form Components - User Input Field (container)
    fieldBox:{
        minHeight: 48,
        borderRadius: 8,
        paddingHorizontal:12,
        borderWidth: 1,
        borderColor:'#EBEBEB',
        justifyContent :'center',
    },

    //Time Style
    placholederTextStyle:{
        fontSize:16,
        color:'#B5C5C0',
    },

    //Notes Input Field Style
    NoteInputField:{
        minHeight:100,
        borderColor:'#EBEBEB',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#1F2D2A',
        textAlignVertical: 'top',
        borderWidth:1,
    },

    //Container Style - Main User Input Field 
    UserInputField:{
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EBEBEB',
        padding: 16,
        gap: 14,
        marginTop: 20,
    },

    //Main Layout style for Container - wrapping all form field and user input sections
    content_style:{
        flex: 1,
    },

    //Scroll View - Container Style
    contentContainerstyle:{
        padding: 20,
        backgroundColor: '#FDFCF9',
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

    //Toggle Button 
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

    //Detail Card Style
    Card: {
        borderRadius: 12,
        padding:16,
        gap:12,
    },

    //Save Weight Button - Container
    Button: {
        marginTop: 100,
    },

    //Success Message User Input Style
    Success_Message: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },

    Chip: {
        backgroundColor: '#167D6B',
    },
    
});

