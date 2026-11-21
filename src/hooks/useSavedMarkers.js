import { useCallback, useState } from 'react';
import {
  addMarkerToDb,
  addSavedListToDb,
  deleteMarkerFromDb,
  getMarkers,
  getSavedLists,
  getListIconOverrides,
  getListColorOverrides,
  getTrips,
  initDatabase,
  addTripToDb,
  updateTripInDb,
  deleteTripFromDb,
  replaceTripStopsInDb,
  renameSavedListInDb,
  deleteEmptySavedListFromDb,
  setListIconOverride,
  setListColorOverride,
  updateMarkerPhotosInDb,
  updateMarkerProgressInDb,
  updateMarkerInDb,
} from '../api/database';
import { deletePlacePhotoFiles } from '../api/placePhotos';
import { DEFAULT_LIST_TYPE, LIST_CATEGORIES } from '../constants/listCategories';
import { SAVED_PLACES_LOAD_ERROR } from '../constants/messages.mjs';
import {
  createInitialSavedMarkersState,
  createSavedList as insertSavedList,
  deleteSavedMarker,
  loadCustomLists,
  loadListIconOverrides,
  loadListColorOverrides,
  loadSavedMarkers,
  saveListIcon,
  saveListColor,
  saveMarkerToDatabase,
  updateSavedMarker,
  updateSavedMarkerPhotos,
  updateSavedMarkerProgress,
  renameSavedList as renameList,
  deleteEmptySavedList as deleteList,
  createSavedTrip as insertTrip,
  updateSavedTrip as updateTrip,
  updateSavedTripStops as setTripStops,
  deleteSavedTrip as removeTrip,
  loadTrips,
} from '../models/savedMarkers.mjs';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
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
 *   bg: string,
 *   emoji?: string | null
 * }} SavedListCategory
 * @typedef {{
 *   markers: SavedMarker[],
 *   trips: SavedTrip[],
 *   listCategories: SavedListCategory[],
 *   loadError: string | null,
 *   addSavedMarker: (
 *     coordinate: Coordinate,
 *     title: string,
 *     listType: string,
 *     notes?: string,
 *     visitedAt?: string | null
 *   ) => void,
 *   createSavedList: (name: string) => SavedListCategory,
 *   updateSavedListIcon: (listId: string, emoji: string | null) => void,
 *   updateSavedListColor: (
 *     listId: string,
 *     colors: { color: string, bg: string } | null
 *   ) => void,
 *   updateSavedMarker: (
 *     id: number,
 *     coordinate: Coordinate,
 *     title: string,
 *     listType: string,
 *     photos?: string[],
 *     progress?: string,
 *     notes?: string,
 *     visitedAt?: string | null
 *   ) => void,
 *   renameSavedList: (listId: string, name: string) => void,
 *   deleteSavedList: (listId: string) => void,
 *   createTrip: (trip: { name: string, startDate: string, endDate: string }) => SavedTrip,
 *   updateTrip: (id: number, trip: { name: string, startDate: string, endDate: string }) => void,
 *   deleteTrip: (id: number) => void,
 *   updateTripStops: (id: number, markerIds: number[]) => void,
 *   updateSavedMarkerPhotos: (id: number, photos: string[]) => Promise<void>,
 *   updateSavedMarkerProgress: (id: number, progress: string) => void,
 *   deleteSavedMarker: (id: number) => Promise<void>,
 *   reloadSavedMarkers: () => void
 * }} SavedPlaces
 */

const markerStorage = {
  initialize: initDatabase,
  getAll: getMarkers,
  getLists: getSavedLists,
  getListIconOverrides,
  getListColorOverrides,
  getTrips,
  insert: addMarkerToDb,
  insertList: addSavedListToDb,
  setListIcon: setListIconOverride,
  setListColor: setListColorOverride,
  update: updateMarkerInDb,
  renameList: renameSavedListInDb,
  deleteList: deleteEmptySavedListFromDb,
  insertTrip: addTripToDb,
  updateTrip: updateTripInDb,
  deleteTrip: deleteTripFromDb,
  setTripStops: replaceTripStopsInDb,
  updatePhotos: updateMarkerPhotosInDb,
  updateProgress: updateMarkerProgressInDb,
  delete: deleteMarkerFromDb,
};

