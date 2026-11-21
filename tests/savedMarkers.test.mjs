import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialSavedMarkersState,
  createSavedList,
  createSavedTrip,
  deleteEmptySavedList,
  deleteSavedTrip,
  deleteSavedMarker,
  loadTrips,
  loadListIconOverrides,
  loadListColorOverrides,
  loadSavedMarkers,
  saveListIcon,
  saveListColor,
  saveMarkerToDatabase,
  renameSavedList,
  updateSavedTrip,
  updateSavedTripStops,
  updateSavedMarker,
  updateSavedMarkerPhotos,
  updateSavedMarkerProgress,
} from '../src/models/savedMarkers.mjs';
import { getNextPlaceProgress, PLACE_PROGRESS } from '../src/constants/placeProgress.mjs';

function createStorage({
  markers = [],
  lists = [],
  listIconOverrides = [],
  listColorOverrides = [],
  trips = [],
  insertId = 1,
  listInsertId = 1,
  error = null,
} = {}) {
  return {
    initialize() {
      if (error) throw error;
    },
    getAll() {
      if (error) throw error;
      return markers;
    },
    getLists() {
      if (error) throw error;
      return lists;
    },
    getListIconOverrides() {
      if (error) throw error;
      return listIconOverrides;
    },
    getListColorOverrides() {
      if (error) throw error;
      return listColorOverrides;
    },
    getTrips() {
      if (error) throw error;
      return trips;
    },
    insert(coordinate, title, listType, notes, visitedAt) {
      if (error) throw error;
      this.inserted = { coordinate, title, listType, notes, visitedAt };
      return insertId;
    },
    insertList(name) {
      if (error) throw error;
      this.insertedListName = name;
      return listInsertId;
    },
    renameList(listId, name) {
      if (error) throw error;
      this.renamedList = { listId, name };
    },
    deleteList(listId) {
      if (error) throw error;
      this.deletedListId = listId;
    },
    insertTrip(name, startDate, endDate) {
      if (error) throw error;
      this.insertedTrip = { name, startDate, endDate };
      return 4;
    },
    updateTrip(id, name, startDate, endDate) {
      if (error) throw error;
      this.updatedTrip = { id, name, startDate, endDate };
    },
    deleteTrip(id) {
      if (error) throw error;
      this.deletedTripId = id;
    },
    setTripStops(tripId, markerIds) {
      if (error) throw error;
      this.tripStops = { tripId, markerIds };
    },
    setListIcon(listId, emoji) {
      if (error) throw error;
      this.savedIcon = { listId, emoji };
    },
    setListColor(listId, colors) {
      if (error) throw error;
      this.savedColor = { listId, colors };
    },
    update(id, coordinate, title, listType, photos, progress, notes, visitedAt) {
      if (error) throw error;
      this.updated = { id, coordinate, title, listType, photos, progress, notes, visitedAt };
    },
    updatePhotos(id, photos) {
      if (error) throw error;
      this.updatedPhotos = { id, photos };
    },
    updateProgress(id, progress) {
      if (error) throw error;
      this.updatedProgress = { id, progress };
    },
    delete(id) {
      if (error) throw error;
      this.deletedId = id;
    },
  };
}

test('loads saved markers and applies the default list to legacy rows', () => {
  const storage = createStorage({
    markers: [
      { id: 8, latitude: 51.5, longitude: -0.1, title: 'Museum', listType: null },
      {
        id: 9,
        latitude: 51.6,
        longitude: -0.2,
        title: null,
        listType: 'favorites',
        photos: '["file:///places/museum.jpg"]',
        progress: PLACE_PROGRESS.visited,
        notes: 'Quiet in the morning',
        visitedAt: '2024-06-10',
      },
    ],
  });

  assert.deepEqual(loadSavedMarkers(storage, 'want_to_go'), [
    {
      id: 8,
      coordinate: { latitude: 51.5, longitude: -0.1 },
      title: 'Museum',
      listType: 'want_to_go',
      photos: [],
      progress: PLACE_PROGRESS.unvisited,
      notes: '',
      visitedAt: null,
    },
    {
      id: 9,
      coordinate: { latitude: 51.6, longitude: -0.2 },
      title: '',
      listType: 'favorites',
      photos: ['file:///places/museum.jpg'],
      progress: PLACE_PROGRESS.visited,
      notes: 'Quiet in the morning',
      visitedAt: '2024-06-10',
    },
  ]);
});

test('loads corrupted photo JSON as an empty gallery', () => {
  const storage = createStorage({
    markers: [
      { id: 10, latitude: 51.5, longitude: -0.1, title: 'Museum', photos: '{broken' },
    ],
  });

  assert.deepEqual(loadSavedMarkers(storage, 'want_to_go')[0].photos, []);
});

test('falls back to the default progress for an unsupported stored value', () => {
  const storage = createStorage({
    markers: [
      {
        id: 11,
        latitude: 51.5,
        longitude: -0.1,
        title: 'Museum',
        progress: 'archived',
      },
    ],
  });

  assert.equal(
    loadSavedMarkers(storage, 'want_to_go')[0].progress,
    PLACE_PROGRESS.unvisited
  );
});

