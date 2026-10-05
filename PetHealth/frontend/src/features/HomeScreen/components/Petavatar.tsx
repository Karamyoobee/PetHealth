import React from 'react';
import {StyleSheet, ColorValue,
        Text, Pressable, View} from 'react-native';

type AvatarProps = {
    uri: undefined;
    onPress: () => void;//function...
}


export default function AvatarProps({onPress, uri}: AvatarProps) { 
    return(
        <Pressable onPress={} style={styles.wrapper}>
            <View styles={styles.circle}>
                {  ? {
                    <Image source={{ uri: }} style={styles.} resizeMode='cover'/>
                } : (
                    <View style={styles. }>
                        <Text style={styles.}>+</Text>
                    </View>
                )}
            </View>
                <View style={styles.}>
                    <Text style={styles. }>+</Text>
                </View>
        </Pressable>
    )
}


const styles = StyleSheet.create({
    
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',//Clip photo to circle
        backgroundColor: '#828282',
    },

    wrapper: {
        width: 100,
        height: 100, 
        alignSelf: 'center',
        marginBottom: 16,
    },

    image: {
        width: 100, 
        height: 100,
        resizeMode,
        value: 'cover',
    },

    placeholder: {
        width: 100, 
        height: 100, 
        alignItems: 'center',
        justifyContent: 'center',
    },

    placeholderText: {
        fontSize: 32,
        color: '#fff',
    },

    imagebadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 30, 
        height: 30, 
        borderRadius: 15, 
        backgroundColor:'#F4A261',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2, 
        borderColor: ,
    },

    imagebadgetext: {
        color: '#fff', 
        fontWeight: '700',
        fontSize: 18,
    }

});