import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import StatCard from '../components/Statcard';
import QuickActions from '../components/Quickactions';
import { User } from '../../../types';

type Props = {
  user: User;
  onSignOut: () => void;
  onNavigate?: (screen: "vetVisits" | "medications" | "reminders" | "reports") => void;
};

//Function for Greeting Text - Display


export default function HomeScreen({user, onSignOut, onNavigate}: Props){
    return (
        <View style={styles.row}>
            {/*Add User Greetings*/}
            <View style={styles.greetingBlock}>
                <Text style={styles.greeting}>Hello, 👋 </Text>
                <Text style={styles.greetingSub}>How are your pets today?</Text>
            </View>

          <View style={styles.rowStatscard}>
           {/*Add Stat Card*/}
           <View style={styles.itemstat}>
              <StatCard
                  icon={<MaterialIcons name="vaccines" size={24} color="green" />}
                  tintcolor="#4CB282"
                  label="Vaccines"
                  value="0"
            />
           </View>
            
          <View style={styles.itemstat}>
            <StatCard
                icon={<AntDesign name="medicinebox" size={24} color="black" />}
                tintcolor="#FFC067"
                label="Meds"
                value="0"            
            />
          </View>

          <View style={styles.itemstat}>
            <StatCard
                icon={<FontAwesome5 name="clinic-medical" size={24} color="black" />}
                tintcolor="#FFC067"
                label="Vet Visits"
                value="0"            
            />
          </View>

        </View>
          
        {/*Section 2: Add My Pets*/}
        {/*Title for Quick Actions - Section */}
          <Text style={styles.title_section}>Quick Actions</Text>

        {/*Section 3: Add Quick Actions*/}
        <View style={styles.quickactiongrid}>

          <View style={styles.quickactionitem}>
            <QuickActions 
              icon={<Text>🌡️</Text>} 
              tintcolor='#A1D99B'
              label="Log Symptom"
              onPress={() => {}} />
          </View>

            <QuickActions 
            icon={<Text>⚖️</Text>} 
            tintcolor='#A1D99B'
            label="Weight Tracker"
            onPress={() => {}} />

          <View style={styles.quickactionitem}>
            <QuickActions 
            icon={<Text>🩺</Text>} 
            tintcolor='#A1D99B'
            label="Vet Visits" 
            onPress={() => {}} />
          </View>
          
          <View style={styles.quickactionitem}>
            <QuickActions
            icon={<Text>💊</Text>}
            tintcolor='#FFC067' 
            label="Medications"
            onPress={() => {}} />
          </View>

          <TouchableOpacity onPress={onSignOut}>
            <Text>Sign Out</Text>
          </TouchableOpacity>

        </View>
    </View>
)
}


const styles = StyleSheet.create({

    row: {
        paddingHorizontal: 16,
    },

    //Greeting section
    greetingBlock:{
        padding: 16,
    },

    //Main Greeting Section
    greeting: {
        color: "#000000",
        fontSize: 35,
        fontWeight: "800",
    },

    //Sub Text - Greeting Section
    greetingSub:{
        color:"#000000",
        fontSize:13,
        marginTop:5,
    },

    //Stats Card Row - Alignment 
    rowStatscard: {
        flexDirection: 'row',
        gap:12,
    },

    itemstat:{
        flex: 1,
        marginTop:25,
    },

    title_section:{
      fontSize: 20,
      fontWeight: '700',
      marginTop: 260,
      marginBottom: 12,
    },

    quickactiongrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    quickactionitem: {
        width: '48%',
    },

});

