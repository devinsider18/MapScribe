import React from 'react'
import { StyleSheet,View, Platform } from 'react-native';
import MapView,{PROVIDER_DEFAULT,PROVIDER_GOOGLE} from 'react-native-maps';
export default function MapViewComponent(){
    return(
        <View>
            <MapView
                map={Platform.OS==='android'?PROVIDER_GOOGLE:PROVIDER_DEFAULT}
                style={styles.map}
                showsUserLocation={true}
                showsMyLocationButton={true}
            />
        </View>
    )
}
const styles = StyleSheet.create({
    map: {
        width: '100%',
        height: '100%',
    },
});