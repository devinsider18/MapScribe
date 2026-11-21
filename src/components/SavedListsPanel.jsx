import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Pressable,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ACTION_LABELS,
  DEFAULT_PLACE_TITLE,
  DELETE_PLACE_FAILURE,
  DELETE_PLACE_TITLE,
  DUPLICATE_LIST_NAME,
  LIST_NAME_REQUIRED,
} from '../constants/messages.mjs';
import {
  getNextPlaceProgress,
  PLACE_PROGRESS_LABELS,
} from '../constants/placeProgress.mjs';
import { LIST_COLOR_OPTIONS } from '../constants/listColors.mjs';
import { formatPlaceDate, parsePlaceDate } from '../constants/placeDates.mjs';
import { COLORS, ICON_SIZE, INPUT_LIMITS, SPACING } from '../constants/theme';
import ListCategoryIcon from './ListCategoryIcon';
import ListColorPicker from './ListColorPicker';
import ListEmojiPicker from './ListEmojiPicker';
import PlacePhotoGallery from './PlacePhotoGallery';
import SavePlaceModal from './SavePlaceModal';
import ConfirmDialog from './ConfirmDialog';
import styles from './SavedListsPanel.styles';

/** @typedef {ReturnType<typeof import('../hooks/useSavedMarkers').default>['markers'][number]} SavedPlace */
/** @typedef {ReturnType<typeof import('../hooks/useSavedMarkers').default>['listCategories'][number]} SavedListCategory */
/** @typedef {{ id: string, label: string, color: string, bg: string }} ListColorOption */

/**
 * @param {{
 *   savedPlaces: ReturnType<typeof import('../hooks/useSavedMarkers').default>,
 *   filters: { listType: string, progress: string },
 *   onFocusPlace: (
 *     place: ReturnType<typeof import('../hooks/useSavedMarkers').default>['markers'][number]
 *   ) => void,
 *   onDismiss: () => void,
 *   onDragStart: () => void,
 *   onDrag: (distance: number) => void,
 *   onDragEnd: (distance: number, velocity: number) => void
 * }} props
 */
