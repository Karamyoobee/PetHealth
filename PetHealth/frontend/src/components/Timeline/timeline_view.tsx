import React from "react";
import {useState, useEffect} from "react";
import MainHeader from "./header";
import {View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomNavBar from "../../features/HomeScreen/components/TabBar";
import { api } from "../../api/client";
import { Pet } from "../../types";

//Type of Card shown on timeline screen : logged = weight, visit = vet visits, rx = medications, note = symptom logs, reminder = reminders
type EntryType = 'logged' | 'visit' | 'rx' | 'note' | 'reminder';

//Card Colors - for each 5 main cards with their own color 
const TYPE_COLORS: Record<EntryType, {stripe: string, pillBg: string, pilltext: string}> = {
    logged:{stripe:'#1F6F5C', pillBg: '#DDEFE8', pilltext: '#1F6F5C'},
    visit: {stripe:'#E8A15A', pillBg: '#FCE8D2', pilltext: '#B5651D'},
    rx: {stripe:'#1F6F5C', pillBg: '#E1E8E4', pilltext: '#4A6258'},
    note: {stripe:'#E8A15A', pillBg: '#FBDDE0', pilltext: '#B42318'},
    reminder: {stripe:'#238575', pillBg: '#D6EEF0', pilltext: '#00796B'},
};

//Type of Card Labels - to seperate each card (5)
const TYPE_LABELS: Record<EntryType, string> = {
    logged: 'LOGGED', visit: 'VISIT', rx: 'RX', note: 'NOTE', reminder:'REMINDER',
};  //Weight Logs   - Vet Visits   - Medications - Symptom Logs - Reminders


//Data types for Timeline Screen Entry
type TimelineEntry = {
    id: string;
    date: string;
    sortKey: number;
    type: EntryType;
    title: string;
    subtitle: string;
    pet: string; //display pet name
    petId: string //chip filter - for pets
};

//Component Props Type
type TimelineProps = {
    onBack: () => void;//return to previous screen
    onHomePress: () => void;
    onPetsPress: () => void;
    onNavigate?: (screen: "home" | "pets" | "assistant" | "timeline" | "reminders") => void;//Main Navigation Bar - connect to other screens
};

//Function 1: Sort By Date / Month for Timeline View 
function toSortKey(raw?: string | null): number{
    const time = raw ? new Date(raw).getTime() : NaN;

    return Number.isNaN(time) ? 0 : time;
}

//Function 2: Display Date for Cards: 
function toDisplayDate(raw? : string | null): string{
    //1. No Date provided at all - missing or empty
    if (!raw) return 'No Date!';

    //Create Date object from text
    const date = new Date(raw);

    //if Text does not have a valid date: An Invalid Date's getTime() is NaN.
    if (Number.isNaN(date.getTime())) return 'No date';

    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

//Main Reusable Components - for Timeline Screen with parameters (from Type TimelineProps)
export default function Timeline({onBack, onHomePress, onPetsPress, onNavigate}: TimelineProps){
    const insets = useSafeAreaInsets();
    
    //Use State 
    //when a chip is selected: e.g 'all' set as default for User
    const [selectedPetId, setSelectedPetId] = useState<string>('all');
    
    //Load Pet's only fron backend, empty until API is connected and retrieves information
    const [pets, setPets] = useState<{id: string; name: string}[]>([]);

    //Chip List: 'All', 'other chips' represeting pets added
    const chips = [{ id: 'all', name: 'All'}, ...pets]

    const [entries, setEntries ] = useState<TimelineEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    //Run only 1 time, only when timeline screen opens and (empty [] dependency arrat)
    async function LoadTimeline(){
        setLoading(true);
        setError('');

        try{
            //Fetch all current user's pet's list
            const result = await api.listCurrentUserPets();
             //only keep pet id and name 
                setPets(result.map(p => ({id: p.id, name: p.name})))

                //Display all pets load at 1 time
            const perPet = await Promise.all(result.map(async (p) => {

            //2 pet lists to load at the same time 
            //Fetch all 5 lists for 1 pet (when being selected)
            const [weights, symptoms, medicine, vetvisit, reminders] = await Promise.all([
                api.listWeights(p.id),//Fetch Weight List
                api.listSymptoms(p.id), //Fetch Symptom Logs 
                api.listMedications(p.id).catch(() =>[]),//Fetch Medications stored
                api.listVetVisits(p.id).catch(() =>[]),//Fetch Vet Visits
                api.listReminders(p.id).catch(() =>[]),//Fetch Reminders
            ]);

            //Shared details for every entry that belongs to the pet
            const base = {pet: p.name, petId: p.id};

            //Display Weight Entries  - 1 Card pet weigh - in 
            const WeightEntries = weights.map((w): TimelineEntry =>({
                ...base,//shared files that every card uses 
                id: `logged-${w.id}`,//weight id - creates an instance of 
                type: 'logged',
                date: toDisplayDate(w.recordedAt),//Display on Date - text format
                sortKey: toSortKey(w.recordedAt), //Number used to order all cards
                title: 'Weight Recorded',//itle of Card
                subtitle: w.weightKg != null ? `${w.weightKg} kg` : 'No details!',
            }));//Display Weight in kg or No details if weight entry is missing

            //Symptom Entries = 1 Card per symptom entry and owner's notes
            const symptomEntries = symptoms.map((s): TimelineEntry =>({
                ...base,
                id:`note-${s.id}`,                 
                type: 'note',                     //Display note stored by pet owner for pet's symptom log
                date: toDisplayDate(s.recordedAt),//Date Recorded Symptom Log
                sortKey: toSortKey(s.recordedAt),//Sort by recorded Date
                title:s.name || 'Symptoms',             //Symptom Name
                subtitle: s.notes || 'No details',      //Owner's notes - text
            }));

            //Medications Entries -> 'rx' (sorted by date)
            const medicationEntries = medicine.map((m): TimelineEntry =>({
                ...base,
                id:`rx-${m.id}`,
                type: 'rx',
                date: toDisplayDate(m.startDate),
                sortKey: toSortKey(m.startDate),
                title: m.name || 'Medication',
                subtitle: [m.dosage, m.schedule].filter(Boolean).join(' • ') || 'No details',
            }));

            //Vet Visits = 'visit' (sort by date & time combined)
            const vetvisitsEntries = vetvisit.map((v): TimelineEntry => {
                //combine date + time inside 1 string so cards (sorting is correct)
                const when = `${v.appointmentDate}T${v.appointmentTime || '00:00'}:00`;
                //combine one date-time string "2026-11-02" with time
                return{
                    ...base,
                    id: `visit-${v.id}`,//Vet Visit id 
                    type: 'visit',//Type: Name of Timeline Card
                    date: toDisplayDate(when),//Date: current Date for appointment and appointment time (together)
                    sortKey: toSortKey(when),//
                    title: v.reason || 'Vet Visit',
                    subtitle: v.clinicName || 'No clinic details added!',
                };
            });

            //Reminders = 'reminder' (dated and sorted by scheduledFor)
            const reminderEntries = reminders.map((r): TimelineEntry => ({
                ...base,
                id: `reminder-${r.id}`,
                type:'reminder',
                date: toDisplayDate(r.scheduledFor),
                sortKey: toSortKey(r.scheduledFor),
                title: r.title,
                subtitle: `${r.type} • ${r.dismissedAt ? 'Done': 'Upcoming'}`, 
            }));//Show reminder type either "Done" or "Upcoming" only!

        return [...WeightEntries, ...symptomEntries, ...medicationEntries, ...vetvisitsEntries, ...reminderEntries];
        //join all 5 card types for Timeline View (inside and sorted by sortKey) to be kept organized on display

        }));

            //perPet an arry of arrays (one per pet) - flatten it into one list
            const allEntries = ([] as TimelineEntry[]).concat(...perPet);
            setEntries(allEntries);
            console.log('entries:', allEntries.length);
        //If error occurs - display error message
        } catch(e){
            console.log(e);
            setError('Unable to load timeline!');
        }finally{
            setLoading(false);
        }
    }    

    useEffect(() => {
        LoadTimeline();
    },[]);


        {/*Filter by selected chip only*/}
        const visiblepets = entries
            //Filter option 1: all (show all pet's overview timeline) or option 2: select pet (to view individual pet health activity logs)
            .filter(e => selectedPetId === 'all' || e.petId === selectedPetId)
            .sort((a, b) => b.sortKey - a.sortKey);//Sorting process
    

    return(
        <View style={styles.screen}>

            {/* ==== TIMELINE VIEW CARDS - 1 CARD PER ENTRY, Filtered list ==== */}

            {/*Header - Text only: Pet Timeline*/}
            <MainHeader title="Pet Timeline"/>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 96 + insets.bottom }]}>
             
            {/*Timeline Heading: Timeline */}
            <Text style={styles.heading_text}>Timeline</Text>

            {/*Pet via Chip*/}
            {/*Horizontal Row for chips: no scroll bar*/}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 16}}>
                {chips.map(chip => {{/* Map: loop over chip (All + real pets from backend), each chip is pressable / tapable*/}
                    
                    //true  = chip for the exact id that is being selected
                    const Active = chip.id === selectedPetId;

                    return(
                        <Pressable
                            key={chip.id}  
                            onPress={() => setSelectedPetId(chip.id)}
                            style={[styles.pet_chip, Active && styles.active_pet_chip]}
                        >   
                        <Text style={[styles.pet_chip_text, Active && styles.active_pet_chip_text]}>{chip.name}</Text> 
                        </Pressable>
                    );
                })}

                    {/*Style for only, when Pet-Chip is Active (tapped on by user)*/} 

                    {/*Chip Label Section: Display and enable tappable chip button (text turns white when active) */}

            </ScrollView>
            
            {/*Pop-up Cards*/}
            {loading ? <ActivityIndicator/>: null}

            {/*Error and Empty States*/}
            {error ? <Text style={styles.empty_text}>{error}</Text>:null}

            {/*Empty State Declared - if no entries*/}
            {!loading && !error && visiblepets.length === 0?(
                <Text>No Entries to show!</Text>
            ):null}

            {visiblepets.map(e => {
                const  cl = TYPE_COLORS[e.type]; // colors used for each entry type
                return(
                    <View key={e.id} style={styles.card}>
                        <View style={[styles.stripe, {backgroundColor: cl.stripe}]}/>
                        <View style={styles.card_top}>

                            <Text style={styles.card_date}>{e.date}</Text>
                            <View style={[styles.tag, {backgroundColor: cl.pillBg}] }>
                                    <Text style={[styles.tag_text, {color: cl.pilltext}]}>
                                        {TYPE_LABELS[e.type]}
                                    </Text>
                            </View>

                        </View>
                        <Text style={styles.card_title}>{e.title}</Text>
                        <Text style={styles.card_subtitle}>{e.subtitle}</Text>
                    </View>
                )
            })

            }

            </ScrollView>

            {/*Bottom Navigation Bar*/}
            <BottomNavBar
                active="timeline"
                onHomePress={onHomePress}
                onPetsPress={onPetsPress}
                onAlertsPress={() => onNavigate?.('reminders')}
                onTimelinePress={() => {}}
            />

        </View>
    )
}

