import { useCallback, useState } from 'react';
import {
  addMarkerToDb,
  deleteMarkerFromDb,
  getMarkers,
  initDatabase,
  updateMarkerInDb,
} from '../api/database';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import {
  createInitialSavedMarkersState,
  deleteSavedMarker,
  loadSavedMarkers,
  saveMarkerToDatabase,
  updateSavedMarker,
} from '../models/savedMarkers.mjs';

const markerStorage = {
  initialize: initDatabase,
  getAll: getMarkers,
  insert: addMarkerToDb,
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

  return {
    markers: savedMarkersState.markers,
    loadError: savedMarkersState.loadError,
    addSavedMarker,
    updateSavedMarker: updateExistingMarker,
    deleteSavedMarker: removeSavedMarker,
    reloadSavedMarkers,
  };
}