export default function SavedListsPanel({
  savedPlaces,
  filters,
  onFocusPlace,
  onDismiss,
  onDragStart,
  onDrag,
  onDragEnd,
}) {
  const {
    markers,
    listCategories,
    loadError,
    createSavedList,
    reloadSavedMarkers,
    updateSavedMarker,
    updateSavedMarkerPhotos,
    updateSavedMarkerProgress,
    updateSavedListIcon,
    deleteSavedMarker,
    renameSavedList,
    deleteSavedList,
  } = savedPlaces;
  const [searchQuery, setSearchQuery] = useState('');
  const [editingList, setEditingList] = useState(
    /** @type {SavedListCategory | null} */ (null)
  );
  const [listNameDraft, setListNameDraft] = useState('');
  const [listNameError, setListNameError] = useState('');
  const [expandedList, setExpandedList] = useState(
    /** @type {string | null} */ (null)
  );
  const [editingPlace, setEditingPlace] = useState(
    /** @type {SavedPlace | null} */ (null)
  );
  const [editError, setEditError] = useState('');
  const [createListVisible, setCreateListVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('');
  const [newListColor, setNewListColor] = useState(
    /** @type {ListColorOption | null} */ (null)
  );
  const [createListError, setCreateListError] = useState('');
  const [iconListId, setIconListId] = useState(
    /** @type {string | null} */ (null)
  );
  const [iconDraft, setIconDraft] = useState('');
  const [iconColorDraft, setIconColorDraft] = useState(
    /** @type {ListColorOption | null} */ (null)
  );
  const [iconError, setIconError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(
    /** @type {{ title: string, message: string, onConfirm: () => void } | null} */ (null)
  );
  const iconList = listCategories.find((category) => category.id === iconListId);
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

  useEffect(() => {
    reloadSavedMarkers();
  }, [reloadSavedMarkers]);

  const closeEditor = () => {
    setEditingPlace(null);
    setEditError('');
  };

  const closeCreateList = () => {
    setCreateListVisible(false);
    setNewListName('');
    setNewListEmoji('');
    setNewListColor(null);
    setCreateListError('');
  };

  const saveListName = () => {
    if (!editingList) return;
    try {
      renameSavedList(editingList.id, listNameDraft);
      setEditingList(null);
      setListNameError('');
    } catch (error) {
      if (error instanceof Error && error.message === DUPLICATE_LIST_NAME) {
        setListNameError(DUPLICATE_LIST_NAME);
        return;
      }
      console.error('Failed to rename saved list:', error);
      setListNameError('Could not rename this list. Please try again.');
    }
  };

  /** @param {SavedListCategory} category */
  const requestDeleteList = (category) => {
    if (markers.some((marker) => marker.listType === category.id)) {
      Alert.alert(
        'List is not empty',
        'Move or remove all places from this list before deleting it.'
      );
      return;
    }

    setDeleteDialog({
      title: 'Delete empty list?',
      message: `Delete "${category.label}"? This list must be empty.`,
      onConfirm: () => {
        try {
          deleteSavedList(category.id);
        } catch (error) {
          console.error('Failed to delete saved list:', error);
          Alert.alert(
            'Could not delete list',
            'Move or remove all places from this list, then try again.'
          );
        }
      },
    });
  };

  const handleCreateList = () => {
    const name = newListName.trim();
    if (!name) {
      setCreateListError(LIST_NAME_REQUIRED);
      return;
    }

    /** @type {SavedListCategory} */
    let newList;
    try {
      newList = createSavedList(name);
    } catch (error) {
      if (error instanceof Error && error.message === DUPLICATE_LIST_NAME) {
        setCreateListError(DUPLICATE_LIST_NAME);
        return;
      }

      console.error('Failed to create saved list:', error);
      setCreateListError('Could not create this list. Please try again.');
      return;
    }

    if (newListEmoji.trim()) {
      try {
        updateSavedListIcon(newList.id, newListEmoji.trim());
      } catch (error) {
        console.error('Failed to save the new list icon:', error);
        Alert.alert('List created', 'The list was created, but its emoji could not be saved.');
      }
    }

    if (newListColor) {
      try {
        savedPlaces.updateSavedListColor(newList.id, newListColor);
      } catch (error) {
        console.error('Failed to save the new list color:', error);
        Alert.alert('List created', 'The list was created, but its color could not be saved.');
      }
    }

    setExpandedList(newList.id);
    closeCreateList();
  };

  const handleSaveListAppearance = () => {
    if (!iconListId) return;

    try {
      updateSavedListIcon(iconListId, iconDraft.trim() || null);
      savedPlaces.updateSavedListColor(iconListId, iconColorDraft);
      setIconListId(null);
      setIconError('');
    } catch (error) {
      console.error('Failed to update saved list appearance:', error);
      setIconError('Could not update this list. Please try again.');
    }
  };

  const saveEditedPlace = () => {
    if (!editingPlace) return;
    const visitedAtText = editingPlace.visitedAt ?? '';
    const visitedAt = parsePlaceDate(visitedAtText);
    if (visitedAtText.trim() && !visitedAt) {
      setEditError('Enter the date as DD.MM.YYYY.');
      return;
    }

    try {
      updateSavedMarker(
        editingPlace.id,
        editingPlace.coordinate,
        editingPlace.title.trim() || DEFAULT_PLACE_TITLE,
        editingPlace.listType,
        editingPlace.photos,
        editingPlace.progress,
        editingPlace.notes,
        visitedAt
      );
      closeEditor();
    } catch (error) {
      console.error('Failed to update saved place:', error);
      setEditError('Could not update this place. Please try again.');
    }
  };

  /** @param {SavedPlace} place */
  const requestDeletePlace = (place) => {
    setDeleteDialog({
      title: DELETE_PLACE_TITLE,
      message: `Remove "${place.title}" from your saved places?`,
      onConfirm: async () => {
        try {
          await deleteSavedMarker(place.id);
          if (editingPlace?.id === place.id) closeEditor();
        } catch (error) {
          console.error('Failed to delete saved place:', error);
          if (error instanceof Error && 'placeDeleted' in error && error.placeDeleted) {
            if (editingPlace?.id === place.id) closeEditor();
            Alert.alert('Place deleted', 'Some attached photo files could not be removed.');
            return;
          }
          if (editingPlace?.id === place.id) {
            setEditError(DELETE_PLACE_FAILURE);
          } else {
            Alert.alert('Could not delete place', 'Please try again.');
          }
        }
      },
    });
  };

  return (
    <View style={styles.panel}>
      <View {...dismissResponder.panHandlers}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close lists"
          onPress={onDismiss}
          style={styles.handleArea}
        >
          <View style={styles.handle} />
        </TouchableOpacity>
        <Text style={styles.title}>Your lists</Text>
        <Text style={styles.subtitle}>Saved places, organized your way.</Text>
      </View>

      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={ICON_SIZE.medium} color={COLORS.textMuted} />
        <TextInput
          accessibilityLabel="Search saved places"
          placeholder="Search your places or notes"
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          setCreateListError('');
          setCreateListVisible(true);
        }}
        style={styles.createListButton}
      >
        <MaterialIcons name="add" size={ICON_SIZE.action} color={COLORS.textPrimary} />
        <Text style={styles.createListButtonText}>New list</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {listCategories.filter((category) => {
          if (filters.listType !== 'all' && filters.listType !== category.id) return false;
          const query = searchQuery.trim().toLocaleLowerCase();
          return !query || markers.some((marker) => (
            marker.listType === category.id
            && (filters.progress === 'all' || marker.progress === filters.progress)
            && `${marker.title} ${marker.notes}`.toLocaleLowerCase().includes(query)
          ));
        }).map((category) => {
          const query = searchQuery.trim().toLocaleLowerCase();
          const places = markers.filter((marker) => (
            marker.listType === category.id
            && (filters.progress === 'all' || marker.progress === filters.progress)
            && (
              !query
              || `${marker.title} ${marker.notes}`.toLocaleLowerCase().includes(query)
            )
          ));
          const isExpanded = query ? places.length > 0 : expandedList === category.id;
          const isCustom = category.id.startsWith('custom_');

          return (
            <SavedListCard
              key={category.id}
              category={category}
              places={places}
              listHasPlaces={markers.some((marker) => marker.listType === category.id)}
              expanded={isExpanded}
              onToggle={() => setExpandedList(isExpanded ? null : category.id)}
              onChangeIcon={() => {
                setIconError('');
                setIconListId(category.id);
                setIconDraft(category.emoji || '');
                setIconColorDraft(
                  LIST_COLOR_OPTIONS.find((option) => (
                    option.color === category.color && option.bg === category.bg
                  )) || null
                );
              }}
              isCustom={isCustom}
              onRename={() => {
                setEditingList(category);
                setListNameDraft(category.label);
                setListNameError('');
              }}
              onDelete={() => requestDeleteList(category)}
              onEditPlace={(place) => {
                setEditError('');
                setEditingPlace(place);
              }}
              onProgressChange={(place) => {
                try {
                  updateSavedMarkerProgress(
                    place.id,
                    getNextPlaceProgress(place.progress)
                  );
                } catch (error) {
                  console.error('Failed to update place progress:', error);
                  Alert.alert('Could not update place', 'Please try again.');
                }
              }}
              onPhotosChange={async (place, photos) => {
                try {
                  await updateSavedMarkerPhotos(place.id, photos);
                } catch (error) {
                  if (error instanceof Error && 'photosUpdated' in error && error.photosUpdated) {
                    Alert.alert(
                      'Photo removed',
                      'The photo was removed, but its local file could not be deleted.'
                    );
                  }
                  throw error;
                }
              }}
              onDeletePlace={requestDeletePlace}
              onFocusPlace={onFocusPlace}
            />
          );
        })}
        {searchQuery.trim() && !markers.some((marker) => {
          const query = searchQuery.trim().toLocaleLowerCase();
          return (filters.listType === 'all' || marker.listType === filters.listType)
            && (filters.progress === 'all' || marker.progress === filters.progress)
            && `${marker.title} ${marker.notes}`.toLocaleLowerCase().includes(query);
        }) ? (
          <Text style={styles.cardEmptyList}>No saved places match this search.</Text>
        ) : null}
      </ScrollView>
      <EditSavedPlaceDialog
        place={editingPlace}
        errorMessage={editError}
        listCategories={listCategories}
        notes={editingPlace?.notes ?? ''}
        visitedAt={formatPlaceDate(editingPlace?.visitedAt)}
        onPhotosChange={async (photos) => {
          if (!editingPlace) return;
          try {
            await updateSavedMarkerPhotos(editingPlace.id, photos);
          } catch (error) {
            if (error instanceof Error && 'photosUpdated' in error && error.photosUpdated) {
              setEditingPlace((place) => (place ? { ...place, photos } : place));
            }
            throw error;
          }
          setEditingPlace((place) => (place ? { ...place, photos } : place));
        }}
        onProgressChange={(progress) => {
          if (!editingPlace) return;
          try {
            updateSavedMarkerProgress(editingPlace.id, progress);
            setEditingPlace((place) => (place ? { ...place, progress } : place));
          } catch (error) {
            console.error('Failed to update place progress:', error);
            setEditError('Could not update this place. Please try again.');
          }
        }}
        onNotesChange={(notes) => setEditingPlace((place) => (
          place ? { ...place, notes } : place
        ))}
        onVisitedAtChange={(visitedAt) => setEditingPlace((place) => (
          place ? { ...place, visitedAt } : place
        ))}
        onTitleChange={(title) => setEditingPlace((place) => (
          place ? { ...place, title } : place
        ))}
        onListTypeChange={(listType) => setEditingPlace((place) => (
          place ? { ...place, listType } : place
        ))}
        onClose={closeEditor}
        onSave={saveEditedPlace}
        onDelete={() => editingPlace && requestDeletePlace(editingPlace)}
      />
      <ConfirmDialog
        visible={Boolean(deleteDialog)}
        title={deleteDialog?.title ?? ''}
        message={deleteDialog?.message ?? ''}
        onCancel={() => setDeleteDialog(null)}
        onConfirm={() => {
          const confirm = deleteDialog?.onConfirm;
          setDeleteDialog(null);
          confirm?.();
        }}
      />
      <EditListNameDialog
        visible={Boolean(editingList)}
        name={listNameDraft}
        errorMessage={listNameError}
        onNameChange={(name) => {
          setListNameDraft(name);
          setListNameError('');
        }}
        onClose={() => {
          setEditingList(null);
          setListNameError('');
        }}
        onSave={saveListName}
      />
      <CreateListDialog
        visible={createListVisible}
        name={newListName}
        emoji={newListEmoji}
        selectedColorId={newListColor?.id ?? null}
        onColorChange={setNewListColor}
        errorMessage={createListError}
        onNameChange={(name) => {
          setNewListName(name);
          setCreateListError('');
        }}
        onEmojiChange={setNewListEmoji}
        onClose={closeCreateList}
        onCreate={handleCreateList}
      />
      <EditListIconDialog
        list={iconList}
        emoji={iconDraft}
        selectedColorId={iconColorDraft?.id ?? null}
        errorMessage={iconError}
        onEmojiChange={setIconDraft}
        onColorChange={setIconColorDraft}
        onClose={() => setIconListId(null)}
        onSave={handleSaveListAppearance}
      />
    </View>
  );
}
/**
 * @param {{
 *   category: SavedListCategory,
 *   places: SavedPlace[],
 *   listHasPlaces: boolean,
 *   expanded: boolean,
 *   onToggle: () => void,
 *   onChangeIcon: () => void,
 *   onEditPlace: (place: SavedPlace) => void,
 *   onProgressChange: (place: SavedPlace) => void,
 *   onPhotosChange: (place: SavedPlace, photos: string[]) => Promise<void>,
 *   onDeletePlace: (place: SavedPlace) => void,
 *   isCustom: boolean,
 *   onRename: () => void,
 *   onDelete: () => void,
 *   onFocusPlace: (place: SavedPlace) => void
 * }} props
 */
