import {
  DUPLICATE_LIST_NAME,
  SAVED_PLACES_LOAD_ERROR,
} from '../constants/messages.mjs';
import { PLACE_PROGRESS } from '../constants/placeProgress.mjs';
import { MAX_PLACE_PHOTOS } from '../constants/placePhotos.mjs';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
 * @typedef {{
 *   id: number,
 *   latitude: number,
 *   longitude: number,
 *   title: string | null,
 *   listType?: string | null,
 *   photos?: string | null,
 *   progress?: string | null
 * }} MarkerRow
 * @typedef {{ id: number, name: string }} SavedListRow
 * @typedef {{
 *   id: number,
 *   coordinate: Coordinate,
 *   title: string,
 *   listType: string,
 *   photos: string[],
 *   progress: string
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
 *   getListColorOverrides?: () => Array<{ list_id: string, color: string, bg: string }>,
 *   insert: (coordinate: Coordinate, title: string, listType: string) => number,
 *   insertList: (name: string) => number,
 *   setListIcon: (listId: string, emoji: string | null) => void,
 *   setListColor: (listId: string, colors: { color: string, bg: string } | null) => void,
 *   update: (
 *     id: number,
 *     coordinate: Coordinate,
 *     title: string,
 *     listType: string,
 *     photos: string[],
 *     progress: string
 *   ) => void,
 *   updatePhotos?: (id: number, photos: string[]) => void,
 *   updateProgress?: (id: number, progress: string) => void,
 *   delete: (id: number) => void
 * }} SavedMarkerStorage
 * @typedef {{
 *   markers: SavedMarker[],
 *   customLists: SavedListCategory[],
 *   listIconOverrides: Record<string, string>,
 *   listColorOverrides: Record<string, { color: string, bg: string }>,
 *   loadError: string | null
 * }} SavedMarkersState
 */

const CUSTOM_LIST_COLORS = [
  { color: '#6750A4', bg: '#EADDFF' },
  { color: '#006A60', bg: '#A8F0E4' },
  { color: '#984061', bg: '#FFD8E6' },
  { color: '#745B00', bg: '#F5E1A4' },
];

/** @param {string[]} photos */
function validatePhotos(photos) {
  if (!Array.isArray(photos) || photos.length > MAX_PLACE_PHOTOS) {
    throw new Error(`A place can have at most ${MAX_PLACE_PHOTOS} photos.`);
  }
}

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
    photos: marker.photos ? JSON.parse(marker.photos) : [],
    progress: marker.progress || PLACE_PROGRESS.unvisited,
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
 * @returns {Record<string, { color: string, bg: string }>}
 */
export function loadListColorOverrides(storage) {
  if (!storage.getListColorOverrides) return {};

  return Object.fromEntries(
    storage.getListColorOverrides().map(({ list_id, color, bg }) => [
      list_id,
      { color, bg },
    ])
  );
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {string} listId
 * @param {{ color: string, bg: string } | null} colors
 */
export function saveListColor(storage, listId, colors) {
  storage.setListColor(listId, colors);
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
      listColorOverrides: loadListColorOverrides(storage),
      loadError: null,
    };
  } catch {
    return {
      markers: [],
      customLists: [],
      listIconOverrides: {},
      listColorOverrides: {},
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
export function saveMarkerToDatabase(
  storage,
  coordinate,
  title,
  listType,
  photos = [],
  progress = PLACE_PROGRESS.unvisited
) {
  validatePhotos(photos);
  const id = storage.insert(coordinate, title, listType);

  return {
    id,
    coordinate,
    title,
    listType,
    photos,
    progress,
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
export function updateSavedMarker(
  storage,
  id,
  coordinate,
  title,
  listType,
  photos = [],
  progress = PLACE_PROGRESS.unvisited
) {
  validatePhotos(photos);
  storage.update(id, coordinate, title, listType, photos, progress);

  return {
    id,
    coordinate,
    title,
    listType,
    photos,
    progress,
  };
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 * @param {string[]} photos
 */
export function updateSavedMarkerPhotos(storage, id, photos) {
  validatePhotos(photos);
  storage.updatePhotos(id, photos);
  return photos;
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 * @param {string} progress
 */
export function updateSavedMarkerProgress(storage, id, progress) {
  storage.updateProgress(id, progress);
  return progress;
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 */
export function deleteSavedMarker(storage, id) {
  storage.delete(id);
}
