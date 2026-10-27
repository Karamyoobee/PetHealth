//Weight Form Field  reusable labelled field (icon, label with any input)

import { ReactNode }from "react";
import {View, Text, StyleSheet} from 'react-native';

//Weight Main Form Field Props
type Weightformfieldprops={
    icon: ReactNode,
    label: string,
    children: ReactNode,
}

//Function  - Weight Form Field 
export default function WeightFormField({icon,label,children}:Weightformfieldprops){

    return(
        //Component - label row on top and input(children) beneath
        <View style={styles.wrap_container}>
                <View style={styles.row}>
                    {icon}
                    <Text style={styles.label_style}>{label}</Text>
                
                </View>
                    {children}
        </View>

    
    )
}

//Styles for Component
const styles = StyleSheet.create({

    //Outer container - style
    wrap_container:{
        gap:8,
    },

    //Row Style - main container
    row:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    //Label Text Style
    label_style:{
        fontSize: 13,
        fontWeight: '500',
        color:'#4A6B64',
    },


})