test('returns a visible load error when storage initialization fails', () => {
  const state = createInitialSavedMarkersState(
    createStorage({ error: new Error('disk error') }),
    'want_to_go'
  );

  assert.deepEqual(state, {
    markers: [],
    customLists: [],
    trips: [],
    listIconOverrides: {},
    listColorOverrides: {},
    loadError: 'Saved places could not be loaded.',
  });
});

test('creates a custom list and returns its category for the app UI', () => {
  const storage = createStorage({ listInsertId: 7 });

  assert.deepEqual(createSavedList(storage, '  Coffee shops  '), {
    id: 'custom_7',
    label: 'Coffee shops',
    icon: 'folder',
    color: '#984061',
    bg: '#FFD8E6',
  });
  assert.equal(storage.insertedListName, 'Coffee shops');
});

test('rejects empty and duplicate custom list names', () => {
  const storage = createStorage({ lists: [{ id: 2, name: 'Coffee shops' }] });

  assert.throws(() => createSavedList(storage, '  '), /name is required/);
  assert.throws(() => createSavedList(storage, 'coffee shops'), /already exists/);
  assert.throws(() => createSavedList(createStorage(), 'favorites', ['Favorites']), /already exists/);
});

test('loads and persists emoji overrides for built-in or custom lists', () => {
  const storage = createStorage({
    listIconOverrides: [{ list_id: 'favorites', emoji: '🌟' }],
  });

  assert.deepEqual(loadListIconOverrides(storage), { favorites: '🌟' });
  saveListIcon(storage, 'custom_4', '☕');
  assert.deepEqual(storage.savedIcon, { listId: 'custom_4', emoji: '☕' });
});

test('loads, persists, and clears per-list color overrides', () => {
  const colors = { color: '#1967D2', bg: '#E8F0FE' };
  const storage = createStorage({
    listColorOverrides: [{ list_id: 'favorites', ...colors }],
  });

  assert.deepEqual(loadListColorOverrides(storage), { favorites: colors });
  saveListColor(storage, 'custom_3', colors);
  assert.deepEqual(storage.savedColor, { listId: 'custom_3', colors });
  saveListColor(storage, 'favorites', null);
  assert.deepEqual(storage.savedColor, { listId: 'favorites', colors: null });
});

test('persists a marker before returning its map representation', () => {
  const storage = createStorage({ insertId: 12 });
  const coordinate = { latitude: 40.7, longitude: -74 };
  const marker = saveMarkerToDatabase(storage, coordinate, 'Library', 'favorites');

  assert.deepEqual(storage.inserted, {
    coordinate,
    title: 'Library',
    listType: 'favorites',
    notes: '',
    visitedAt: null,
  });
  assert.deepEqual(marker, {
    id: 12,
    coordinate,
    title: 'Library',
    listType: 'favorites',
    photos: [],
    progress: PLACE_PROGRESS.unvisited,
    notes: '',
    visitedAt: null,
  });
});

test('does not return a saved marker when persistence fails', () => {
  const storage = createStorage({ error: new Error('disk error') });

  assert.throws(() => saveMarkerToDatabase(storage, { latitude: 0, longitude: 0 }, 'Place', 'favorites'));
});

test('persists updated marker details before returning the updated marker', () => {
  const storage = createStorage();
  const coordinate = { latitude: 48.8, longitude: 2.3 };

  assert.deepEqual(
    updateSavedMarker(storage, 12, coordinate, 'New title', 'favorites'),
    {
      id: 12,
      coordinate,
      title: 'New title',
      listType: 'favorites',
      photos: [],
      progress: PLACE_PROGRESS.unvisited,
      notes: '',
      visitedAt: null,
    }
  );
  assert.deepEqual(storage.updated, {
    id: 12,
    coordinate,
    title: 'New title',
    listType: 'favorites',
    photos: [],
    progress: PLACE_PROGRESS.unvisited,
    notes: '',
    visitedAt: null,
  });
});

test('does not return updated marker details when persistence fails', () => {
  const storage = createStorage({ error: new Error('disk error') });

  assert.throws(() => (
    updateSavedMarker(storage, 12, { latitude: 0, longitude: 0 }, 'Place', 'favorites')
  ));
});

test('deletes a marker from persistent storage', () => {
  const storage = createStorage();

  deleteSavedMarker(storage, 12);

  assert.equal(storage.deletedId, 12);
});

test('does not report a deleted marker when persistence fails', () => {
  const storage = createStorage({ error: new Error('disk error') });

  assert.throws(() => deleteSavedMarker(storage, 12));
});

