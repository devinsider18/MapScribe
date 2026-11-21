import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import {
  CLEAN_MAP_STYLE,
  LOCATION_NOTICE_INSET,
  MAP_DELTA,
} from '../constants/mapConfig';
import {
  DEFAULT_PLACE_TITLE,
  DELETE_PLACE_FAILURE,
  DELETE_PLACE_TITLE,
  LOCATION_LOOKUP_FAILED,
  LOCATION_UNAVAILABLE,
} from '../constants/messages.mjs';
import { formatPlaceDate, parsePlaceDate } from '../constants/placeDates.mjs';
import { COLORS, FONT_SIZE, RADII, SPACING } from '../constants/theme';
import MapMarkers from './MapMarkers';
import PlaceDetailsModal from './PlaceDetailsModal';
import SavePlaceModal from './SavePlaceModal';
import ConfirmDialog from './ConfirmDialog';

/**
 * @typedef {{
 *   visible: boolean,
 *   coords: { latitude: number, longitude: number } | null,
 *   title: string,
 *   listType: string,
 *   markerId: number | null,
 *   photos: string[],
 *   progress: string,
 *   notes: string,
 *   visitedAt: string
 * }} PlaceModalState
 */

/** @type {PlaceModalState} */
const EMPTY_MODAL_STATE = {
  visible: false,
  coords: null,
  title: '',
  listType: DEFAULT_LIST_TYPE,
  markerId: null,
  photos: [],
  progress: 'unvisited',
  notes: '',
  visitedAt: '',
};

/**
 * @param {(available: boolean) => void} onLocationAvailabilityChange
 * @returns {Promise<import('react-native-maps').Region | null>}
 */
async function getInitialRegion(onLocationAvailabilityChange) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    onLocationAvailabilityChange(false);
    return null;
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    onLocationAvailabilityChange(false);
    return null;
  }

  onLocationAvailabilityChange(true);
  const location = await Location.getCurrentPositionAsync();
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: MAP_DELTA,
    longitudeDelta: MAP_DELTA,
  };
}

/** @param {unknown} error */
function isLocationUnavailable(error) {
  if (!(error instanceof Error)) return false;
  return ('code' in error && error.code === 'ERR_CURRENT_LOCATION_IS_UNAVAILABLE')
    || error.message.includes('unsatisfied device settings');
}

/**
 * @param {{
 *   savedPlaces: ReturnType<typeof import('../hooks/useSavedMarkers').default>,
 *   filters: { listType: string, progress: string },
 *   onFiltersChange: (filters: { listType: string, progress: string }) => void,
 *   focusPlace: (
 *     ReturnType<typeof import('../hooks/useSavedMarkers').default>['markers'][number]
 *     & { focusKey: number }
 *   ) | null,
 *   onFocusPlaceHandled: () => void,
 *   locationRequestId: number,
 *   onLocationAvailabilityChange: (available: boolean) => void
 * }} props
 */
