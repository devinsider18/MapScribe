import {
  DUPLICATE_LIST_NAME,
  SAVED_PLACES_LOAD_ERROR,
} from '../constants/messages.mjs';
import { PLACE_PROGRESS } from '../constants/placeProgress.mjs';
import { MAX_PLACE_PHOTOS } from '../constants/placePhotos.mjs';
import { isValidPlaceDate } from '../constants/placeDates.mjs';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
 * @typedef {{
 *   id: number,
 *   latitude: number,
 *   longitude: number,
 *   title: string | null,
 *   listType?: string | null,
 *   photos?: string | null,
 *   progress?: string | null,
 *   notes?: string | null,
 *   visitedAt?: string | null
 * }} MarkerRow
 * @typedef {{ id: number, name: string }} SavedListRow
 * @typedef {{
 *   id: number,
 *   coordinate: Coordinate,
 *   title: string,
 *   listType: string,
 *   photos: string[],
 *   progress: string,
 *   notes: string,
 *   visitedAt: string | null
 * }} SavedMarker
 * @typedef {{
 *   id: number,
 *   name: string,
 *   startDate: string,
 *   endDate: string,
 *   markerIds: number[]
 * }} SavedTrip
 * @typedef {{
 *   id: string,
 *   label: string,
 *   icon: import('react').ComponentProps<typeof import('@expo/vector-icons').MaterialIcons>['name'],
 *   color: string,
 *   bg: string
 * }} SavedListCategory
 * @typedef {{
 *   initialize: () => void,
 *   getAll: () => MarkerRow[],
 *   getLists: () => SavedListRow[],
 *   getListIconOverrides?: () => Array<{ list_id: string, emoji: string }>,
 *   getListColorOverrides?: () => Array<{ list_id: string, color: string, bg: string }>,
 *   getTrips?: () => SavedTrip[],
 *   insert: (
 *     coordinate: Coordinate,
 *     title: string,
 *     listType: string,
 *     notes: string,
 *     visitedAt: string | null
 *   ) => number,
 *   insertList: (name: string) => number,
 *   renameList: (listId: string, name: string) => void,
 *   deleteList: (listId: string) => void,
 *   insertTrip: (name: string, startDate: string, endDate: string) => number,
 *   updateTrip: (id: number, name: string, startDate: string, endDate: string) => void,
 *   deleteTrip: (id: number) => void,
 *   setTripStops: (tripId: number, markerIds: number[]) => void,
 *   setListIcon: (listId: string, emoji: string | null) => void,
 *   setListColor: (listId: string, colors: { color: string, bg: string } | null) => void,
 *   update: (
 *     id: number,
 *     coordinate: Coordinate,
 *     title: string,
 *     listType: string,
 *     photos: string[],
 *     progress: string,
 *     notes: string,
 *     visitedAt: string | null
 *   ) => void,
 *   updatePhotos: (id: number, photos: string[]) => void,
 *   updateProgress: (id: number, progress: string) => void,
 *   delete: (id: number) => void
 * }} SavedMarkerStorage
 * @typedef {{
 *   markers: SavedMarker[],
 *   customLists: SavedListCategory[],
 *   trips: SavedTrip[],
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

/**
 * @param {number} id
 * @param {string} label
 * @returns {SavedListCategory}
 */
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

  return storage.getAll().map((marker) => {
    let photos = [];
    if (marker.photos) {
      try {
        const parsedPhotos = JSON.parse(marker.photos);
        if (Array.isArray(parsedPhotos)) photos = parsedPhotos;
      } catch {
        photos = [];
      }
    }

    return {
      id: marker.id,
      coordinate: { latitude: marker.latitude, longitude: marker.longitude },
      title: marker.title ?? '',
      listType: marker.listType || defaultListType,
      photos,
      progress: marker.progress || PLACE_PROGRESS.unvisited,
      notes: marker.notes || '',
      visitedAt: marker.visitedAt || null,
    };
  });
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
      trips: loadTrips(storage),
      listIconOverrides: loadListIconOverrides(storage),
      listColorOverrides: loadListColorOverrides(storage),
      loadError: null,
    };
  } catch {
    return {
      markers: [],
      customLists: [],
      trips: [],
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
 * @param {string} name
 * @param {string[]} [reservedNames]
 */
export function renameSavedList(storage, listId, name, reservedNames = []) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('List name is required.');

  const lists = storage.getLists();
  if (!lists.some((list) => `custom_${list.id}` === listId)) {
    throw new Error(`Saved list ${listId} was not found.`);
  }
  const duplicate = [...lists
    .filter((list) => `custom_${list.id}` !== listId)
    .map((list) => list.name), ...reservedNames]
    .some((existingName) => existingName.localeCompare(
      trimmedName,
      undefined,
      { sensitivity: 'accent' }
    ) === 0);
  if (duplicate) throw new Error(DUPLICATE_LIST_NAME);

  storage.renameList(listId, trimmedName);
  return createCustomListCategory(Number(listId.replace('custom_', '')), trimmedName);
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {string} listId
 */
export function deleteEmptySavedList(storage, listId) {
  const markers = storage.getAll();
  if (markers.some((marker) => marker.listType === listId)) {
    throw new Error('Move or remove all places before deleting this list.');
  }
  storage.deleteList(listId);
}

/** @param {SavedMarkerStorage} storage @returns {SavedTrip[]} */
export function loadTrips(storage) {
  return storage.getTrips?.() ?? [];
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {{ name: string, startDate: string, endDate: string }} trip
 * @returns {SavedTrip}
 */
export function createSavedTrip(storage, trip) {
  const { name, startDate, endDate } = validateTrip(trip);
  const id = storage.insertTrip(name, startDate, endDate);
  return { id, name, startDate, endDate, markerIds: [] };
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 * @param {{ name: string, startDate: string, endDate: string }} trip
 * @returns {{ name: string, startDate: string, endDate: string }}
 */
export function updateSavedTrip(storage, id, trip) {
  const updatedTrip = validateTrip(trip);
  storage.updateTrip(id, updatedTrip.name, updatedTrip.startDate, updatedTrip.endDate);
  return updatedTrip;
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} tripId
 * @param {number[]} markerIds
 * @returns {number[]}
 */
export function updateSavedTripStops(storage, tripId, markerIds) {
  if (new Set(markerIds).size !== markerIds.length) {
    throw new Error('A place can only appear once in a trip.');
  }
  storage.setTripStops(tripId, markerIds);
  return markerIds;
}

/** @param {SavedMarkerStorage} storage @param {number} id */
export function deleteSavedTrip(storage, id) {
  storage.deleteTrip(id);
}

/**
 * @param {{ name: string, startDate: string, endDate: string }} trip
 * @returns {{ name: string, startDate: string, endDate: string }}
 */
function validateTrip({ name, startDate, endDate }) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Trip name is required.');
  if (!isValidPlaceDate(startDate) || !startDate) {
    throw new Error('Enter a valid trip start date.');
  }
  if (!isValidPlaceDate(endDate) || !endDate) {
    throw new Error('Enter a valid trip end date.');
  }
  if (endDate < startDate) {
    throw new Error('Trip end date cannot be before its start date.');
  }
  return { name: trimmedName, startDate, endDate };
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
 * @param {string[]} [photos]
 * @param {string} [progress]
 * @param {string} [notes]
 * @param {string | null} [visitedAt]
 * @returns {SavedMarker}
 */
export function saveMarkerToDatabase(
  storage,
  coordinate,
  title,
  listType,
  photos = [],
  progress = PLACE_PROGRESS.unvisited,
  notes = '',
  visitedAt = null
) {
  validatePhotos(photos);
  validateVisitedAt(visitedAt);
  const id = storage.insert(coordinate, title, listType, notes, visitedAt);

  return {
    id,
    coordinate,
    title,
    listType,
    photos,
    progress,
    notes,
    visitedAt,
  };
}

/**
 * @param {SavedMarkerStorage} storage
 * @param {number} id
 * @param {Coordinate} coordinate
 * @param {string} title
 * @param {string} listType
 * @param {string[]} [photos]
 * @param {string} [progress]
 * @param {string} [notes]
 * @param {string | null} [visitedAt]
 * @returns {SavedMarker}
 */
export function updateSavedMarker(
  storage,
  id,
  coordinate,
  title,
  listType,
  photos = [],
  progress = PLACE_PROGRESS.unvisited,
  notes = '',
  visitedAt = null
) {
  validatePhotos(photos);
  validateVisitedAt(visitedAt);
  storage.update(id, coordinate, title, listType, photos, progress, notes, visitedAt);

  return {
    id,
    coordinate,
    title,
    listType,
    photos,
    progress,
    notes,
    visitedAt,
  };
}

/** @param {string | null} visitedAt */
function validateVisitedAt(visitedAt) {
  if (visitedAt !== null && !isValidPlaceDate(visitedAt)) {
    throw new Error('Enter a valid visit date.');
  }
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
