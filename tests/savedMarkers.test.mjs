import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialSavedMarkersState,
  createSavedList,
  deleteSavedMarker,
  loadListIconOverrides,
  loadListColorOverrides,
  loadSavedMarkers,
  saveListIcon,
  saveListColor,
  saveMarkerToDatabase,
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
    insert(coordinate, title, listType) {
      if (error) throw error;
      this.inserted = { coordinate, title, listType };
      return insertId;
    },
    insertList(name) {
      if (error) throw error;
      this.insertedListName = name;
      return listInsertId;
    },
    setListIcon(listId, emoji) {
      if (error) throw error;
      this.savedIcon = { listId, emoji };
    },
    setListColor(listId, colors) {
      if (error) throw error;
      this.savedColor = { listId, colors };
    },
    update(id, coordinate, title, listType, photos, progress) {
      if (error) throw error;
      this.updated = { id, coordinate, title, listType, photos, progress };
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
    },
    {
      id: 9,
      coordinate: { latitude: 51.6, longitude: -0.2 },
      title: '',
      listType: 'favorites',
      photos: ['file:///places/museum.jpg'],
      progress: PLACE_PROGRESS.visited,
    },
  ]);
});

test('returns a visible load error when storage initialization fails', () => {
  const state = createInitialSavedMarkersState(
    createStorage({ error: new Error('disk error') }),
    'want_to_go'
  );

  assert.deepEqual(state, {
    markers: [],
    customLists: [],
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
  });
  assert.deepEqual(marker, {
    id: 12,
    coordinate,
    title: 'Library',
    listType: 'favorites',
    photos: [],
    progress: PLACE_PROGRESS.unvisited,
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
    }
  );
  assert.deepEqual(storage.updated, {
    id: 12,
    coordinate,
    title: 'New title',
    listType: 'favorites',
    photos: [],
    progress: PLACE_PROGRESS.unvisited,
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
