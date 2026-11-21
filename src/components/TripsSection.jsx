import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatPlaceDate, parsePlaceDate } from '../constants/placeDates.mjs';
import { COLORS, ICON_SIZE, INPUT_LIMITS, SPACING } from '../constants/theme';
import ConfirmDialog from './ConfirmDialog';
import DatePickerField from './DatePickerField';
import styles from './SavedListsPanel.styles';

/**
 * @param {{
 *   trips: ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'],
 *   markers: ReturnType<typeof import('../hooks/useSavedMarkers').default>['markers'],
 *   createTrip: (trip: { name: string, startDate: string, endDate: string }) => ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'][number],
 *   updateTrip: (id: number, trip: { name: string, startDate: string, endDate: string }) => void,
 *   deleteTrip: (id: number) => void,
 *   updateTripStops: (id: number, markerIds: number[]) => void,
 *   onDismiss: () => void,
 *   onDragStart: () => void,
 *   onDrag: (distance: number) => void,
 *   onDragEnd: (distance: number, velocity: number) => void,
 *   onFocusPlace: (
 *     place: ReturnType<typeof import('../hooks/useSavedMarkers').default>['markers'][number]
 *   ) => void
 * }} props
 */
export default function TripsSection({
  trips,
  markers,
  createTrip,
  updateTrip,
  deleteTrip,
  updateTripStops,
  onDismiss,
  onDragStart,
  onDrag,
  onDragEnd,
  onFocusPlace,
}) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTrip, setEditingTrip] = useState(
    /** @type {ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'][number] | null} */ (null)
  );
  const [expandedTripId, setExpandedTripId] = useState(
    /** @type {number | null} */ (null)
  );
  const [tripName, setTripName] = useState('');
  const [startDateText, setStartDateText] = useState('');
  const [endDateText, setEndDateText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [tripToDelete, setTripToDelete] = useState(
    /** @type {ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'][number] | null} */ (null)
  );
  const insets = useSafeAreaInsets();
  const dismissResponder = PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_event, { dx, dy }) => (
      dy > 8 && Math.abs(dy) > Math.abs(dx)
    ),
    onMoveShouldSetPanResponder: (_event, { dx, dy }) => (
      dy > 8 && Math.abs(dy) > Math.abs(dx)
    ),
    onPanResponderGrant: onDragStart,
    onPanResponderMove: (_event, { dy }) => onDrag(dy),
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: (_event, { dy, vy }) => onDragEnd(dy, vy),
    onPanResponderTerminate: (_event, { dy, vy }) => onDragEnd(dy, vy),
  });

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingTrip(null);
    setErrorMessage('');
  };

  const openNewTrip = () => {
    setEditingTrip(null);
    setTripName('');
    setStartDateText('');
    setEndDateText('');
    setErrorMessage('');
    setDialogVisible(true);
  };

  /**
   * @param {ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'][number]} trip
   */
  const openEditTrip = (trip) => {
    setEditingTrip(trip);
    setTripName(trip.name);
    setStartDateText(formatPlaceDate(trip.startDate));
    setEndDateText(formatPlaceDate(trip.endDate));
    setErrorMessage('');
    setDialogVisible(true);
  };

  const saveTrip = () => {
    const startDate = parsePlaceDate(startDateText);
    const endDate = parsePlaceDate(endDateText);
    if (!startDate || !endDate) {
      setErrorMessage('Enter both dates as DD.MM.YYYY.');
      return;
    }

    try {
      const trip = { name: tripName, startDate, endDate };
      if (editingTrip) {
        updateTrip(editingTrip.id, trip);
      } else {
        const createdTrip = createTrip(trip);
        setExpandedTripId(createdTrip.id);
      }
      closeDialog();
    } catch (error) {
      console.error('Failed to save trip:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Could not save this trip.');
    }
  };

  /**
   * @param {ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'][number]} trip
   */
  const requestDeleteTrip = (trip) => {
    setTripToDelete(trip);
  };

  const confirmDeleteTrip = () => {
    if (!tripToDelete) return;
    try {
      deleteTrip(tripToDelete.id);
      setTripToDelete(null);
    } catch (error) {
      console.error('Failed to delete trip:', error);
      setTripToDelete(null);
      Alert.alert('Could not delete trip', 'Please try again.');
    }
  };

  /**
   * @param {ReturnType<typeof import('../hooks/useSavedMarkers').default>['trips'][number]} trip
   * @param {number[]} markerIds
   */
  const changeStops = (trip, markerIds) => {
    try {
      updateTripStops(trip.id, markerIds);
    } catch (error) {
      console.error('Failed to change trip stops:', error);
      Alert.alert('Could not update stops', 'Please try again.');
    }
  };

  return (
    <View style={styles.tripPanel}>
      <View {...dismissResponder.panHandlers}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close trip plans"
          onPress={onDismiss}
          style={styles.tripHandleArea}
        >
          <View style={styles.handle} />
        </TouchableOpacity>
        <View style={styles.tripSectionHeader}>
          <View>
            <Text style={styles.tripSectionTitle}>Trip plans</Text>
            <Text style={styles.tripSectionSubtitle}>
              Plan your journey and organize its stops.
            </Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={openNewTrip}
            style={styles.tripCreateButton}
          >
            <MaterialIcons name="add" size={ICON_SIZE.small} color={COLORS.primary} />
            <Text style={styles.tripCreateText}>New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.tripList}
        contentContainerStyle={styles.tripListContent}
        keyboardShouldPersistTaps="handled"
      >
      {trips.length ? trips.map((trip) => {
        const expanded = expandedTripId === trip.id;
        const stops = trip.markerIds.flatMap((id) => {
          const place = markers.find((marker) => marker.id === id);
          return place ? [place] : [];
        });

        return (
          <View key={trip.id} style={styles.tripCard}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setExpandedTripId(expanded ? null : trip.id)}
              style={styles.tripCardHeader}
            >
              <View style={styles.tripCardInfo}>
                <Text style={styles.tripCardName}>{trip.name}</Text>
                <Text style={styles.tripCardDates}>
                  {formatPlaceDate(trip.startDate)} – {formatPlaceDate(trip.endDate)}
                  {' · '}{stops.length} {stops.length === 1 ? 'stop' : 'stops'}
                </Text>
              </View>
              <MaterialIcons
                name={expanded ? 'expand-less' : 'expand-more'}
                size={ICON_SIZE.medium}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            <View style={styles.tripActions}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => openEditTrip(trip)}
                style={styles.tripActionButton}
              >
                <Text style={styles.tripActionText}>Edit trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => requestDeleteTrip(trip)}
                style={styles.tripActionButton}
              >
                <Text style={styles.tripDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
            {expanded ? (
              <View style={styles.tripStops}>
                {stops.map((place, index) => (
                  <View key={place.id} style={styles.tripStopRow}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={() => onFocusPlace(place)}
                      style={styles.tripStopName}
                    >
                      <Text style={styles.tripStopText}>
                        {index + 1}. {place.title}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${place.title} up`}
                      disabled={index === 0}
                      onPress={() => {
                        const next = [...trip.markerIds];
                        [next[index - 1], next[index]] = [next[index], next[index - 1]];
                        changeStops(trip, next);
                      }}
                      style={styles.tripOrderButton}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-up"
                        size={ICON_SIZE.medium}
                        color={index === 0 ? COLORS.placeholder : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move ${place.title} down`}
                      disabled={index === stops.length - 1}
                      onPress={() => {
                        const next = [...trip.markerIds];
                        [next[index], next[index + 1]] = [next[index + 1], next[index]];
                        changeStops(trip, next);
                      }}
                      style={styles.tripOrderButton}
                    >
                      <MaterialIcons
                        name="keyboard-arrow-down"
                        size={ICON_SIZE.medium}
                        color={index === stops.length - 1 ? COLORS.placeholder : COLORS.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${place.title} from trip`}
                      onPress={() => changeStops(
                        trip,
                        trip.markerIds.filter((id) => id !== place.id)
                      )}
                      style={styles.tripOrderButton}
                    >
                      <MaterialIcons name="close" size={ICON_SIZE.small} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
                {!stops.length ? (
                  <Text style={styles.tripEmpty}>No stops added yet.</Text>
                ) : null}
                <Text style={styles.tripStopsLabel}>Add saved places</Text>
                {markers.map((place) => {
                  const included = trip.markerIds.includes(place.id);
                  return (
                    <TouchableOpacity
                      key={place.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: included }}
                      onPress={() => changeStops(
                        trip,
                        included
                          ? trip.markerIds.filter((id) => id !== place.id)
                          : [...trip.markerIds, place.id]
                      )}
                      style={styles.tripPlacePickerRow}
                    >
                      <MaterialIcons
                        name={included ? 'check-box' : 'check-box-outline-blank'}
                        size={ICON_SIZE.small}
                        color={included ? COLORS.primary : COLORS.textMuted}
                      />
                      <Text style={styles.tripPickerName} numberOfLines={1}>{place.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        );
      }) : (
        <Text style={styles.tripEmpty}>No trip plans yet. Create one to get started.</Text>
      )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent
        visible={dialogVisible}
        onRequestClose={closeDialog}
      >
        <KeyboardAvoidingView
          style={[
            styles.dialogOverlay,
            {
              paddingTop: Math.max(insets.top, SPACING.md),
              paddingBottom: Math.max(insets.bottom, SPACING.md),
            },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.dialogBackdrop} onPress={closeDialog} />
          <Pressable
            style={styles.dialogContent}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.dialogTitle}>{editingTrip ? 'Edit trip' : 'Create trip'}</Text>
            <TextInput
              maxLength={INPUT_LIMITS.listName}
              placeholder="Trip name"
              placeholderTextColor={COLORS.placeholder}
              value={tripName}
              onChangeText={setTripName}
              style={styles.dialogNameInput}
            />
            <Text style={styles.tripDateLabel}>Start date</Text>
            <DatePickerField
              label="Trip start date"
              value={startDateText}
              onChangeText={setStartDateText}
            />
            <Text style={styles.tripDateLabel}>End date</Text>
            <DatePickerField
              label="Trip end date"
              value={endDateText}
              onChangeText={setEndDateText}
            />
            {errorMessage ? <Text style={styles.dialogError}>{errorMessage}</Text> : null}
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={closeDialog} style={styles.dialogCancelButton}>
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveTrip} style={styles.dialogSaveButton}>
                <Text style={styles.dialogSaveText}>{editingTrip ? 'Save' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
      <ConfirmDialog
        visible={Boolean(tripToDelete)}
        title="Delete trip?"
        message={tripToDelete
          ? `Delete "${tripToDelete.name}"? Saved places will not be deleted.`
          : ''}
        onCancel={() => setTripToDelete(null)}
        onConfirm={confirmDeleteTrip}
      />
    </View>
  );
}
