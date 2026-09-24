//Imported React Libraries 
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from "@theme";

//Segment Control for Pet Profile Form Components


//Generic Type - one choice - Label (T) - placeholder
type Option<T> = {label: string; value: T};

//Options - list of pills to add 
//Value - which pill is active
//onChange - second option or pill that changes appearance for example choosing between dog / cat
type Props<T> = {
    options: Option<T>[];//reusable component
    value: T;
    onChange: (v: T) => void;
};


const styles = StyleSheet.create({
    container:{
        padding: 20, 
    },

    //Pill - isActive 
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

    pillActivetext: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },

    //Pill - InActive
    pillInactive: {
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
    pillInactivetext: {
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


//Object Type or function 
export default function SegmentControl<T extends string>({
    options, value, onChange, 
}:Props<T>){
    return(
        <View style={styles.row}>
            {options.map((opt) => {
                const isActive = opt.value === value;
                return(
                    <Pressable 
                        key={opt.value}
                        onPress={() => onChange(opt.value)}
                        style={isActive ? styles.pillisActive : styles.pillInactive}
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