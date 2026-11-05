//Imported React Libraries 
import { Pressable, Text, View, StyleSheet } from 'react-native';


//Props - Segment Control Button
type Option<T> = {label: string; value: T};

//Options - list of pills to add 
//Value - which pill is active
//onChange - second option or pill that changes appearance for example choosing between dog / cat

//Same control that works with any string value, not only cat/dog
type Props<T> = {
    options: Option<T>[];//1 pill in control only
    value: T;//Selected value, compared only against each option to identify the active pill
    onChange: (v: T) => void;//
};


//Main Reusable Component for Segment control
export default function SegmentControl<T extends string>({options, value, onChange}:Props<T>){
    return(
        <View style={styles.row}>
            {/*Fetch and Display 1 pill per option*/}
            {options.map((opt) => {
                //Only True for pill that matches the selected value
                const isActive = opt.value === value;
                return(
                    <Pressable 
                        //Unique Value per option
                        key={opt.value}
                        //Inform parent the value that has been pressed
                        onPress={() => onChange(opt.value)}
                        //Switch between active and inactive style
                        style={isActive ? styles.pillisActive : styles.Inactivepill}
                        >   {/* Label Text Style: switches to match the pill state (as per user's selected pill state) */}
                            <Text style={isActive ? styles.activepilltext: styles.inactivepilltext}>
                                {opt.label}
                            </Text>
                        </Pressable>
                );
            })}
        </View>
);
} 

//Main Style Sheet
const styles = StyleSheet.create({

    //Outer container - spacing for entire component control
    container:{
        padding: 20, 
    },

    //Active Pill: Fill with green  
    pillisActive: {
        flex: 1, 
        height: 44, 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F7A6C',
        borderRadius:10,
        borderWidth: 1,
        borderColor: '#1F7A6C',
    },

    //Active Pill Text - White
    activepilltext: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },

    //Inactive Pill - Style
    Inactivepill: {
        flex: 1,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius:10,
        borderWidth: 1,
        borderColor: '#1F7A6C',
    },

    //TextInactive
    inactivepilltext: {
        color: '#000',
        fontWeight: '600',
        fontSize: 15,
    },

    //row
    row: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    }

});
