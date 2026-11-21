import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  copyPhotoToPlaceStorage,
  deletePlacePhotoFiles,
} from '../api/placePhotos';
import { MAX_PLACE_PHOTOS } from '../constants/placePhotos.mjs';
import { COLORS, FONT_SIZE, ICON_SIZE, RADII, SPACING } from '../constants/theme';

/**
 * @param {{
 *   placeId: number,
 *   photos: string[],
 *   onPhotosChange?: (photos: string[]) => Promise<void>,
 *   editable?: boolean
 * }} props
 */
export default function PlacePhotoGallery({
  placeId,
  photos,
  onPhotosChange,
  editable = true,
}) {
  const [viewingPhoto, setViewingPhoto] = useState(
    /** @type {string | null} */ (null)
  );
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const insets = useSafeAreaInsets();

  /** @param {'camera' | 'library'} source */
  const addPhoto = async (source) => {
    const changePhotos = onPhotosChange;
    if (!changePhotos) return;

    setBusy(true);
    setErrorMessage('');

    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Photo access permission was not granted.');
      }

      const picker = source === 'camera'
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await picker({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: source === 'camera',
      });
      if (result.canceled || !result.assets?.[0]) return;

      const savedUri = await copyPhotoToPlaceStorage(result.assets[0], placeId);
      try {
        await changePhotos([...photos, savedUri]);
      } catch (error) {
        try {
          await deletePlacePhotoFiles([savedUri]);
        } catch (cleanupError) {
          console.error('Failed to clean up an unsaved place photo:', cleanupError);
        }
        throw error;
      }
    } catch (error) {
      console.error(`Failed to add a place photo using ${source}:`, error);
      setErrorMessage('Could not add this photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const requestPhotoSource = () => {
    Alert.alert('Add photo', 'Choose where to get a photo.', [
      { text: 'Photo library', onPress: () => addPhoto('library') },
      { text: 'Camera', onPress: () => addPhoto('camera') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  /** @param {string} uri */
  const removePhoto = async (uri) => {
    const changePhotos = onPhotosChange;
    if (!changePhotos) return;

    setBusy(true);
    setErrorMessage('');
    try {
      await changePhotos(photos.filter((photo) => photo !== uri));
    } catch (error) {
      console.error('Failed to remove a place photo:', error);
      setErrorMessage(
        error instanceof Error && 'photosUpdated' in error && error.photosUpdated
        ? 'Photo removed, but its local file could not be cleaned up.'
        : 'Could not remove this photo. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Photos ({photos.length}/{MAX_PLACE_PHOTOS})</Text>
        {editable && onPhotosChange && photos.length < MAX_PLACE_PHOTOS ? (
          <TouchableOpacity
            accessibilityRole="button"
            disabled={busy}
            onPress={requestPhotoSource}
            style={styles.addButton}
          >
            <MaterialIcons name="add-a-photo" size={ICON_SIZE.small} color={COLORS.primary} />
            <Text style={styles.addButtonLabel}>Add</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {photos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
          {photos.map((uri) => (
            <View key={uri} style={styles.photoItem}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open photo"
                onPress={() => setViewingPhoto(uri)}
              >
                <Image source={{ uri }} style={styles.thumbnail} />
              </TouchableOpacity>
              {editable && onPhotosChange ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Remove photo"
                  disabled={busy}
                  onPress={() => removePhoto(uri)}
                  style={styles.removeButton}
                >
                  <MaterialIcons name="close" size={ICON_SIZE.small} color={COLORS.white} />
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : editable ? null : <Text style={styles.emptyMessage}>No photos added yet.</Text>}
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      <Modal
        animationType="fade"
        statusBarTranslucent
        transparent
        visible={Boolean(viewingPhoto)}
        onRequestClose={() => setViewingPhoto(null)}
      >
        <Pressable style={styles.viewer} onPress={() => setViewingPhoto(null)}>
          {viewingPhoto ? (
            <Image source={{ uri: viewingPhoto }} resizeMode="contain" style={styles.fullImage} />
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Close photo"
            onPress={() => setViewingPhoto(null)}
            style={[styles.closeViewer, { top: Math.max(insets.top, SPACING.widest) }]}
          >
            <MaterialIcons name="close" size={ICON_SIZE.medium} color={COLORS.white} />
          </TouchableOpacity>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: COLORS.textSubtle,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryContainer,
  },
  addButtonLabel: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
  },
  photoList: {
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  photoItem: {
    position: 'relative',
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.raisedSurface,
  },
  removeButton: {
    position: 'absolute',
    top: -SPACING.xs,
    right: -SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
  },
  error: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.small,
    marginTop: SPACING.xs,
  },
  emptyMessage: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.body,
    paddingVertical: SPACING.md,
  },
  viewer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeViewer: {
    position: 'absolute',
    right: SPACING.xl,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
});
