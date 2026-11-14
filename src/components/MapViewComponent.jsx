import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { addMarkerToDb, getMarkers, initDatabase } from '../api/database';
import MapMarkers from './MapMarkers';
import SavePlaceModal from './SavePlaceModal';

const CLEAN_MAP_STYLE = [
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
];

const MAP_DELTA = 0.02;

export default function MapViewComponent() {
  const [region, setRegion] = useState(null);
  const [markers, setMarkers] = useState(() => {
    try {
      initDatabase();
      return getMarkers().map((marker) => ({
        id: marker.id,
        coordinate: { latitude: marker.latitude, longitude: marker.longitude },
        title: marker.title,
        listType: marker.listType || 'want_to_go',
      }));
    } catch (error) {
      console.error('Error loading markers on mount:', error);
      return [];
    }
  });

  const [modalState, setModalState] = useState({
    visible: false,
    coords: null,
    title: '',
    listType: 'want_to_go',
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync();
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: MAP_DELTA,
        longitudeDelta: MAP_DELTA,
      });
    })();
  }, []);

  // Перехватываем долгое нажатие и передаем координаты в модальное окно
  const handleLongPress = (e) => {
    const coords = e.nativeEvent.coordinate;
    setModalState({
      visible: true,
      coords,
      title: '',
      listType: 'want_to_go',
    });
  };

  const handleSavePlace = () => {
    if (!modalState.coords) return;

    try {
      const title = modalState.title.trim() || 'Unlabeled Place';
      const id = addMarkerToDb(modalState.coords, title, modalState.listType);
      setMarkers((prev) => [
        ...prev,
        {
          id,
          coordinate: modalState.coords,
          title,
          listType: modalState.listType,
        },
      ]);
      setModalState({ visible: false, coords: null, title: '', listType: 'want_to_go' });
    } catch (error) {
      console.error('Error saving new marker:', error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton
        initialRegion={region}
        region={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={CLEAN_MAP_STYLE}
        onLongPress={handleLongPress}
      >
        <MapMarkers markers={markers} />
      </MapView>
      <SavePlaceModal
        modalState={modalState}
        setModalState={setModalState}
        onSave={handleSavePlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});