import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ListCategoryIcon from './ListCategoryIcon';
import ListEmojiPicker from './ListEmojiPicker';
import SavePlaceModal from './SavePlaceModal';
import styles from './SavedListsPanel.styles';

export default function SavedListsPanel({ savedPlaces }) {
  const {
    markers,
    listCategories,
    loadError,
    createSavedList,
    reloadSavedMarkers,
    updateSavedMarker,
    updateSavedListIcon,
    deleteSavedMarker,
  } = savedPlaces;
  const [expandedList, setExpandedList] = useState(null);
  const [editingPlace, setEditingPlace] = useState(null);
  const [editError, setEditError] = useState('');
  const [createListVisible, setCreateListVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListEmoji, setNewListEmoji] = useState('');
  const [createListError, setCreateListError] = useState('');
  const [iconListId, setIconListId] = useState(null);
  const [iconDraft, setIconDraft] = useState('');
  const [iconError, setIconError] = useState('');
  const iconList = listCategories.find((category) => category.id === iconListId);

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
    setCreateListError('');
  };

  const handleCreateList = () => {
    const name = newListName.trim();
    if (!name) {
      setCreateListError('Enter a name for your list.');
      return;
    }

    if (listCategories.some((category) => category.label.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      setCreateListError('A list with this name already exists.');
      return;
    }

    let newList;
    try {
      newList = createSavedList(name);
    } catch (error) {
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

    setExpandedList(newList.id);
    closeCreateList();
  };

  const handleSaveListIcon = () => {
    if (!iconListId) return;

    try {
      updateSavedListIcon(iconListId, iconDraft.trim() || null);
      setIconListId(null);
      setIconError('');
    } catch (error) {
      console.error('Failed to update saved list icon:', error);
      setIconError('Could not update this icon. Please try again.');
    }
  };

  const saveEditedPlace = () => {
    if (!editingPlace) return;

    try {
      updateSavedMarker(
        editingPlace.id,
        editingPlace.coordinate,
        editingPlace.title.trim() || 'Unlabeled Place',
        editingPlace.listType
      );
      closeEditor();
    } catch (error) {
      console.error('Failed to update saved place:', error);
      setEditError('Could not update this place. Please try again.');
    }
  };

  const requestDeletePlace = (place) => {
    Alert.alert(
      'Delete place?',
      `Remove "${place.title}" from your saved places?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              deleteSavedMarker(place.id);
              if (editingPlace?.id === place.id) closeEditor();
            } catch (error) {
              console.error('Failed to delete saved place:', error);
              if (editingPlace?.id === place.id) {
                setEditError('Could not delete this place. Please try again.');
              } else {
                Alert.alert('Could not delete place', 'Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.panel}>
      <View style={styles.handle} />
      <Text style={styles.title}>Your lists</Text>
      <Text style={styles.subtitle}>Saved places, organized your way.</Text>

      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          setCreateListError('');
          setCreateListVisible(true);
        }}
        style={styles.createListButton}
      >
        <MaterialIcons name="add" size={20} color="#1D1B20" />
        <Text style={styles.createListButtonText}>New list</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {listCategories.map((category) => {
          const places = markers.filter((marker) => marker.listType === category.id);
          const isExpanded = expandedList === category.id;

          return (
            <SavedListCard
              key={category.id}
              category={category}
              places={places}
              expanded={isExpanded}
              onToggle={() => setExpandedList(isExpanded ? null : category.id)}
              onChangeIcon={() => {
                setIconError('');
                setIconListId(category.id);
                setIconDraft(category.emoji || '');
              }}
              onEditPlace={(place) => {
                setEditError('');
                setEditingPlace(place);
              }}
              onDeletePlace={requestDeletePlace}
            />
          );
        })}
      </ScrollView>
      <EditSavedPlaceDialog
        place={editingPlace}
        errorMessage={editError}
        listCategories={listCategories}
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
      <CreateListDialog
        visible={createListVisible}
        name={newListName}
        emoji={newListEmoji}
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
        errorMessage={iconError}
        onEmojiChange={setIconDraft}
        onClose={() => setIconListId(null)}
        onSave={handleSaveListIcon}
      />
    </View>
  );
}
function SavedListCard({
  category,
  places,
  expanded,
  onToggle,
  onChangeIcon,
  onEditPlace,
  onDeletePlace,
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
            color="#49454F"
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Change ${category.label} icon`}
          onPress={onChangeIcon}
          style={styles.cardChangeIconButton}
        >
          <MaterialIcons name="edit" size={18} color="#49454F" />
        </TouchableOpacity>
      </View>

      {expanded ? (
        <View style={styles.cardPlaces}>
          {places.length ? (
            places.map((place) => (
              <View key={place.id} style={styles.cardPlaceRow}>
                <MaterialIcons name="place" size={18} color={category.color} />
                <Text style={styles.cardPlaceName} numberOfLines={1}>{place.title}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${place.title}`}
                  onPress={() => onEditPlace(place)}
                  style={styles.cardPlaceAction}
                >
                  <MaterialIcons name="edit" size={18} color="#49454F" />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${place.title}`}
                  onPress={() => onDeletePlace(place)}
                  style={styles.cardPlaceAction}
                >
                  <MaterialIcons name="delete-outline" size={19} color="#B3261E" />
                </TouchableOpacity>
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

function EditSavedPlaceDialog({
  place,
  errorMessage,
  listCategories,
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
      onTitleChange={onTitleChange}
      onListTypeChange={onListTypeChange}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
}

function CreateListDialog({
  visible,
  name,
  emoji,
  errorMessage,
  onNameChange,
  onEmojiChange,
  onClose,
  onCreate,
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.dialogOverlay} onPress={onClose}>
        <Pressable
          style={styles.dialogContent}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.dialogTitle}>Create a list</Text>
          <Text style={styles.dialogSubtitle}>Give your saved places a new home.</Text>
          <TextInput
            autoFocus
            maxLength={40}
            placeholder="List name"
            placeholderTextColor="#74777F"
            value={name}
            onChangeText={onNameChange}
            onSubmitEditing={onCreate}
            returnKeyType="done"
            style={styles.dialogNameInput}
          />
          <Text style={styles.dialogEmojiLabel}>Emoji (optional)</Text>
          <Text style={styles.dialogHint}>
            Tap the field and switch to your device&apos;s emoji keyboard.
          </Text>
          <ListEmojiPicker selectedEmoji={emoji} onEmojiChange={onEmojiChange} />
          {errorMessage ? <Text style={styles.dialogError}>{errorMessage}</Text> : null}
          <DialogActions
            cancelLabel="Cancel"
            saveLabel="Create"
            onClose={onClose}
            onSave={onCreate}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditListIconDialog({
  list,
  emoji,
  errorMessage,
  onEmojiChange,
  onClose,
  onSave,
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(list)}
      onRequestClose={onClose}
    >
      <Pressable style={styles.dialogOverlay} onPress={onClose}>
        <Pressable
          style={styles.dialogContent}
          onPress={(event) => event.stopPropagation()}
        >
          <Text style={styles.dialogTitle}>Change list icon</Text>
          <Text style={styles.dialogSubtitle}>{list?.label}</Text>
          <Text style={styles.dialogHint}>
            Tap the field and switch to your device&apos;s emoji keyboard.
          </Text>
          <ListEmojiPicker
            selectedEmoji={emoji}
            onEmojiChange={onEmojiChange}
            defaultIcon={list?.icon}
            defaultColor={list?.color}
          />
          {errorMessage ? <Text style={styles.dialogError}>{errorMessage}</Text> : null}
          <DialogActions
            cancelLabel="Cancel"
            saveLabel="Save"
            onClose={onClose}
            onSave={onSave}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
