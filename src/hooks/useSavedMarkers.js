import { useCallback, useState } from 'react';
import {
  addMarkerToDb,
  addSavedListToDb,
  deleteMarkerFromDb,
  getMarkers,
  getSavedLists,
  getListIconOverrides,
  initDatabase,
  setListIconOverride,
  updateMarkerInDb,
} from '../api/database';
import { DEFAULT_LIST_TYPE, LIST_CATEGORIES } from '../constants/listCategories';
import {
  createInitialSavedMarkersState,
  createSavedList as insertSavedList,
  deleteSavedMarker,
  loadCustomLists,
  loadListIconOverrides,
  loadSavedMarkers,
  saveListIcon,
  saveMarkerToDatabase,
  updateSavedMarker,
} from '../models/savedMarkers.mjs';

const markerStorage = {
  initialize: initDatabase,
  getAll: getMarkers,
  getLists: getSavedLists,
  getListIconOverrides,
  insert: addMarkerToDb,
  insertList: addSavedListToDb,
  setListIcon: setListIconOverride,
  update: updateMarkerInDb,
  delete: deleteMarkerFromDb,
};

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
        loadError: null,
      });
    } catch (error) {
      console.error('Failed to reload saved places:', error);
      setSavedMarkersState((current) => ({
        ...current,
        loadError: 'Saved places could not be loaded.',
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

  const updateExistingMarker = (id, coordinate, title, listType) => {
    const marker = updateSavedMarker(markerStorage, id, coordinate, title, listType);

    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.map((savedMarker) => (
        savedMarker.id === id ? marker : savedMarker
      )),
    }));
  };

  const removeSavedMarker = (id) => {
    deleteSavedMarker(markerStorage, id);

    setSavedMarkersState((current) => ({
      ...current,
      markers: current.markers.filter((marker) => marker.id !== id),
    }));
  };

  const createSavedList = (name) => {
    const list = insertSavedList(markerStorage, name);

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

  const listCategories = [...LIST_CATEGORIES, ...savedMarkersState.customLists].map((category) => ({
    ...category,
    emoji: savedMarkersState.listIconOverrides[category.id] || null,
  }));

  return {
    markers: savedMarkersState.markers,
    listCategories,
    loadError: savedMarkersState.loadError,
    addSavedMarker,
    createSavedList,
    updateSavedListIcon,
    updateSavedMarker: updateExistingMarker,
    deleteSavedMarker: removeSavedMarker,
    reloadSavedMarkers,
  };
}
