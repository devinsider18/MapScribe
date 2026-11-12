import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import MapViewComponent from '../components/MapViewComponent';
export default function HomeScreen(){
    return(
        <SafeAreaView style={styles.container}>
            <MapViewComponent />
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});