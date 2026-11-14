//New Log Weight Screen Form - Pet Owners can record their pet's weight (weight, unit, date, time, notes)
//Screen Flow: Pet Profile -> Weight Tracker -> Log Weight -> save weight -> return to previous screen (view weight dashboard and changes / increase in weight)

//Calendar pop-up and picker design from ScheduleVisitScreen (Team member's work)
//React-native-calendar: publid library for calendar (github.com/wix/react-native-calendars)

//Essential Import for react
import { useState } from "react";
import { Alert } from "react-native";//Import to display clear Alert buttons...
import {View, Text, StyleSheet, TextInput, Pressable, ScrollView, TouchableOpacity, Modal } from "react-native";//React - Native Libraries
import { SaveWeight } from "../../../components/WeightLog/Saveweightbutton";

import { Calendar } from "react-native-calendars"; //Calendar Import
import { Ionicons } from "@expo/vector-icons";//Icons

//Icon's from @expo/vector-icons
import Feather from '@expo/vector-icons/Feather'; 
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import WeightHeader from "../../../components/WeightLog/Weight_header";
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
//getTodayDate Function: retrieve today's NZ LOCAL DATE via "YYY-MM-DD". 
//Default date - calendar with max date
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

//Above Function: build's today's date as text with format (YYYY-MM-DD) from local year, month, day 
//Not toISOString(), that returns UTC date and is 1 day behind NZ morning date


//Calendar Function - Popup calendar
//text directly (not date object) no UTC conversion to shift day
function addYears(dateString: string, years: number) {//Date set as string / Years - numbers
    const [y, m,d] = dateString.split("-").map(Number)//[2026,11,`1]
    const next  = `${y+ years}-${String(m).padStart(2, "0")}-${String(Math.min(d, 28)).padStart(2,"0")}`;//day of month capped at 28, so date like 29 Feb does not become invalid date (only month shown)
    return next > getTodayDate() ? getTodayDate(): next;//Adding date past today is not allowed, weigh-ins must be present or past NOT future!
}

//LogWeight - main screen component 
//Holds form States (weight, unit, date, notes, calendar, time)
//Validatins input and Handle's saving user input
export default function LogWeight({onBack, petId}:WeightProps){
    //State - Form Field
    const [notes, setNotes] = useState('');//State - use for Note Text Input Field
    const [submitted, setSubmitted] = useState(false);//State - use for Button
    const [unit, setUnit] = useState<Unit>('kg');//declaring unit (kg,lb)
    const [weight, setWeight] = useState('');//Weight State
    
    //Date shown as date = chosen day as text (YYY-MM-DD) - start from TODAY
    const [date, setDate] = useState(getTodayDate());//Date State declared 
    const [showCalendar, setShowCalendar] =  useState(false);//calendar popup opens
    const [time, setTime] = useState<Date|null>(null);//Display current time
    const [showTime, setShowTime] = useState(false);//Time
    const [calendarMonth, setCalendarMonth] = useState(getTodayDate);//which month to show in calendar pop-up
    
    //Open pop-up calendar - current chosen date
    const openCalendar = () => {
        setCalendarMonth(date || getTodayDate());
        setShowCalendar(true);
  };


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

            //New Time Variable - for Accurate Weight Updated
            //New Timestap required for the pet's weight entry, same-day weigh-in sorting
            let recordedTime:string;
            if (date=== getTodayDate()){//Today's real accurate time to log pet's weight
                recordedTime = new Date().toISOString();
            }else{
                recordedTime = new Date(`${date}T12:00:00`).toISOString();//Past Date: 12:00 afternoon on the past day
            }

            const weightData = {//Weight Data  - matching backend data stored 
                weightKg: Math.round((unit === 'kg' ? weightNumber: weightNumber * 0.45359237) * 100) / 100,
                recordedAt: recordedTime,
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
                    <Pressable onPress={openCalendar} style={styles.fieldBox}>
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
        
          {/*Calendar Modal - used for pop-up calendar for selecting past and present Date (Future Date's blocked) */}
          <Modal transparent visible={showCalendar} animationType="fade" onRequestClose={() => setShowCalendar(false)}>
                 <View style={styles.modalBackdrop}>
                   <View style={styles.calendarCard}>
                     <View style={styles.yearControls}>
                       <TouchableOpacity style={styles.yearButton} onPress={() => setCalendarMonth((month) => addYears(month, -1))}>
                         <Ionicons name="chevron-back" size={18} color="#00796B" />
                         <Text style={styles.yearButtonText}>Year</Text>
                       </TouchableOpacity>
                       <Text style={styles.modalTitle}>Select Date</Text>
                       <TouchableOpacity style={styles.yearButton} onPress={() => setCalendarMonth((month) => addYears(month, 1))}>
                         <Text style={styles.yearButtonText}>Year</Text>
                         <Ionicons name="chevron-forward" size={18} color="#00796B" />
                       </TouchableOpacity>
                     </View>
                     <Calendar
                       key={calendarMonth}
                       current={calendarMonth}
                       maxDate={getTodayDate()}
                       onMonthChange={(month: {dateString: string}) => setCalendarMonth(month.dateString)}
                       onDayPress={(day: {dateString: string}) => {
                         setDate(day.dateString);
                         setShowCalendar(false);
                       }}
                       markedDates={{
                         ...(date ? { [date]: { selected: true, selectedColor: "#00796B" } } : {}),
                       }}
                     />
                     <TouchableOpacity style={styles.closeButton} onPress={() => setShowCalendar(false)}>
                       <Text style={styles.closeText}>Close</Text>
                     </TouchableOpacity>
                   </View>
                 </View>
               </Modal>
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
        paddingHorizontal: 20,
    },

    //Scroll View - Container Style
    contentContainerstyle:{
       backgroundColor: '#FDFCF9',
        paddingBottom: 20,
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
        paddingTop: 0,
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
        paddingHorizontal: 20,
    },

    //Success Message User Input Style
    Success_Message: {
        marginTop: 10, 
        fontSize: 16, 
        fontWeight: '600'
    },

    //
    Chip: {
        backgroundColor: '#167D6B',
    },

    //Pop-up calendar - backdrop style
    modalBackdrop: {
        alignItems: "center",
        backgroundColor: "rgba(15, 23, 42, 0.35)",
        flex: 1,
        justifyContent: "center",
        padding: 20,
    },

  //Pop-up calendar - Card style
  calendarCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },

  //Pop-up calendar title
   modalTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  //Pop-up calendar - control year button style
  yearControls: {
    alignItems: "center",
    borderBottomColor: "#E5E1DB",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
  },

  //Pop-up calendar - year button
  yearButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    minWidth: 72,
  },

  //Pop-up calendar - year button 'text'
  yearButtonText: {
    color: "#00796B",
    fontSize: 12,
    fontWeight: "800",
  },

  //pop-up calendar - close button style
  closeButton: {
    alignItems: "center",
    borderTopColor: "#E5E1DB",
    borderTopWidth: 1,
    padding: 14,
  },
  
  //Calendar - close text button style
  closeText: {
    color: "#00796B",
    fontSize: 14,
    fontWeight: "800",
  },
    
});