/** @returns {SavedPlaces} */
export default function useSavedMarkers() {
  const [savedMarkersState, setSavedMarkersState] = useState(() =>
    createInitialSavedMarkersState(markerStorage, DEFAULT_LIST_TYPE)
  );

  const reloadSavedMarkers = useCallback(() => {
    try {
      setSavedMarkersState({
        markers: loadSavedMarkers(markerStorage, DEFAULT_LIST_TYPE),
        customLists: loadCustomLists(markerStorage),
        trips: loadTrips(markerStorage),
        listIconOverrides: loadListIconOverrides(markerStorage),
        listColorOverrides: loadListColorOverrides(markerStorage),
        loadError: null,
      });
    } catch (error) {
      console.error('Failed to reload saved places:', error);
      setSavedMarkersState((current) => ({
        ...current,
        loadError: SAVED_PLACES_LOAD_ERROR,
      }));
    }
  }, []);

  /**
   * @param {Coordinate} coordinate
   * @param {string} title
   * @param {string} listType
   * @param {string} [notes]
   * @param {string | null} [visitedAt]
   */
  const addSavedMarker = (coordinate, title, listType, notes = '', visitedAt = null) => {
    const marker = saveMarkerToDatabase(
      markerStorage,
      coordinate,
      title,
      listType,
      [],
      undefined,
      notes,
      visitedAt
    );

    setSavedMarkersState((current) => ({
      ...current,
      markers: [...current.markers, marker],
    }));
  };

  /**
   * @param {number} id
   * @param {Coordinate} coordinate
   * @param {string} title
   * @param {string} listType
   * @param {string[]} [photos]
   * @param {string} [progress]
   * @param {string} [notes]
   * @param {string | null} [visitedAt]
   */
  const updateExistingMarker = (
    id,
    coordinate,
    title,
    listType,
    photos,
    progress,
    notes,
    visitedAt
  ) => {
    const existingMarker = savedMarkersState.markers.find((marker) => marker.id === id);
    const marker = updateSavedMarker(
      markerStorage,
      id,
      coordinate,
      title,
      listType,
      photos ?? existingMarker?.photos,
      progress ?? existingMarker?.progress,
      notes ?? existingMarker?.notes,
      visitedAt === undefined ? existingMarker?.visitedAt : visitedAt
    );

    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.map((savedMarker) => (
        savedMarker.id === id ? marker : savedMarker
      )),
    }));
  };

  /**
   * @param {number} id
   * @param {string[]} photos
   * @returns {Promise<void>}
   */
  const updateExistingMarkerPhotos = async (id, photos) => {
    const existingMarker = savedMarkersState.markers.find((marker) => marker.id === id);
    if (!existingMarker) throw new Error(`Saved place ${id} was not found.`);

    updateSavedMarkerPhotos(markerStorage, id, photos);
    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.map((marker) => (
        marker.id === id ? { ...marker, photos } : marker
      )),
    }));

    const removedPhotos = existingMarker.photos.filter((photo) => !photos.includes(photo));
    try {
      await deletePlacePhotoFiles(removedPhotos);
    } catch (error) {
      const cleanupError = Object.assign(
        new Error('The photo was removed, but its local file could not be deleted.', {
          cause: error,
        }),
        { photosUpdated: true }
      );
      throw cleanupError;
    }
  };

  /**
   * @param {number} id
   * @param {string} progress
   */
  const updateExistingMarkerProgress = (id, progress) => {
    updateSavedMarkerProgress(markerStorage, id, progress);
    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.map((marker) => (
        marker.id === id ? { ...marker, progress } : marker
      )),
    }));
  };

  /** @param {number} id @returns {Promise<void>} */
  const removeSavedMarker = async (id) => {
    const existingMarker = savedMarkersState.markers.find((marker) => marker.id === id);
    deleteSavedMarker(markerStorage, id);

    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.filter((marker) => marker.id !== id),
      trips: current.trips.map((trip) => ({
        ...trip,
        markerIds: trip.markerIds.filter((markerId) => markerId !== id),
      })),
    }));
    try {
      await deletePlacePhotoFiles(existingMarker?.photos ?? []);
    } catch (error) {
      const cleanupError = Object.assign(
        new Error('The place was deleted, but some photo files could not be removed.', {
          cause: error,
        }),
        { placeDeleted: true }
      );
      throw cleanupError;
    }
  };

  /** @param {string} name */
  const createSavedList = (name) => {
    const list = insertSavedList(
      markerStorage,
      name,
      LIST_CATEGORIES.map((category) => category.label)
    );

    setSavedMarkersState((current) => ({
      ...current,
      customLists: [...current.customLists, list],
    }));

    return list;
  };

  /** @param {string} listId @param {string | null} emoji */
  const updateSavedListIcon = (listId, emoji) => {
    saveListIcon(markerStorage, listId, emoji);

    setSavedMarkersState((current) => {
      const listIconOverrides = { ...current.listIconOverrides };
      if (emoji) {
        listIconOverrides[listId] = emoji;
      } else {
        delete listIconOverrides[listId];
      }

      return { ...current, listIconOverrides };
    });
  };

  /** @param {string} listId @param {{ color: string, bg: string } | null} colors */
  const updateSavedListColor = (listId, colors) => {
    saveListColor(markerStorage, listId, colors);

    setSavedMarkersState((current) => {
      const listColorOverrides = { ...current.listColorOverrides };
      if (colors) {
        listColorOverrides[listId] = colors;
      } else {
        delete listColorOverrides[listId];
      }

      return { ...current, listColorOverrides };
    });
  };

  /** @param {string} listId @param {string} name */
  const renameSavedList = (listId, name) => {
    const updatedList = renameList(
      markerStorage,
      listId,
      name,
      LIST_CATEGORIES.map((category) => category.label)
    );
    setSavedMarkersState((current) => ({
      ...current,
      customLists: current.customLists.map((list) => (
        list.id === listId ? updatedList : list
      )),
    }));
  };

  /** @param {string} listId */
  const deleteSavedList = (listId) => {
    deleteList(markerStorage, listId);
    setSavedMarkersState((current) => ({
      ...current,
      customLists: current.customLists.filter((list) => list.id !== listId),
      listIconOverrides: Object.fromEntries(
        Object.entries(current.listIconOverrides).filter(([id]) => id !== listId)
      ),
      listColorOverrides: Object.fromEntries(
        Object.entries(current.listColorOverrides).filter(([id]) => id !== listId)
      ),
    }));
  };

  /** @param {{ name: string, startDate: string, endDate: string }} trip */
  const createTrip = (trip) => {
    const createdTrip = insertTrip(markerStorage, trip);
    setSavedMarkersState((current) => ({
      ...current,
      trips: [...current.trips, createdTrip],
    }));
    return createdTrip;
  };

  /** @param {number} id @param {{ name: string, startDate: string, endDate: string }} trip */
  const updateTripDetails = (id, trip) => {
    const updated = updateTrip(markerStorage, id, trip);
    setSavedMarkersState((current) => ({
      ...current,
      trips: current.trips.map((savedTrip) => (
        savedTrip.id === id ? { ...savedTrip, ...updated } : savedTrip
      )),
    }));
  };

  /** @param {number} id */
  const deleteTrip = (id) => {
    removeTrip(markerStorage, id);
    setSavedMarkersState((current) => ({
      ...current,
      trips: current.trips.filter((trip) => trip.id !== id),
    }));
  };

  /** @param {number} id @param {number[]} markerIds */
  const updateTripStops = (id, markerIds) => {
    const updatedMarkerIds = setTripStops(markerStorage, id, markerIds);
    setSavedMarkersState((current) => ({
      ...current,
      trips: current.trips.map((trip) => (
        trip.id === id ? { ...trip, markerIds: updatedMarkerIds } : trip
      )),
    }));
  };

  const listCategories = [...LIST_CATEGORIES, ...savedMarkersState.customLists].map((category) => ({
    ...category,
    emoji: savedMarkersState.listIconOverrides[category.id] || null,
    ...(savedMarkersState.listColorOverrides[category.id] || {}),
  }));

  return {
    markers: savedMarkersState.markers,
    trips: savedMarkersState.trips,
    listCategories,
    loadError: savedMarkersState.loadError,
    addSavedMarker,
    createSavedList,
    renameSavedList,
    deleteSavedList,
    createTrip,
    updateTrip: updateTripDetails,
    deleteTrip,
    updateTripStops,
    updateSavedListIcon,
    updateSavedListColor,
    updateSavedMarker: updateExistingMarker,
    updateSavedMarkerPhotos: updateExistingMarkerPhotos,
    updateSavedMarkerProgress: updateExistingMarkerProgress,
    deleteSavedMarker: removeSavedMarker,
    reloadSavedMarkers,
  };
}
