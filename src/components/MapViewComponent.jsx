import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import useSavedMarkers from '../hooks/useSavedMarkers';
import MapMarkers from './MapMarkers';
import SavePlaceModal from './SavePlaceModal';

const CLEAN_MAP_STYLE = [
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
];

const MAP_DELTA = 0.02;
const EMPTY_MODAL_STATE = {
  visible: false,
  coords: null,
  title: '',
  listType: DEFAULT_LIST_TYPE,
};

async function getInitialRegion() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await Location.getCurrentPositionAsync();
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };
}

export default function MapViewComponent() {
  const [region, setRegion] = useState(null);
  const { markers, loadError, addSavedMarker } = useSavedMarkers();
  const [modalState, setModalState] = useState(EMPTY_MODAL_STATE);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let isMounted = true;

    getInitialRegion()
      .then((initialRegion) => {
        if (isMounted && initialRegion) setRegion(initialRegion);
      })
      .catch((error) => {
        console.error('Failed to get the initial map location:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLongPress = (event) => {
    setSaveError('');
    setModalState({
      visible: true,
      coords: event.nativeEvent.coordinate,
      title: '',
      listType: DEFAULT_LIST_TYPE,
    });
  };

  const handleCloseModal = () => {
    setModalState(EMPTY_MODAL_STATE);
    setSaveError('');
  };

  const handleTitleChange = (title) => {
    setModalState((current) => ({ ...current, title }));
  };

  const handleListTypeChange = (listType) => {
    setModalState((current) => ({ ...current, listType }));
  };

  const handleSavePlace = () => {
    if (!modalState.coords) {
      setSaveError('Select a location on the map before saving.');
      return;
    }

    try {
      const title = modalState.title.trim() || 'Unlabeled Place';
      addSavedMarker(modalState.coords, title, modalState.listType);
      handleCloseModal();
    } catch {
      setSaveError('Could not save this place. Please try again.');
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
      {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
      <SavePlaceModal
        visible={modalState.visible}
        title={modalState.title}
        selectedListType={modalState.listType}
        errorMessage={saveError}
        onTitleChange={handleTitleChange}
        onListTypeChange={handleListTypeChange}
        onClose={handleCloseModal}
        onSave={handleSavePlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadError: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FCE8E6',
    color: '#B3261E',
  },
});