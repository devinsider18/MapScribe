import { useState } from 'react';
import { addMarkerToDb, getMarkers, initDatabase } from '../api/database';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import {
  createInitialSavedMarkersState,
  saveMarkerToDatabase,
} from '../models/savedMarkers.mjs';

const markerStorage = {
  initialize: initDatabase,
  getAll: getMarkers,
  insert: addMarkerToDb,
};

export default function useSavedMarkers() {
  const [savedMarkersState, setSavedMarkersState] = useState(() =>
    createInitialSavedMarkersState(markerStorage, DEFAULT_LIST_TYPE)
  );

  const addSavedMarker = (coordinate, title, listType) => {
    const marker = saveMarkerToDatabase(markerStorage, coordinate, title, listType);

    setSavedMarkersState((current) => ({
      ...current,
      markers: [...current.markers, marker],
    }));
  };

  return {
    markers: savedMarkersState.markers,
    loadError: savedMarkersState.loadError,
    addSavedMarker,
  };
}
