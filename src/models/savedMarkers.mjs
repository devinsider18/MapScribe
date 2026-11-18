import {
  DUPLICATE_LIST_NAME,
  SAVED_PLACES_LOAD_ERROR,
} from '../constants/messages.mjs';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
 * @typedef {{
 *   id: number,
 *   latitude: number,
 *   longitude: number,
 *   title: string | null,
 *   listType?: string | null
 * }} MarkerRow
 * @typedef {{ id: number, name: string }} SavedListRow
 * @typedef {{
 *   id: number,
 *   coordinate: Coordinate,
 *   title: string,
 *   listType: string
 * }} SavedMarker
 * @typedef {{
 *   id: string,
 *   label: string,
 *   icon: string,
 *   color: string,
 *   bg: string
 * }} SavedListCategory
 * @typedef {{
 *   initialize: () => void,
 *   getAll: () => MarkerRow[],
 *   getLists?: () => SavedListRow[],
 *   getListIconOverrides?: () => Array<{ list_id: string, emoji: string }>,
 *   insert: (coordinate: Coordinate, title: string, listType: string) => number,
 *   insertList: (name: string) => number,
 *   setListIcon: (listId: string, emoji: string | null) => void,
 *   update: (id: number, coordinate: Coordinate, title: string, listType: string) => void,
 *   delete: (id: number) => void
 * }} SavedMarkerStorage
 * @typedef {{
 *   markers: SavedMarker[],
 *   customLists: SavedListCategory[],
 *   listIconOverrides: Record<string, string>,
 *   loadError: string | null
 * }} SavedMarkersState
 */

const CUSTOM_LIST_COLORS = [
  { color: '#6750A4', bg: '#EADDFF' },
  { color: '#006A60', bg: '#A8F0E4' },
  { color: '#984061', bg: '#FFD8E6' },
  { color: '#745B00', bg: '#F5E1A4' },
];

/** @param {number} id @param {string} label */
function createCustomListCategory(id, label) {
  const colorConfig = CUSTOM_LIST_COLORS[(id - 1) % CUSTOM_LIST_COLORS.length];

  return {
    id: `custom_${id}`,
    label,
    icon: 'folder',
    ...colorConfig,
  };
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {string} defaultListType
 * @returns {SavedMarker[]}
 */
export function loadSavedMarkers(storage, defaultListType) {
  storage.initialize();

  return storage.getAll().map((marker) => ({
    id: marker.id,
    coordinate: { latitude: marker.latitude, longitude: marker.longitude },
    title: marker.title ?? '',
    listType: marker.listType || defaultListType,
  }));
}

/**
 * @param {SavedMarkerStorage} storage
 * @returns {SavedListCategory[]}
 */
export function loadCustomLists(storage) {
  if (!storage.getLists) return [];

  return storage.getLists().map((list) => createCustomListCategory(list.id, list.name));
}

/**
 * @param {SavedMarkerStorage} storage
 * @returns {Record<string, string>}
 */
export function loadListIconOverrides(storage) {
  if (!storage.getListIconOverrides) return {};

  return Object.fromEntries(
    storage.getListIconOverrides().map(({ list_id, emoji }) => [list_id, emoji])
  );
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {string} defaultListType
 * @returns {SavedMarkersState}
 */
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
      loadError: SAVED_PLACES_LOAD_ERROR,
    };
  }
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {string} name
 * @param {string[]} [reservedNames]
 * @returns {SavedListCategory}
 */
export function createSavedList(storage, name, reservedNames = []) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('List name is required.');

  const existingNames = [
    ...storage.getLists().map((list) => list.name),
    ...reservedNames,
  ];
  const hasDuplicateName = existingNames.some((existingName) => (
    existingName.localeCompare(
      trimmedName,
      undefined,
      { sensitivity: 'accent' }
    ) === 0
  ));
  if (hasDuplicateName) {
    throw new Error(DUPLICATE_LIST_NAME);
  }

  const id = storage.insertList(trimmedName);
  return createCustomListCategory(id, trimmedName);
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {string} listId
 * @param {string | null} emoji
 */
export function saveListIcon(storage, listId, emoji) {
  storage.setListIcon(listId, emoji);
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {Coordinate} coordinate
 * @param {string} title
 * @param {string} listType
 * @returns {SavedMarker}
 */
export function saveMarkerToDatabase(storage, coordinate, title, listType) {
  const id = storage.insert(coordinate, title, listType);

  return {
    id,
    coordinate,
    title,
    listType,
  };
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 * @param {Coordinate} coordinate
 * @param {string} title
 * @param {string} listType
 * @returns {SavedMarker}
 */
export function updateSavedMarker(storage, id, coordinate, title, listType) {
  storage.update(id, coordinate, title, listType);

  return {
    id,
    coordinate,
    title,
    listType,
  };
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 */
export function deleteSavedMarker(storage, id) {
  storage.delete(id);
}
