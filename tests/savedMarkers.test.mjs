import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createInitialSavedMarkersState,
  deleteSavedMarker,
  loadSavedMarkers,
  saveMarkerToDatabase,
  updateSavedMarker,
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
    update(id, coordinate, title, listType) {
      if (error) throw error;
      this.updated = { id, coordinate, title, listType };
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

test('persists updated marker details before returning the updated marker', () => {
  const storage = createStorage();
  const coordinate = { latitude: 48.8, longitude: 2.3 };

  assert.deepEqual(
    updateSavedMarker(storage, 12, coordinate, 'New title', 'favorites'),
    { id: 12, coordinate, title: 'New title', listType: 'favorites' }
  );
  assert.deepEqual(storage.updated, {
    id: 12,
    coordinate,
    title: 'New title',
    listType: 'favorites',
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
