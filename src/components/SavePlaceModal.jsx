import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIST_CATEGORIES } from '../constants/listCategories';
import { ACTION_LABELS } from '../constants/messages.mjs';
import { COLORS, ICON_SIZE } from '../constants/theme';
import DatePickerField from './DatePickerField';
import { PLACE_PROGRESS, PLACE_PROGRESS_LABELS, PLACE_PROGRESS_ORDER } from '../constants/placeProgress.mjs';
import ListCategoryIcon from './ListCategoryIcon';
import PlacePhotoGallery from './PlacePhotoGallery';
import styles from './SavePlaceModal.styles';

/**
 * @param {{
 *   visible: boolean,
 *   title: string,
 *   selectedListType: string,
 *   errorMessage: string,
 *   isEditing: boolean,
 *   onTitleChange: (title: string) => void,
 *   onListTypeChange: (listType: string) => void,
 *   onClose: () => void,
 *   onSave: () => void,
 *   onDelete: () => void,
 *   placeId?: number | null,
 *   photos?: string[],
 *   progress?: import('../types/domain').PlaceProgress,
 *   onPhotosChange?: (photos: string[]) => Promise<void>,
 *   onProgressChange?: (progress: import('../types/domain').PlaceProgress) => void,
 *   notes?: string,
 *   visitedAt?: string,
 *   onNotesChange?: (notes: string) => void,
 *   onVisitedAtChange?: (visitedAt: string) => void,
 *   listCategories?: Array<{
 *     id: string,
 *     label: string,
 *     icon: import('react').ComponentProps<typeof import('@expo/vector-icons').MaterialIcons>['name'],
 *     color: string,
 *     bg: string,
 *     emoji?: string | null
 *   }>
 * }} props
 */
export default function SavePlaceModal({
  visible,
  title,
  selectedListType,
  errorMessage,
  isEditing,
  onTitleChange,
  onListTypeChange,
  onClose,
  onSave,
  onDelete,
  placeId = null,
  photos = [],
  progress = PLACE_PROGRESS.unvisited,
  onPhotosChange,
  onProgressChange,
  notes = '',
  visitedAt = '',
  onNotesChange,
  onVisitedAtChange,
  listCategories = LIST_CATEGORIES,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.modalOverlay,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.modalTitle}>{isEditing ? 'Edit Place' : 'Save Place'}</Text>
          <Text style={styles.modalSubtitle}>
            {isEditing
              ? 'Update the name or list for this place.'
              : 'Add custom name and choose a list for this location.'}
          </Text>

          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={styles.modalBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={styles.input}
              placeholder="Place name (e.g., Best Coffee)"
              placeholderTextColor={COLORS.placeholder}
              value={title}
              onChangeText={onTitleChange}
              autoFocus={!isEditing}
            />

            <Text style={styles.sectionLabel}>Personal note</Text>
            <TextInput
              accessibilityLabel="Personal note"
              multiline
              numberOfLines={3}
              placeholder="What should you remember about this place?"
              placeholderTextColor={COLORS.placeholder}
              value={notes}
              onChangeText={onNotesChange}
              style={[styles.input, styles.notesInput]}
            />
            <Text style={styles.sectionLabel}>Visit date (optional)</Text>
            <DatePickerField
              label="Visit date"
              value={visitedAt}
              onChangeText={onVisitedAtChange}
              allowClear
            />

            <Text style={styles.sectionLabel}>Select List</Text>
            <View style={styles.categoriesContainer}>
              {listCategories.map((category) => {
                const isSelected = selectedListType === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: category.bg },
                      isSelected && styles.categoryChipSelected,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => onListTypeChange(category.id)}
                  >
                    <ListCategoryIcon
                      category={category}
                      size={ICON_SIZE.chip}
                      color={category.color}
                      style={styles.categoryIcon}
                    />
                    <Text style={[styles.categoryChipText, { color: category.color }]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isEditing && placeId !== null && onPhotosChange ? (
              <PlacePhotoGallery
                placeId={placeId}
                photos={photos}
                onPhotosChange={onPhotosChange}
              />
            ) : null}

            {isEditing && onProgressChange ? (
              <View style={styles.progressSection}>
                <Text style={styles.sectionLabel}>Progress</Text>
                <View style={styles.progressOptions}>
                  {PLACE_PROGRESS_ORDER.map((option) => (
                    <TouchableOpacity
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: progress === option }}
                      onPress={() => onProgressChange(option)}
                      style={[
                        styles.progressOption,
                        progress === option && styles.progressOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.progressOptionText,
                          progress === option && styles.progressOptionTextSelected,
                        ]}
                      >
                        {PLACE_PROGRESS_LABELS[option]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
          <View style={styles.modalButtons}>
            {isEditing ? (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                accessibilityRole="button"
                onPress={onDelete}
              >
                <Text style={styles.deleteButtonText}>{ACTION_LABELS.delete}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              accessibilityRole="button"
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{ACTION_LABELS.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              accessibilityRole="button"
              onPress={onSave}
            >
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Save changes' : ACTION_LABELS.save}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
