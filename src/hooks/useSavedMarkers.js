import { useCallback, useState } from 'react';
import {
  addMarkerToDb,
  addSavedListToDb,
  deleteMarkerFromDb,
  getMarkers,
  getSavedLists,
  getListIconOverrides,
  getListColorOverrides,
  initDatabase,
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
} from '../models/savedMarkers.mjs';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
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
 *   bg: string,
 *   emoji: string | null
 * }} SavedListCategory
 * @typedef {{
 *   markers: SavedMarker[],
 *   listCategories: SavedListCategory[],
 *   loadError: string | null,
 *   addSavedMarker: (coordinate: Coordinate, title: string, listType: string) => void,
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
 *     progress?: string
 *   ) => void,
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
  insert: addMarkerToDb,
  insertList: addSavedListToDb,
  setListIcon: setListIconOverride,
  setListColor: setListColorOverride,
  update: updateMarkerInDb,
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

  const addSavedMarker = (coordinate, title, listType) => {
    const marker = saveMarkerToDatabase(markerStorage, coordinate, title, listType);

    setSavedMarkersState((current) => ({
      ...current,
      markers: [...current.markers, marker],
    }));
  };

  const updateExistingMarker = (
    id,
    coordinate,
    title,
    listType,
    photos,
    progress
  ) => {
    const existingMarker = savedMarkersState.markers.find((marker) => marker.id === id);
    const marker = updateSavedMarker(
      markerStorage,
      id,
      coordinate,
      title,
      listType,
      photos ?? existingMarker?.photos,
      progress ?? existingMarker?.progress
    );

    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.map((savedMarker) => (
        savedMarker.id === id ? marker : savedMarker
      )),
    }));
  };

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
      const cleanupError = new Error(
        'The photo was removed, but its local file could not be deleted.',
        { cause: error }
      );
      cleanupError.photosUpdated = true;
      throw cleanupError;
    }
  };

  const updateExistingMarkerProgress = (id, progress) => {
    updateSavedMarkerProgress(markerStorage, id, progress);
    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.map((marker) => (
        marker.id === id ? { ...marker, progress } : marker
      )),
    }));
  };

  const removeSavedMarker = async (id) => {
    const existingMarker = savedMarkersState.markers.find((marker) => marker.id === id);
    deleteSavedMarker(markerStorage, id);

    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.filter((marker) => marker.id !== id),
    }));
    try {
      await deletePlacePhotoFiles(existingMarker?.photos ?? []);
    } catch (error) {
      const cleanupError = new Error(
        'The place was deleted, but some photo files could not be removed.',
        { cause: error }
      );
      cleanupError.placeDeleted = true;
      throw cleanupError;
    }
  };

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

  const listCategories = [...LIST_CATEGORIES, ...savedMarkersState.customLists].map((category) => ({
    ...category,
    emoji: savedMarkersState.listIconOverrides[category.id] || null,
    ...(savedMarkersState.listColorOverrides[category.id] || {}),
  }));

  return {
    markers: savedMarkersState.markers,
    listCategories,
    loadError: savedMarkersState.loadError,
    addSavedMarker,
    createSavedList,
    updateSavedListIcon,
    updateSavedListColor,
    updateSavedMarker: updateExistingMarker,
    updateSavedMarkerPhotos: updateExistingMarkerPhotos,
    updateSavedMarkerProgress: updateExistingMarkerProgress,
    deleteSavedMarker: removeSavedMarker,
    reloadSavedMarkers,
  };
}
