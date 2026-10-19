import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

type PetImageProps = {
    uri?: string |null;
    size?: number;
};


export default function PhotoCover({uri, size=70 }: PetImageProps){
    const measurement = {
        width: size,
        height: size, 
        borderRadius: size/2,
    };

    if (!uri) { 
        return <View style={[styles.cover, measurement]}/>;
    }
    return(
        <Image source={{ uri }} style={[styles.cover, measurement]}/>
    );
    
}

const styles = StyleSheet.create({
    cover: {
        backgroundColor: '#E4E2DA',
        borderRadius: 10,
        borderWidth: 1, 
        borderColor: '#E4E2DA',
    },
});