function SavedListCard({
  category,
  places,
  listHasPlaces,
  expanded,
  onToggle,
  onChangeIcon,
  onEditPlace,
  onProgressChange,
  onPhotosChange,
  onDeletePlace,
  isCustom,
  onRename,
  onDelete,
  onFocusPlace,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={onToggle}
          style={styles.cardHeaderMain}
        >
          <View style={[styles.cardIcon, { backgroundColor: category.bg }]}>
            <ListCategoryIcon category={category} size={22} color={category.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{category.label}</Text>
            <Text style={styles.cardCount}>
              {places.length} {places.length === 1 ? 'place' : 'places'}
            </Text>
          </View>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={24}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Change ${category.label} icon`}
          onPress={onChangeIcon}
          style={styles.cardChangeIconButton}
        >
          <MaterialIcons name="edit" size={ICON_SIZE.small} color={COLORS.textSecondary} />
        </TouchableOpacity>
        {isCustom ? (
          <>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Rename ${category.label}`}
              onPress={onRename}
              style={styles.cardChangeIconButton}
            >
              <MaterialIcons
                name="drive-file-rename-outline"
                size={ICON_SIZE.small}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Delete ${category.label}`}
              onPress={onDelete}
              style={styles.cardChangeIconButton}
            >
              <MaterialIcons
                name="delete-outline"
                size={ICON_SIZE.delete}
                color={listHasPlaces ? COLORS.placeholder : COLORS.danger}
              />
            </TouchableOpacity>
          </>
        ) : null}
      </View>

      {expanded ? (
        <View style={styles.cardPlaces}>
          {places.length ? (
            places.map((place) => (
              <View key={place.id} style={styles.placeEntry}>
                <View style={styles.cardPlaceRow}>
                  <MaterialIcons name="place" size={18} color={category.color} />
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Show ${place.title} on map`}
                    onPress={() => onFocusPlace(place)}
                    style={styles.cardPlaceNameButton}
                  >
                    <Text style={styles.cardPlaceName} numberOfLines={1}>{place.title}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Change progress for ${place.title}. Current status: ${PLACE_PROGRESS_LABELS[place.progress] || PLACE_PROGRESS_LABELS.unvisited}`}
                    onPress={() => onProgressChange(place)}
                    style={[
                      styles.progressButton,
                      place.progress === 'visited' && styles.progressVisited,
                      place.progress === 'planned' && styles.progressPlanned,
                    ]}
                  >
                    <Text style={styles.progressButtonText}>
                      {PLACE_PROGRESS_LABELS[place.progress] || PLACE_PROGRESS_LABELS.unvisited}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${place.title}`}
                    onPress={() => onEditPlace(place)}
                    style={styles.cardPlaceAction}
                  >
                    <MaterialIcons name="edit" size={ICON_SIZE.small} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${place.title}`}
                    onPress={() => onDeletePlace(place)}
                    style={styles.cardPlaceAction}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={ICON_SIZE.delete}
                      color={COLORS.danger}
                    />
                  </TouchableOpacity>
                </View>
                <PlacePhotoGallery
                  placeId={place.id}
                  photos={place.photos ?? []}
                  onPhotosChange={(photos) => onPhotosChange(place, photos)}
                />
              </View>
            ))
          ) : (
            <Text style={styles.cardEmptyList}>No places yet</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}

/**
 * @param {{
 *   place: SavedPlace | null,
 *   errorMessage: string,
 *   listCategories: SavedListCategory[],
 *   notes: string,
 *   visitedAt: string,
 *   onPhotosChange: (photos: string[]) => Promise<void>,
 *   onProgressChange: (progress: string) => void,
 *   onNotesChange: (notes: string) => void,
 *   onVisitedAtChange: (visitedAt: string) => void,
 *   onTitleChange: (title: string) => void,
 *   onListTypeChange: (listType: string) => void,
 *   onClose: () => void,
 *   onSave: () => void,
 *   onDelete: () => void
 * }} props
 */
function EditSavedPlaceDialog({
  place,
  errorMessage,
  listCategories,
  notes,
  visitedAt,
  onPhotosChange,
  onProgressChange,
  onNotesChange,
  onVisitedAtChange,
  onTitleChange,
  onListTypeChange,
  onClose,
  onSave,
  onDelete,
}) {
  return (
    <SavePlaceModal
      visible={Boolean(place)}
      title={place?.title ?? ''}
      selectedListType={place?.listType ?? ''}
      errorMessage={errorMessage}
      listCategories={listCategories}
      isEditing
      placeId={place?.id ?? null}
      photos={place?.photos ?? []}
      progress={place?.progress ?? 'unvisited'}
      notes={notes}
      visitedAt={visitedAt}
      onPhotosChange={onPhotosChange}
      onProgressChange={onProgressChange}
      onNotesChange={onNotesChange}
      onVisitedAtChange={onVisitedAtChange}
      onTitleChange={onTitleChange}
      onListTypeChange={onListTypeChange}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

/**
 * @param {{
 *   visible: boolean,
 *   name: string,
 *   errorMessage: string,
 *   onNameChange: (name: string) => void,
 *   onClose: () => void,
 *   onSave: () => void
 * }} props
 */
function EditListNameDialog({ visible, name, errorMessage, onNameChange, onClose, onSave }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
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
        <Pressable style={styles.dialogBackdrop} onPress={onClose} />
        <Pressable
          style={styles.dialogContent}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.dialogTitle}>Rename list</Text>
          <TextInput
            maxLength={INPUT_LIMITS.listName}
            placeholder="List name"
            placeholderTextColor={COLORS.placeholder}
            value={name}
            onChangeText={onNameChange}
            onSubmitEditing={onSave}
            returnKeyType="done"
            style={styles.dialogNameInput}
          />
          {errorMessage ? <Text style={styles.dialogError}>{errorMessage}</Text> : null}
          <DialogActions
            cancelLabel={ACTION_LABELS.cancel}
            saveLabel={ACTION_LABELS.save}
            onClose={onClose}
            onSave={onSave}
          />
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * @param {{
 *   visible: boolean,
 *   name: string,
 *   emoji: string,
 *   selectedColorId: string | null,
 *   onColorChange: (color: ListColorOption | null) => void,
 *   errorMessage: string,
 *   onNameChange: (name: string) => void,
 *   onEmojiChange: (emoji: string) => void,
 *   onClose: () => void,
 *   onCreate: () => void
 * }} props
 */
function CreateListDialog({
  visible,
  name,
  emoji,
  selectedColorId,
  onColorChange,
  errorMessage,
  onNameChange,
  onEmojiChange,
  onClose,
  onCreate,
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
          styles.dialogOverlay,
          {
            paddingTop: Math.max(insets.top, SPACING.md),
            paddingBottom: Math.max(insets.bottom, SPACING.md),
          },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.dialogBackdrop} onPress={onClose} />
        <Pressable
          style={styles.dialogContent}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.dialogTitle}>Create a list</Text>
          <Text style={styles.dialogSubtitle}>Give your saved places a new home.</Text>
          <ScrollView
            style={styles.dialogBody}
            contentContainerStyle={styles.dialogBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              maxLength={INPUT_LIMITS.listName}
              placeholder="List name"
              placeholderTextColor={COLORS.placeholder}
              value={name}
              onChangeText={onNameChange}
              onSubmitEditing={onCreate}
              returnKeyType="done"
              style={styles.dialogNameInput}
            />
            <Text style={styles.dialogEmojiLabel}>List icon (optional)</Text>
            <Text style={styles.dialogHint}>
              Choose a map icon.
            </Text>
            <ListEmojiPicker selectedEmoji={emoji} onEmojiChange={onEmojiChange} />
            <Text style={styles.dialogEmojiLabel}>List color (optional)</Text>
            <ListColorPicker
              selectedColorId={selectedColorId}
              onColorChange={onColorChange}
            />
            {errorMessage ? <Text style={styles.dialogError}>{errorMessage}</Text> : null}
          </ScrollView>
          <DialogActions
            cancelLabel={ACTION_LABELS.cancel}
            saveLabel={ACTION_LABELS.create}
            onClose={onClose}
            onSave={onCreate}
          />
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * @param {{
 *   list: SavedListCategory | undefined,
 *   emoji: string,
 *   selectedColorId: string | null,
 *   errorMessage: string,
 *   onEmojiChange: (emoji: string) => void,
 *   onColorChange: (color: ListColorOption | null) => void,
 *   onClose: () => void,
 *   onSave: () => void
 * }} props
 */
function EditListIconDialog({
  list,
  emoji,
  selectedColorId,
  errorMessage,
  onEmojiChange,
  onColorChange,
  onClose,
  onSave,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(list)}
      onRequestClose={onClose}
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
        <Pressable style={styles.dialogBackdrop} onPress={onClose} />
        <Pressable
          style={styles.dialogContent}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.dialogTitle}>Change list appearance</Text>
          <Text style={styles.dialogSubtitle}>{list?.label}</Text>
          <ScrollView
            style={styles.dialogBody}
            contentContainerStyle={styles.dialogBodyContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.dialogHint}>
              Choose a map icon.
            </Text>
            <ListEmojiPicker
              selectedEmoji={emoji}
              onEmojiChange={onEmojiChange}
              defaultIcon={list?.icon}
              defaultColor={list?.color}
            />
            <Text style={styles.dialogEmojiLabel}>List color</Text>
            <ListColorPicker
              selectedColorId={selectedColorId}
              onColorChange={onColorChange}
            />
            {errorMessage ? <Text style={styles.dialogError}>{errorMessage}</Text> : null}
          </ScrollView>
          <DialogActions
            cancelLabel={ACTION_LABELS.cancel}
            saveLabel={ACTION_LABELS.save}
            onClose={onClose}
            onSave={onSave}
          />
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * @param {{
 *   cancelLabel: string,
 *   saveLabel: string,
 *   onClose: () => void,
 *   onSave: () => void
 * }} props
 */
function DialogActions({ cancelLabel, saveLabel, onClose, onSave }) {
  return (
    <View style={styles.dialogActions}>
      <TouchableOpacity onPress={onClose} style={styles.dialogCancelButton}>
        <Text style={styles.dialogCancelText}>{cancelLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSave} style={styles.dialogSaveButton}>
        <Text style={styles.dialogSaveText}>{saveLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}
