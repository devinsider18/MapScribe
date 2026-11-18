import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ListCategoryIcon from './ListCategoryIcon';
import ListEmojiPicker from './ListEmojiPicker';
import SavePlaceModal from './SavePlaceModal';

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
            <View key={category.id} style={styles.listCard}>
              <View style={styles.listHeader}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isExpanded }}
                  onPress={() => setExpandedList(isExpanded ? null : category.id)}
                  style={styles.listHeaderMain}
                >
                  <View style={[styles.listIcon, { backgroundColor: category.bg }]}>
                    <ListCategoryIcon category={category} size={22} color={category.color} />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{category.label}</Text>
                    <Text style={styles.placeCount}>
                      {places.length} {places.length === 1 ? 'place' : 'places'}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={24}
                    color="#49454F"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Change ${category.label} icon`}
                  onPress={() => {
                    setIconError('');
                    setIconListId(category.id);
                    setIconDraft(category.emoji || '');
                  }}
                  style={styles.changeIconButton}
                >
                  <MaterialIcons name="edit" size={18} color="#49454F" />
                </TouchableOpacity>
              </View>

              {isExpanded ? (
                <View style={styles.places}>
                  {places.length ? (
                    places.map((place) => (
                      <View key={place.id} style={styles.placeRow}>
                        <MaterialIcons name="place" size={18} color={category.color} />
                        <Text style={styles.placeName} numberOfLines={1}>{place.title}</Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Edit ${place.title}`}
                          onPress={() => {
                            setEditError('');
                            setEditingPlace(place);
                          }}
                          style={styles.placeAction}
                        >
                          <MaterialIcons name="edit" size={18} color="#49454F" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${place.title}`}
                          onPress={() => requestDeletePlace(place)}
                          style={styles.placeAction}
                        >
                          <MaterialIcons name="delete-outline" size={19} color="#B3261E" />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.emptyList}>No places yet</Text>
                  )}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      <SavePlaceModal
        visible={Boolean(editingPlace)}
        title={editingPlace?.title ?? ''}
        selectedListType={editingPlace?.listType ?? ''}
        errorMessage={editError}
        isEditing
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
      <Modal
        animationType="fade"
        transparent
        visible={createListVisible}
        onRequestClose={closeCreateList}
      >
        <Pressable style={styles.createListOverlay} onPress={closeCreateList}>
          <Pressable
            style={styles.createListDialog}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.createListTitle}>Create a list</Text>
            <Text style={styles.createListSubtitle}>Give your saved places a new home.</Text>
            <TextInput
              autoFocus
              maxLength={40}
              placeholder="List name"
              placeholderTextColor="#74777F"
              value={newListName}
              onChangeText={(name) => {
                setNewListName(name);
                setCreateListError('');
              }}
              onSubmitEditing={handleCreateList}
              returnKeyType="done"
              style={styles.createListInput}
            />
            <Text style={styles.iconPickerLabel}>Emoji (optional)</Text>
            <Text style={styles.iconPickerHint}>Tap the field and switch to your device&apos;s emoji keyboard.</Text>
            <ListEmojiPicker
              selectedEmoji={newListEmoji}
              onEmojiChange={setNewListEmoji}
            />
            {createListError ? (
              <Text style={styles.createListError}>{createListError}</Text>
            ) : null}
            <View style={styles.createListActions}>
              <TouchableOpacity onPress={closeCreateList} style={styles.createListCancelButton}>
                <Text style={styles.createListCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateList} style={styles.createListSaveButton}>
                <Text style={styles.createListSaveText}>Create</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(iconList)}
        onRequestClose={() => setIconListId(null)}
      >
        <Pressable
          style={styles.createListOverlay}
          onPress={() => setIconListId(null)}
        >
          <Pressable
            style={styles.createListDialog}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={styles.createListTitle}>Change list icon</Text>
            <Text style={styles.createListSubtitle}>{iconList?.label}</Text>
            <Text style={styles.iconPickerHint}>Tap the field and switch to your device&apos;s emoji keyboard.</Text>
            <ListEmojiPicker
              selectedEmoji={iconDraft}
              onEmojiChange={setIconDraft}
              defaultIcon={iconList?.icon}
              defaultColor={iconList?.color}
            />
            {iconError ? <Text style={styles.createListError}>{iconError}</Text> : null}
            <View style={styles.createListActions}>
              <TouchableOpacity
                onPress={() => setIconListId(null)}
                style={styles.createListCancelButton}
              >
                <Text style={styles.createListCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveListIcon}
                style={styles.createListSaveButton}
              >
                <Text style={styles.createListSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#FEF7FF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 8,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C8C5D0',
    marginBottom: 12,
  },
  title: {
    color: '#1D1B20',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#625D67',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 14,
  },
  createListButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#D3E3FD',
    marginBottom: 12,
  },
  createListButtonText: {
    color: '#1D1B20',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#B3261E',
    backgroundColor: '#FCE8E6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 12,
  },
  listCard: {
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#F3EFF7',
  },
  listHeader: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
  },
  listHeaderMain: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
  },
  listIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  changeIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#EAE6EF',
    marginLeft: 8,
  },
  listName: {
    color: '#1D1B20',
    fontSize: 15,
    fontWeight: '600',
  },
  placeCount: {
    color: '#625D67',
    fontSize: 13,
    marginTop: 3,
  },
  places: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D9D4DE',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  placeRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeName: {
    flex: 1,
    color: '#1D1B20',
    fontSize: 14,
  },
  placeAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAE6EF',
  },
  emptyList: {
    color: '#625D67',
    fontSize: 14,
    paddingVertical: 10,
    paddingLeft: 30,
  },
  createListOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  createListDialog: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#F8F9FA',
  },
  createListTitle: {
    color: '#1D1B20',
    fontSize: 22,
    fontWeight: '700',
  },
  createListSubtitle: {
    color: '#625D67',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 18,
  },
  iconPickerLabel: {
    color: '#44474F',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 6,
  },
  iconPickerHint: {
    color: '#625D67',
    fontSize: 13,
    marginBottom: 10,
  },
  createListInput: {
    minHeight: 52,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 16,
    color: '#1D1B20',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  createListError: {
    color: '#B3261E',
    fontSize: 13,
    marginTop: 8,
  },
  createListActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  createListCancelButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  createListCancelText: {
    color: '#0B57D0',
    fontSize: 14,
    fontWeight: '600',
  },
  createListSaveButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#0B57D0',
  },
  createListSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