export default function MapViewComponent({
  savedPlaces,
  filters,
  onFiltersChange,
  focusPlace,
  onFocusPlaceHandled,
  locationRequestId,
  onLocationAvailabilityChange,
}) {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState(
    /** @type {import('react-native-maps').Region | null} */ (null)
  );
  const mapRef = useRef(
    /** @type {import('react-native-maps').default | null} */ (null)
  );
  const {
    markers,
    listCategories,
    loadError,
    addSavedMarker,
    updateSavedMarker,
    deleteSavedMarker,
  } = savedPlaces;
  const [modalState, setModalState] = useState(EMPTY_MODAL_STATE);
  const [selectedPlaceId, setSelectedPlaceId] = useState(
    /** @type {number | null} */ (null)
  );
  const [saveError, setSaveError] = useState('');
  const [locationNotice, setLocationNotice] = useState('');
  const [deleteConfirmationVisible, setDeleteConfirmationVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getInitialRegion(onLocationAvailabilityChange)
      .then((initialRegion) => {
        if (!isMounted) return;

        if (initialRegion) {
          setRegion(initialRegion);
        } else {
          setLocationNotice(LOCATION_UNAVAILABLE);
        }
      })
      .catch((/** @type {unknown} */ error) => {
        if (!isMounted) return;

        if (isLocationUnavailable(error)) {
          onLocationAvailabilityChange(false);
          setLocationNotice(LOCATION_UNAVAILABLE);
          return;
        }

        console.error('Failed to get the initial map location:', error);
        setLocationNotice(LOCATION_LOOKUP_FAILED);
      });

    return () => {
      isMounted = false;
    };
  }, [onLocationAvailabilityChange]);

  useEffect(() => {
    if (!locationRequestId) return undefined;
    let isMounted = true;

    const centerOnUser = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        const servicesEnabled = status === 'granted'
          && await Location.hasServicesEnabledAsync();
        if (!isMounted) return;
        onLocationAvailabilityChange(servicesEnabled);

        if (!servicesEnabled) {
          setLocationNotice(LOCATION_UNAVAILABLE);
          return;
        }

        const location = await Location.getCurrentPositionAsync();
        if (!isMounted) return;
        setLocationNotice('');
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: MAP_DELTA,
          longitudeDelta: MAP_DELTA,
        }, 650);
      } catch (error) {
        if (!isMounted) return;
        if (isLocationUnavailable(error)) {
          onLocationAvailabilityChange(false);
          setLocationNotice(LOCATION_UNAVAILABLE);
          return;
        }

        console.error('Failed to center the map on the current location:', error);
        setLocationNotice(LOCATION_LOOKUP_FAILED);
      }
    };

    void centerOnUser();
    return () => {
      isMounted = false;
    };
  }, [locationRequestId, onLocationAvailabilityChange]);

  /** @param {import('react-native-maps').LongPressEvent} event */
  const handleLongPress = (event) => {
    setSaveError('');
    setModalState({
      visible: true,
      coords: event.nativeEvent.coordinate,
      title: '',
      listType: DEFAULT_LIST_TYPE,
      markerId: null,
      photos: [],
      progress: 'unvisited',
      notes: '',
      visitedAt: '',
    });
  };

  useEffect(() => {
    if (!focusPlace) return;
    mapRef.current?.animateToRegion({
      ...focusPlace.coordinate,
      latitudeDelta: MAP_DELTA / 2,
      longitudeDelta: MAP_DELTA / 2,
    });
  }, [focusPlace]);

  /**
   * @param {ReturnType<typeof import('../hooks/useSavedMarkers').default>['markers'][number]} marker
   */
  const handleMarkerPress = (marker) => {
    setSaveError('');
    onFocusPlaceHandled();
    setSelectedPlaceId(marker.id);
  };

  const selectedPlace = markers.find((marker) => marker.id === focusPlace?.id)
    ?? markers.find((marker) => marker.id === selectedPlaceId)
    ?? null;
  const selectedCategory = listCategories.find(
    (category) => category.id === selectedPlace?.listType
  ) ?? listCategories[0];

  const handleEditSelectedPlace = () => {
    if (!selectedPlace) return;

    setModalState({
      visible: true,
      coords: selectedPlace.coordinate,
      title: selectedPlace.title,
      listType: selectedPlace.listType,
      markerId: selectedPlace.id,
      photos: selectedPlace.photos ?? [],
      progress: selectedPlace.progress ?? 'unvisited',
      notes: selectedPlace.notes ?? '',
      visitedAt: formatPlaceDate(selectedPlace.visitedAt),
    });
    setSelectedPlaceId(null);
    onFocusPlaceHandled();
  };

  const handleClosePlaceDetails = () => {
    setSelectedPlaceId(null);
    onFocusPlaceHandled();
  };

  const handleCloseModal = () => {
    setModalState(EMPTY_MODAL_STATE);
    setSaveError('');
  };

  /** @param {string} title */
  const handleTitleChange = (title) => {
    setModalState((current) => ({ ...current, title }));
  };

  /** @param {string} notes */
  const handleNotesChange = (notes) => {
    setModalState((current) => ({ ...current, notes }));
  };

  /** @param {string} visitedAt */
  const handleVisitedAtChange = (visitedAt) => {
    setModalState((current) => ({ ...current, visitedAt }));
  };

  /** @param {string[]} photos */
  const handlePhotosChange = async (photos) => {
    if (modalState.markerId === null) return;

    try {
      await savedPlaces.updateSavedMarkerPhotos(modalState.markerId, photos);
    } catch (error) {
      if (error instanceof Error && 'photosUpdated' in error && error.photosUpdated) {
        setModalState((current) => ({ ...current, photos }));
      }
      throw error;
    }
    setModalState((current) => ({ ...current, photos }));
  };

  /** @param {string} progress */
  const handleProgressChange = (progress) => {
    if (modalState.markerId === null) return;

    try {
      savedPlaces.updateSavedMarkerProgress(modalState.markerId, progress);
      setModalState((current) => ({ ...current, progress }));
    } catch (error) {
      console.error('Failed to update place progress:', error);
      setSaveError('Could not update this place. Please try again.');
    }
  };

  /** @param {string} listType */
  const handleListTypeChange = (listType) => {
    setModalState((current) => ({ ...current, listType }));
  };

  const handleSavePlace = () => {
    if (!modalState.coords) {
      setSaveError('Select a location on the map before saving.');
      return;
    }
    const visitedAt = parsePlaceDate(modalState.visitedAt);
    if (modalState.visitedAt.trim() && !visitedAt) {
      setSaveError('Enter the date as DD.MM.YYYY.');
      return;
    }

    try {
      const title = modalState.title.trim() || DEFAULT_PLACE_TITLE;
      if (modalState.markerId === null) {
        addSavedMarker(
          modalState.coords,
          title,
          modalState.listType,
          modalState.notes,
          visitedAt
        );
      } else {
        updateSavedMarker(
          modalState.markerId,
          modalState.coords,
          title,
          modalState.listType,
          modalState.photos,
          modalState.progress,
          modalState.notes,
          visitedAt
        );
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save place:', error);
      setSaveError('Could not save this place. Please try again.');
    }
  };

  const handleDeletePlace = () => {
    if (modalState.markerId === null) return;
    setDeleteConfirmationVisible(true);
  };

  const confirmDeletePlace = async () => {
    if (modalState.markerId === null) return;
    const markerId = modalState.markerId;
    setDeleteConfirmationVisible(false);
    try {
      await deleteSavedMarker(markerId);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to delete place:', error);
      if (error instanceof Error && 'placeDeleted' in error && error.placeDeleted) {
        handleCloseModal();
        Alert.alert('Place deleted', 'Some attached photo files could not be removed.');
      } else {
        setSaveError(DELETE_PLACE_FAILURE);
      }
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        showsPointsOfInterests={false}
        toolbarEnabled={false}
        initialRegion={region ?? undefined}
        region={region ?? undefined}
        onRegionChangeComplete={setRegion}
        customMapStyle={CLEAN_MAP_STYLE}
        onLongPress={handleLongPress}
      >
        <MapMarkers
          markers={markers.filter((marker) => (
            (filters.listType === 'all' || marker.listType === filters.listType)
            && (filters.progress === 'all' || marker.progress === filters.progress)
          ))}
          listCategories={listCategories}
          onMarkerPress={handleMarkerPress}
        />
      </MapView>
      <View style={[styles.filters, { top: insets.top + SPACING.sm }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip
            label="All lists"
            selected={filters.listType === 'all'}
            onPress={() => onFiltersChange({ ...filters, listType: 'all' })}
          />
          {listCategories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.label}
              selected={filters.listType === category.id}
              onPress={() => onFiltersChange({ ...filters, listType: category.id })}
            />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { id: 'all', label: 'Any status' },
            { id: 'unvisited', label: 'Not visited' },
            { id: 'planned', label: 'Planned' },
            { id: 'visited', label: 'Visited' },
          ].map((option) => (
            <FilterChip
              key={option.id}
              label={option.label}
              selected={filters.progress === option.id}
              onPress={() => onFiltersChange({ ...filters, progress: option.id })}
            />
          ))}
        </ScrollView>
      </View>
      <View
        pointerEvents="none"
        style={[styles.statusBarSurface, { height: insets.top }]}
      />
      {locationNotice ? (
        <Text style={[styles.locationNotice, { top: insets.top + LOCATION_NOTICE_INSET + 74 }]}>
          {locationNotice}
        </Text>
      ) : null}
      {loadError ? (
        <Text style={[styles.loadError, { top: insets.top + LOCATION_NOTICE_INSET + 74 }]}>
          {loadError}
        </Text>
      ) : null}
      <PlaceDetailsModal
        place={selectedPlace}
        category={selectedCategory}
        onClose={handleClosePlaceDetails}
        onEdit={handleEditSelectedPlace}
      />
      <SavePlaceModal
        visible={modalState.visible}
        title={modalState.title}
        selectedListType={modalState.listType}
        errorMessage={saveError}
        listCategories={listCategories}
        placeId={modalState.markerId}
        photos={modalState.photos}
        progress={modalState.progress}
        notes={modalState.notes}
        visitedAt={modalState.visitedAt}
        onPhotosChange={handlePhotosChange}
        onProgressChange={handleProgressChange}
        onNotesChange={handleNotesChange}
        onVisitedAtChange={handleVisitedAtChange}
        isEditing={modalState.markerId !== null}
        onTitleChange={handleTitleChange}
        onListTypeChange={handleListTypeChange}
        onClose={handleCloseModal}
        onSave={handleSavePlace}
        onDelete={handleDeletePlace}
      />
      <ConfirmDialog
        visible={deleteConfirmationVisible}
        title={DELETE_PLACE_TITLE}
        message={`Remove "${modalState.title}" from your saved places?`}
        onCancel={() => setDeleteConfirmationVisible(false)}
        onConfirm={confirmDeletePlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  filters: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    gap: SPACING.xs,
  },
  filterChip: {
    minHeight: 34,
    justifyContent: 'center',
    marginRight: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primaryContainer,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: COLORS.primary,
  },
  statusBarSurface: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.appBarSurface,
  },
  locationNotice: {
    position: 'absolute',
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

/**
 * @param {{ label: string, selected: boolean, onPress: () => void }} props
 */
function FilterChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.filterChip, selected && styles.filterChipSelected]}
    >
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}