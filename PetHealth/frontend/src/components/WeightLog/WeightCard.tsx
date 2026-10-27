//Imported React Libraries 
import { Pressable, Text, View, StyleSheet} from 'react-native';

type Unit= 'kg'|'lb'

//Weight Card Props
type WeightCardProps =  {
    current_Weight: number, //Stored in Kg
    last_Weighted_Date: string,//Weight Card - weight date
    unit: Unit,//Toggle Button KG / LB
    onUnitChange: (newUnit:Unit) => void;
}

function DisplayWeight(kg: number, unit:Unit){
    let weight_result = kg;

    if(unit === 'lb'){
        weight_result = kg *2.205 ;
        }

        return Math.round(weight_result * 10) / 10;
}

//Main Reusable Function - UI
export function WeightCard({ current_Weight, last_Weighted_Date, unit, onUnitChange}:WeightCardProps){


    return(
        <View>
            <View style={styles.card}>

            {/*Label Layout:*/}
            <View style={styles.sub_container}>
                <Text style={styles.label_text}>Current Weight:</Text>
                
                    <View style={styles.togglebuttongroup}>

                        <Pressable style={unit == 'kg' ? styles.Chip: null} onPress={() => onUnitChange('kg')}>
                            <Text style={unit == 'kg' ? styles.ActiveChip: styles.inactive}>kg</Text>
                        </Pressable>

                        <Pressable style={unit == 'lb' ? styles.Chip: null}onPress={() => onUnitChange('lb')}>
                            <Text style={unit == 'lb' ? styles.ActiveChip: styles.inactive}>lb</Text>
                        </Pressable>

                    </View>
            </View>

            <View style={styles.number_container}>
                <Text style={styles.maincard_text}>{DisplayWeight(current_Weight, unit)}</Text>
                <Text style={styles.unit_text}>{unit}</Text>
            </View>

             {/*Date Field*/}
                <Text style={styles.date_text}>Last Weighed at:{last_Weighted_Date}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({


    number_container:{
        flexDirection: 'row',
        alignItems: 'baseline',
    },

    togglebuttongroup:{
        flexDirection: 'row',
        gap: 4,
    },

    sub_container:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent:'space-between',
    },
    
    card: {
        backgroundColor:'#167D6B',
        borderRadius: 16,
        padding:16,
    }, 

    maincard_text: {
        fontSize: 44,
        color: '#fff',
        marginTop: 8,
    },

    unit_text:{
        fontSize: 16,
        color: '#fff',
    },

    Chip: {
        backgroundColor:'white',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },

    label_text:{
        color:'#fff',
        fontSize: 14,
    },

    date_text:{
        color:'#fff',
        fontSize: 13,
        opacity: 0.85,
        marginTop: 4,
    },

    //Display difference increase or decrease for weight chips
    toggle: {
        opacity: 0.15,
        color:'#fff',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    ActiveChip:{
        color:'#167D6B',
        fontSize: 13,
    },

    ActiveChiptext:{
        backgroundColor: '#008080'
    },

    inactive:{
        color:'white',
        fontSize:13,
    },

})

export default WeightCard;