//Styles Map view
const styles = StyleSheet.create({

    //Style for Stripe - Card
    stripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0, 
        width: 4,
    },

    //ScrollView Style
    content: {
        padding: 16,
    },

    //Main Screen 
    screen:{
        flex:1,
        backgroundColor: '#F6F4EF',
    }, 

    //Heading Text: 
    heading_text:{
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 16,
    },

    pet_chip:{
        borderRadius:999, 
        borderWidth: 1,
        backgroundColor: '#D8D2C6',
        borderColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight:8,
    },

    pet_chip_text:{
        fontWeight: '600',
        color: '#333',
    },

    active_pet_chip: {
        backgroundColor: '#1F6F5C',
        borderColor:'#1F6F5C',
    },

    active_pet_chip_text:{
        color:'#fff',
    },

    //Main Card Style
    card:{
        backgroundColor:'#fff',
        borderRadius:12,
        borderWidth:1,
        borderColor:'#E8E4DC',
        padding: 16,
        marginBottom: 10,
        overflow: 'hidden'//stick strips onto card (shows card colors)
    },

    //Card Top Style
    card_top:{
        flexDirection: 'row', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    //Date for Card
    card_date:{
        fontSize: 13, 
        fontWeight: '600',
        color:'#333',
    },

    //Tag
    tag: {
        paddingHorizontal: 8, 
        paddingVertical: 3,
        borderRadius:999
    },

    //Tag Text 
    tag_text:{
        fontSize: 10, 
        fontWeight: '700',
    },
    
    //Title for Card
    card_title:{
        fontSize: 17, 
        fontWeight: '700',
        color:'#111'
    },
    
    //Subtitle for Card 
    card_subtitle: {
        fontSize:13,
        color:'#666',
        marginTop: 2
    },

    //empty_text
    empty_text:{
        color:'#666',
        marginTop: 24,
    }

})
