import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialSavedMarkersState,
  loadSavedMarkers,
  saveMarkerToDatabase,
} from '../src/models/savedMarkers.mjs';

function createStorage({ markers = [], insertId = 1, error = null } = {}) {
  return {
    initialize() {
      if (error) throw error;
    },
    getAll() {
      if (error) throw error;
      return markers;
    },
    insert(coordinate, title, listType) {
      if (error) throw error;
      this.inserted = { coordinate, title, listType };
      return insertId;
    },
  };
}

test('loads saved markers and applies the default list to legacy rows', () => {
  const storage = createStorage({
    markers: [
      { id: 8, latitude: 51.5, longitude: -0.1, title: 'Museum', listType: null },
    ],
  });

  assert.deepEqual(loadSavedMarkers(storage, 'want_to_go'), [
    {
      id: 8,
      coordinate: { latitude: 51.5, longitude: -0.1 },
      title: 'Museum',
      listType: 'want_to_go',
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
    loadError: 'Saved places could not be loaded.',
  });
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
  });
});

test('does not return a saved marker when persistence fails', () => {
  const storage = createStorage({ error: new Error('disk error') });

  assert.throws(() => saveMarkerToDatabase(storage, { latitude: 0, longitude: 0 }, 'Place', 'favorites'));
});
