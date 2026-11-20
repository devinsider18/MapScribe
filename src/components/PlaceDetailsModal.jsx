import { MaterialIcons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PLACE_PROGRESS_LABELS } from '../constants/placeProgress.mjs';
import { COLORS, FONT_SIZE, ICON_SIZE, RADII, SPACING } from '../constants/theme';
import ListCategoryIcon from './ListCategoryIcon';
import PlacePhotoGallery from './PlacePhotoGallery';

/**
 * @param {{
 *   place: object | null,
 *   category: object | null,
 *   onClose: () => void,
 *   onEdit: () => void
 * }} props
 */
export default function PlaceDetailsModal({ place, category, onClose, onEdit }) {
  const insets = useSafeAreaInsets();
  if (!place) return null;

  return (
    <Modal
      animationType="fade"
      transparent
      visible
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, SPACING.md),
            paddingBottom: Math.max(insets.bottom, SPACING.md),
          },
        ]}
        onPress={onClose}
      >
        <Pressable style={styles.content} onPress={(event) => event.stopPropagation()}>
          <View style={styles.heading}>
            <View style={[styles.categoryIcon, { backgroundColor: category?.bg }]}>
              {category ? (
                <ListCategoryIcon
                  category={category}
                  size={ICON_SIZE.medium}
                  color={category.color}
                />
              ) : null}
            </View>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{place.title}</Text>
              {category ? <Text style={styles.categoryName}>{category.label}</Text> : null}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close place details"
              onPress={onClose}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={ICON_SIZE.medium} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.progress}>
            <MaterialIcons name="track-changes" size={ICON_SIZE.small} color={COLORS.primary} />
            <Text style={styles.progressText}>
              {PLACE_PROGRESS_LABELS[place.progress] || PLACE_PROGRESS_LABELS.unvisited}
            </Text>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <PlacePhotoGallery
              placeId={place.id}
              photos={place.photos ?? []}
              editable={false}
            />
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onEdit}
              style={styles.editButton}
            >
              <MaterialIcons name="edit" size={ICON_SIZE.small} color={COLORS.white} />
              <Text style={styles.editButtonText}>Edit place</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.modalScrim,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    flexShrink: 1,
    padding: SPACING.xl,
    borderRadius: RADII.xl,
    backgroundColor: COLORS.dialogSurface,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.control,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.title,
    fontWeight: '700',
  },
  categoryName: {
    marginTop: SPACING.xxs,
    color: COLORS.textMuted,
    fontSize: FONT_SIZE.small,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.raisedSurface,
  },
  progress: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primaryContainer,
  },
  progressText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.small,
    fontWeight: '600',
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: 0,
    marginTop: SPACING.lg,
  },
  actions: {
    alignItems: 'flex-end',
    marginTop: SPACING.md,
  },
  editButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.primary,
  },
  editButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.body,
    fontWeight: '600',
  },
});
