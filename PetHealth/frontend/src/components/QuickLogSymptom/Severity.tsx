//Severity Segment Button - connected segment conrol for user to choose 1 option 
//Mild / Moderate / Severe

//Imported React Libraries 
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from "@theme";


//1 choice: text shown on Screen (label) and value stored (value)
type Option<T> = {
    label: string;
    value: T}
;

//Options - list of pills to add 
//Value - which pill is active
//onChange - second option or pill that changes appearance for example choosing between dog / cat
type Props<T> = {
    options: Option<T>[];//Segment shown
    value: T;//current selected value (Mild/Moderate/Severe)
    onChange: (v: T) => void;//calls with the new value on Tap!
};


//Main Component Function - renders 1 tappable segment per (option) and highlight's the selected one or Active
export default function SeveritySegmentButton<T extends string>({options, value, onChange, }:Props<T>){
    return(
        <View style={styles.row}>
            {options.map((opt) => {
                const isActive = opt.value === value;
                return(
                    <Pressable 
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        //Active and Inactive Pill Style
                        style={isActive ? styles.ActivePill : styles.InactivePill}
                        >
                            <Text style={isActive ? styles.pillActivetext: styles.pillInactivetext}>
                                {opt.label}
                            </Text>
                        </Pressable>
                );
            })}
        </View>
);
} 


const styles = StyleSheet.create({
    //row container style: Segment control button
    row: {
        flexDirection: 'row',
        width: '100%',
        borderColor: '#EBEBEB',
        borderRadius: 10,
        overflow:'hidden',
    },

    //Active Pill - Selected Segment
    ActivePill: {
        flex: 1, 
        height: 44, 
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4A04A',
        borderColor: '#000',
    },
    
    //Active Pill Text - Text Inside Segment Control Button
    pillActivetext: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },

    //Inactive Pill - Segment Control Button not Selected Style
    InactivePill: {
        flex: 1,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius:10,
        borderWidth: 1,
    },

    //Inactive Text Style - Segment Control Button not Selected!
    pillInactivetext: {
        color: '#000',
        fontWeight: '600',
        fontSize: 15,
    },

});
