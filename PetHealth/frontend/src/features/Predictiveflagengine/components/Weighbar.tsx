import {View, StyleSheet} from 'react-native';

type WeightBarProps = {
    percent: number; //0-100
    color: string
};

export default function Weightbar({percent, color}:WeightBarProps){
    
    //Set 
    const safe = Math.min(100, Math.max(0, percent));

    return(
        <View style={[styles.container, { width: `${safe}%`, backgroundColor: color}]}>
            <View>

            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    //Container - Main
    container: {
        backgroundColor: '#008000',
        overflow:'hidden',
        borderRadius: 3,
        marginHorizontal: 10,
        height:8,
    },

    //Second Container - Innver View (for width and color)
    sub_container:{
        height:8,
        borderRadius: 4,
    }
})