test('persists photos and progress independently and cycles status in order', () => {
  const storage = createStorage();
  const photos = ['file:///places/cafe.jpg'];

  assert.deepEqual(updateSavedMarkerPhotos(storage, 12, photos), photos);
  assert.deepEqual(storage.updatedPhotos, { id: 12, photos });
  assert.equal(updateSavedMarkerProgress(storage, 12, PLACE_PROGRESS.planned), PLACE_PROGRESS.planned);
  assert.deepEqual(storage.updatedProgress, { id: 12, progress: PLACE_PROGRESS.planned });
  assert.equal(getNextPlaceProgress(PLACE_PROGRESS.unvisited), PLACE_PROGRESS.planned);
  assert.equal(getNextPlaceProgress(PLACE_PROGRESS.planned), PLACE_PROGRESS.visited);
  assert.equal(getNextPlaceProgress(PLACE_PROGRESS.visited), PLACE_PROGRESS.unvisited);
});

test('rejects photo galleries that exceed the per-place limit', () => {
  const storage = createStorage();
  const photos = Array.from({ length: 6 }, (_, index) => `file:///places/${index}.jpg`);

  assert.throws(() => updateSavedMarkerPhotos(storage, 12, photos), /at most 5 photos/);
  assert.equal(storage.updatedPhotos, undefined);
});

test('renames custom lists and rejects names used by another list or built-in category', () => {
  const storage = createStorage({ lists: [{ id: 7, name: 'Coffee' }, { id: 8, name: 'Parks' }] });
  assert.equal(renameSavedList(storage, 'custom_7', '  Cafes  ').label, 'Cafes');
  assert.deepEqual(storage.renamedList, { listId: 'custom_7', name: 'Cafes' });
  assert.throws(() => renameSavedList(storage, 'custom_7', 'Parks'), /already exists/);
  assert.throws(() => renameSavedList(storage, 'custom_7', 'Favorites', ['Favorites']), /already exists/);
});

test('only allows deleting empty custom lists', () => {
  const storage = createStorage({
    markers: [{ id: 3, listType: 'custom_7' }],
  });
  assert.throws(() => deleteEmptySavedList(storage, 'custom_7'), /must be empty|all places/);
  assert.equal(storage.deletedListId, undefined);
  deleteEmptySavedList(createStorage(), 'custom_7');
});

test('creates trips with validated date ranges and persists ordered stops', () => {
  const storage = createStorage();
  const trip = createSavedTrip(storage, {
    name: '  Weekend away ',
    startDate: '2025-05-01',
    endDate: '2025-05-03',
  });
  assert.deepEqual(trip, {
    id: 4,
    name: 'Weekend away',
    startDate: '2025-05-01',
    endDate: '2025-05-03',
    markerIds: [],
  });
  assert.deepEqual(storage.insertedTrip, {
    name: 'Weekend away',
    startDate: '2025-05-01',
    endDate: '2025-05-03',
  });
  assert.throws(() => createSavedTrip(storage, {
    name: 'Invalid',
    startDate: '2025-05-04',
    endDate: '2025-05-03',
  }), /before its start date/);
  assert.deepEqual(updateSavedTrip(storage, 4, {
    name: 'Updated trip',
    startDate: '2025-05-02',
    endDate: '2025-05-04',
  }), {
    name: 'Updated trip',
    startDate: '2025-05-02',
    endDate: '2025-05-04',
  });
  assert.deepEqual(storage.updatedTrip, {
    id: 4,
    name: 'Updated trip',
    startDate: '2025-05-02',
    endDate: '2025-05-04',
  });
  assert.deepEqual(updateSavedTripStops(storage, 4, [9, 3]), [9, 3]);
  assert.deepEqual(storage.tripStops, { tripId: 4, markerIds: [9, 3] });
  assert.throws(() => updateSavedTripStops(storage, 4, [9, 9]), /once in a trip/);
  deleteSavedTrip(storage, 4);
  assert.equal(storage.deletedTripId, 4);
});

test('loads saved trips from storage', () => {
  const trips = [{
    id: 2,
    name: 'City break',
    startDate: '2025-05-01',
    endDate: '2025-05-02',
    markerIds: [1, 5],
  }];
  assert.deepEqual(loadTrips(createStorage({ trips })), trips);
});

test('persists place notes and validates optional visit dates', () => {
  const storage = createStorage({ insertId: 13 });
  const marker = saveMarkerToDatabase(
    storage,
    { latitude: 0, longitude: 0 },
    'Garden',
    'want_to_go',
    [],
    undefined,
    'Loved the old trees',
    '2025-04-20'
  );
  assert.equal(marker.notes, 'Loved the old trees');
  assert.equal(marker.visitedAt, '2025-04-20');
  assert.deepEqual(storage.inserted, {
    coordinate: { latitude: 0, longitude: 0 },
    title: 'Garden',
    listType: 'want_to_go',
    notes: 'Loved the old trees',
    visitedAt: '2025-04-20',
  });
  assert.throws(() => saveMarkerToDatabase(
    storage,
    { latitude: 0, longitude: 0 },
    'Invalid',
    'want_to_go',
    [],
    undefined,
    '',
    '2025-02-31'
  ), /valid visit date/);
});
