const CUSTOM_LIST_COLORS = [
  { color: '#6750A4', bg: '#EADDFF' },
  { color: '#006A60', bg: '#A8F0E4' },
  { color: '#984061', bg: '#FFD8E6' },
  { color: '#745B00', bg: '#F5E1A4' },
];

function createCustomListCategory(id, label) {
  const colorConfig = CUSTOM_LIST_COLORS[(id - 1) % CUSTOM_LIST_COLORS.length];

  return {
    id: `custom_${id}`,
    label,
    icon: 'folder',
    ...colorConfig,
  };
}

export function loadSavedMarkers(storage, defaultListType) {
  storage.initialize();

  return storage.getAll().map((marker) => ({
    id: marker.id,
    coordinate: { latitude: marker.latitude, longitude: marker.longitude },
    title: marker.title,
    listType: marker.listType || defaultListType,
  }));
}

export function loadCustomLists(storage) {
  if (!storage.getLists) return [];

  return storage.getLists().map((list) => createCustomListCategory(list.id, list.name));
}

export function loadListIconOverrides(storage) {
  if (!storage.getListIconOverrides) return {};

  return Object.fromEntries(
    storage.getListIconOverrides().map(({ list_id, emoji }) => [list_id, emoji])
  );
}

export function createInitialSavedMarkersState(storage, defaultListType) {
  try {
    return {
      markers: loadSavedMarkers(storage, defaultListType),
      customLists: loadCustomLists(storage),
      listIconOverrides: loadListIconOverrides(storage),
      loadError: null,
    };
  } catch {
    return {
      markers: [],
      customLists: [],
      listIconOverrides: {},
      loadError: 'Saved places could not be loaded.',
    };
  }
}

export function createSavedList(storage, name) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('List name is required.');

  const existingLists = storage.getLists();
  const hasDuplicateName = existingLists.some((list) => (
    list.name.localeCompare(
      trimmedName,
      undefined,
      { sensitivity: 'accent' }
    ) === 0
  ));
  if (hasDuplicateName) {
    throw new Error('A list with this name already exists.');
  }

  const id = storage.insertList(trimmedName);
  return createCustomListCategory(id, trimmedName);
}

export function saveListIcon(storage, listId, emoji) {
  storage.setListIcon(listId, emoji);
}

export function saveMarkerToDatabase(storage, coordinate, title, listType) {
  const id = storage.insert(coordinate, title, listType);

  return {
    id,
    coordinate,
    title,
    listType,
  };
}

export function updateSavedMarker(storage, id, coordinate, title, listType) {
  storage.update(id, coordinate, title, listType);

  return {
    id,
    coordinate,
    title,
    listType,
  };
}

export function deleteSavedMarker(storage, id) {
  storage.delete(id);
}
