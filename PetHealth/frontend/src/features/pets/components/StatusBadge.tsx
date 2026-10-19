import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type StatusProps = {
    status: string;
}

export default function StatusBadge({status}:StatusProps){
    const isDue = status === "Checkup Due";

    return(
        <View style={[styles.pill,{ backgroundColor: isDue ? '#FDE8CF':'#DDEFE8'}]}>

            <Text style={{color: isDue ?  '#B4691A': '#1F7A66'}}>  
                {status}
            </Text>

        </View>
    )
}

const styles = StyleSheet.create({
        pill:{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            alignSelf: 'flex-start',            
        },
        
        label: {
            fontSize:11,
            fontWeight: '600', 
        },

});

