import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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
const LOCATION_UNAVAILABLE_MESSAGE = 'Location is unavailable. You can still browse the map and save places.';
const EMPTY_MODAL_STATE = {
  visible: false,
  coords: null,
  title: '',
  listType: DEFAULT_LIST_TYPE,
  markerId: null,
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
  const {
    markers,
    loadError,
    addSavedMarker,
    updateSavedMarker,
    deleteSavedMarker,
  } = useSavedMarkers();
  const [modalState, setModalState] = useState(EMPTY_MODAL_STATE);
  const [saveError, setSaveError] = useState('');
  const [locationNotice, setLocationNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    getInitialRegion()
      .then((initialRegion) => {
        if (!isMounted) return;

        if (initialRegion) {
          setRegion(initialRegion);
        } else {
          setLocationNotice(LOCATION_UNAVAILABLE_MESSAGE);
        }
      })
      .catch((error) => {
        if (!isMounted) return;

        if (error?.code === 'ERR_CURRENT_LOCATION_IS_UNAVAILABLE') {
          setLocationNotice(LOCATION_UNAVAILABLE_MESSAGE);
          return;
        }

        console.error('Failed to get the initial map location:', error);
        setLocationNotice('Could not determine your location. You can still browse the map and save places.');
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
      markerId: null,
    });
  };

  const handleMarkerPress = (marker) => {
    setSaveError('');
    setModalState({
      visible: true,
      coords: marker.coordinate,
      title: marker.title,
      listType: marker.listType,
      markerId: marker.id,
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
      if (modalState.markerId === null) {
        addSavedMarker(modalState.coords, title, modalState.listType);
      } else {
        updateSavedMarker(modalState.markerId, modalState.coords, title, modalState.listType);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save place:', error);
      setSaveError('Could not save this place. Please try again.');
    }
  };

  const handleDeletePlace = () => {
    if (modalState.markerId === null) return;

    Alert.alert(
      'Delete place?',
      `Remove "${modalState.title}" from your saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteSavedMarker(modalState.markerId);
              handleCloseModal();
            } catch (error) {
              console.error('Failed to delete place:', error);
              setSaveError('Could not delete this place. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        initialRegion={region}
        region={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={CLEAN_MAP_STYLE}
        onLongPress={handleLongPress}
      >
        <MapMarkers markers={markers} onMarkerPress={handleMarkerPress} />
      </MapView>
      {locationNotice ? <Text style={styles.locationNotice}>{locationNotice}</Text> : null}
      {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
      <SavePlaceModal
        visible={modalState.visible}
        title={modalState.title}
        selectedListType={modalState.listType}
        errorMessage={saveError}
        isEditing={modalState.markerId !== null}
        onTitleChange={handleTitleChange}
        onListTypeChange={handleListTypeChange}
        onClose={handleCloseModal}
        onSave={handleSavePlace}
        onDelete={handleDeletePlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  locationNotice: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFF4E5',
    color: '#663C00',
  },
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