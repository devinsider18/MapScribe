import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import {
  CLEAN_MAP_STYLE,
  LOCATION_NOTICE_INSET,
  MAP_DELTA,
} from '../constants/mapConfig';
import {
  ACTION_LABELS,
  DEFAULT_PLACE_TITLE,
  DELETE_PLACE_FAILURE,
  DELETE_PLACE_TITLE,
  LOCATION_LOOKUP_FAILED,
  LOCATION_UNAVAILABLE,
} from '../constants/messages.mjs';
import { COLORS, RADII, SPACING } from '../constants/theme';
import MapMarkers from './MapMarkers';
import SavePlaceModal from './SavePlaceModal';

const EMPTY_MODAL_STATE = {
  visible: false,
  coords: null,
  title: '',
  listType: DEFAULT_LIST_TYPE,
  markerId: null,
};

/** @returns {Promise<import('react-native-maps').Region | null>} */
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

/**
 * @param {{
 *   savedPlaces: ReturnType<typeof import('../hooks/useSavedMarkers').default>
 * }} props
 */
export default function MapViewComponent({ savedPlaces }) {
  const [region, setRegion] = useState(null);
  const {
    markers,
    listCategories,
    loadError,
    addSavedMarker,
    updateSavedMarker,
    deleteSavedMarker,
  } = savedPlaces;
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
          setLocationNotice(LOCATION_UNAVAILABLE);
        }
      })
      .catch((error) => {
        if (!isMounted) return;

        if (error?.code === 'ERR_CURRENT_LOCATION_IS_UNAVAILABLE') {
          setLocationNotice(LOCATION_UNAVAILABLE);
          return;
        }

        console.error('Failed to get the initial map location:', error);
        setLocationNotice(LOCATION_LOOKUP_FAILED);
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
      const title = modalState.title.trim() || DEFAULT_PLACE_TITLE;
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
      DELETE_PLACE_TITLE,
      `Remove "${modalState.title}" from your saved places?`,
      [
        { text: ACTION_LABELS.cancel, style: 'cancel' },
        {
          text: ACTION_LABELS.delete,
          style: 'destructive',
          onPress: () => {
            try {
              deleteSavedMarker(modalState.markerId);
              handleCloseModal();
            } catch (error) {
              console.error('Failed to delete place:', error);
              setSaveError(DELETE_PLACE_FAILURE);
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
        <MapMarkers
          markers={markers}
          listCategories={listCategories}
          onMarkerPress={handleMarkerPress}
        />
      </MapView>
      {locationNotice ? <Text style={styles.locationNotice}>{locationNotice}</Text> : null}
      {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}
      <SavePlaceModal
        visible={modalState.visible}
        title={modalState.title}
        selectedListType={modalState.listType}
        errorMessage={saveError}
        listCategories={listCategories}
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
    top: LOCATION_NOTICE_INSET,
    left: LOCATION_NOTICE_INSET,
    right: LOCATION_NOTICE_INSET,
    padding: SPACING.md,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.warningSurface,
    color: COLORS.warningText,
  },
  loadError: {
    position: 'absolute',
    top: LOCATION_NOTICE_INSET,
    left: LOCATION_NOTICE_INSET,
    right: LOCATION_NOTICE_INSET,
    padding: SPACING.md,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.dangerContainer,
    color: COLORS.danger,
  },
});