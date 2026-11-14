export function loadSavedMarkers(storage, defaultListType) {
  storage.initialize();

  return storage.getAll().map((marker) => ({
    id: marker.id,
    coordinate: { latitude: marker.latitude, longitude: marker.longitude },
    title: marker.title,
    listType: marker.listType || defaultListType,
  }));
}

export function createInitialSavedMarkersState(storage, defaultListType) {
  try {
    return {
      markers: loadSavedMarkers(storage, defaultListType),
      loadError: null,
    };
  } catch {
    return {
      markers: [],
      loadError: 'Saved places could not be loaded.',
    };
  }
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
