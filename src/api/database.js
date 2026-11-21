import * as SQLite from 'expo-sqlite';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import { PLACE_PROGRESS } from '../constants/placeProgress.mjs';

/** @typedef {import('../types/domain').Coordinate} Coordinate */
/** @typedef {import('../types/domain').MarkerRow} MarkerRow */
/** @typedef {import('../types/domain').SavedListRow} SavedListRow */
/** @typedef {import('../types/domain').SavedTrip} SavedTrip */
/** @typedef {{ list_id: string, emoji: string }} ListIconOverride */
/** @typedef {{ list_id: string, color: string, bg: string }} ListColorOverride */

const db = SQLite.openDatabaseSync('mapscribe.db');

/** Initialize the SQLite schema and apply required migrations. */
export function initDatabase() {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        title TEXT,
        listType TEXT DEFAULT '${DEFAULT_LIST_TYPE}',
        photos TEXT NOT NULL DEFAULT '[]',
        progress TEXT NOT NULL DEFAULT '${PLACE_PROGRESS.unvisited}',
        notes TEXT NOT NULL DEFAULT '',
        visitedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS saved_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE
      );

      CREATE TABLE IF NOT EXISTS list_icon_overrides (
        list_id TEXT PRIMARY KEY NOT NULL,
        emoji TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS list_color_overrides (
        list_id TEXT PRIMARY KEY NOT NULL,
        color TEXT NOT NULL,
        bg TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS trip_stops (
        trip_id INTEGER NOT NULL,
        marker_id INTEGER NOT NULL,
        position INTEGER NOT NULL,
        PRIMARY KEY (trip_id, marker_id)
      );
    `);

    const columns = db.getAllSync('PRAGMA table_info(markers)');
    if (!columns.some((column) => column.name === 'listType')) {
      db.execSync(`ALTER TABLE markers ADD COLUMN listType TEXT DEFAULT '${DEFAULT_LIST_TYPE}';`);
    }
    if (!columns.some((column) => column.name === 'photos')) {
      db.execSync("ALTER TABLE markers ADD COLUMN photos TEXT NOT NULL DEFAULT '[]';");
    }
    if (!columns.some((column) => column.name === 'progress')) {
      db.execSync(
        `ALTER TABLE markers ADD COLUMN progress TEXT NOT NULL DEFAULT '${PLACE_PROGRESS.unvisited}';`
      );
    }
    if (!columns.some((column) => column.name === 'notes')) {
      db.execSync("ALTER TABLE markers ADD COLUMN notes TEXT NOT NULL DEFAULT '';");
    }
    if (!columns.some((column) => column.name === 'visitedAt')) {
      db.execSync('ALTER TABLE markers ADD COLUMN visitedAt TEXT;');
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/** @returns {MarkerRow[]} */
export function getMarkers() {
  try {
    return db.getAllSync('SELECT * FROM markers');
  } catch (error) {
    console.error('Failed to fetch markers from database:', error);
    throw error;
  }
}

/**
 * @param {Coordinate} coordinate
 * @param {string} title
 * @param {string} [listType]
 * @param {string} [notes]
 * @param {string | null} [visitedAt]
 * @returns {number}
 */
export function addMarkerToDb(
  coordinate,
  title,
  listType = DEFAULT_LIST_TYPE,
  notes = '',
  visitedAt = null
) {
  try {
    const result = db.runSync(
      'INSERT INTO markers (latitude, longitude, title, listType, notes, visitedAt) VALUES (?, ?, ?, ?, ?, ?);',
      [coordinate.latitude, coordinate.longitude, title, listType, notes, visitedAt]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to insert marker into database:', error);
    throw error;
  }
}

/**
 * @param {number} id
 * @param {Coordinate} coordinate
 * @param {string} title
 * @param {string} listType
 * @param {string[]} [photos]
 * @param {import('../types/domain').PlaceProgress} [progress]
 * @param {string} [notes]
 * @param {string | null} [visitedAt]
 */
export function updateMarkerInDb(
  id,
  coordinate,
  title,
  listType,
  photos = [],
  progress = PLACE_PROGRESS.unvisited,
  notes = '',
  visitedAt = null
) {
  try {
    const result = db.runSync(
      'UPDATE markers SET latitude = ?, longitude = ?, title = ?, listType = ?, photos = ?, progress = ?, notes = ?, visitedAt = ? WHERE id = ?;',
      [
        coordinate.latitude,
        coordinate.longitude,
        title,
        listType,
        JSON.stringify(photos),
        progress,
        notes,
        visitedAt,
        id,
      ]
    );
    if (result.changes === 0) throw new Error(`Saved place ${id} was not found.`);
  } catch (error) {
    console.error('Failed to update marker in database:', error);
    throw error;
  }
}

/**
 * @param {number} id
 * @param {string[]} photos
 */
export function updateMarkerPhotosInDb(id, photos) {
  try {
    const result = db.runSync(
      'UPDATE markers SET photos = ? WHERE id = ?;',
      [JSON.stringify(photos), id]
    );
    if (result.changes === 0) throw new Error(`Saved place ${id} was not found.`);
  } catch (error) {
    console.error('Failed to update saved place photos:', error);
    throw error;
  }
}

/**
 * @param {number} id
 * @param {import('../types/domain').PlaceProgress} progress
 */
export function updateMarkerProgressInDb(id, progress) {
  try {
    const result = db.runSync(
      'UPDATE markers SET progress = ? WHERE id = ?;',
      [progress, id]
    );
    if (result.changes === 0) throw new Error(`Saved place ${id} was not found.`);
  } catch (error) {
    console.error('Failed to update saved place progress:', error);
    throw error;
  }
}

/** @param {number} id */
export function deleteMarkerFromDb(id) {
  try {
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM trip_stops WHERE marker_id = ?;', [id]);
      const result = db.runSync('DELETE FROM markers WHERE id = ?;', [id]);
      if (result.changes === 0) throw new Error(`Saved place ${id} was not found.`);
    });
  } catch (error) {
    console.error('Failed to delete marker from database:', error);
    throw error;
  }
}

/** @returns {SavedListRow[]} */
export function getSavedLists() {
  try {
    return db.getAllSync('SELECT id, name FROM saved_lists ORDER BY id;');
  } catch (error) {
    console.error('Failed to fetch saved lists from database:', error);
    throw error;
  }
}

/** @param {string} name @returns {number} */
export function addSavedListToDb(name) {
  try {
    const result = db.runSync('INSERT INTO saved_lists (name) VALUES (?);', [name]);
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to insert saved list into database:', error);
    throw error;
  }
}

/**
 * @param {string} listId
 * @param {string} name
 */
export function renameSavedListInDb(listId, name) {
  try {
    const result = db.runSync(
      'UPDATE saved_lists SET name = ? WHERE id = ?;',
      [name, Number(listId.replace('custom_', ''))]
    );
    if (result.changes === 0) throw new Error(`Saved list ${listId} was not found.`);
  } catch (error) {
    console.error('Failed to rename saved list:', error);
    throw error;
  }
}

/** @param {string} listId */
export function deleteEmptySavedListFromDb(listId) {
  try {
    const numericId = Number(listId.replace('custom_', ''));
    const placeCount = db.getFirstSync(
      'SELECT COUNT(*) AS count FROM markers WHERE listType = ?;',
      [listId]
    );
    if (placeCount?.count > 0) {
      throw new Error('Move or remove all places before deleting this list.');
    }

    db.withTransactionSync(() => {
      db.runSync('DELETE FROM list_icon_overrides WHERE list_id = ?;', [listId]);
      db.runSync('DELETE FROM list_color_overrides WHERE list_id = ?;', [listId]);
      const result = db.runSync('DELETE FROM saved_lists WHERE id = ?;', [numericId]);
      if (result.changes === 0) throw new Error(`Saved list ${listId} was not found.`);
    });
  } catch (error) {
    console.error('Failed to delete saved list:', error);
    throw error;
  }
}

/** @returns {SavedTrip[]} */
export function getTrips() {
  try {
    const rows = db.getAllSync(`
      SELECT trips.id, trips.name, trips.start_date, trips.end_date,
             trip_stops.marker_id, trip_stops.position
      FROM trips
      LEFT JOIN trip_stops ON trip_stops.trip_id = trips.id
      ORDER BY trips.id, trip_stops.position;
    `);
    const trips = new Map();
    for (const row of rows) {
      if (!trips.has(row.id)) {
        trips.set(row.id, {
          id: row.id,
          name: row.name,
          startDate: row.start_date,
          endDate: row.end_date,
          markerIds: [],
        });
      }
      if (row.marker_id !== null) trips.get(row.id).markerIds.push(row.marker_id);
    }
    return [...trips.values()];
  } catch (error) {
    console.error('Failed to fetch trips from database:', error);
    throw error;
  }
}

/**
 * @param {string} name
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
export function addTripToDb(name, startDate, endDate) {
  try {
    const result = db.runSync(
      'INSERT INTO trips (name, start_date, end_date) VALUES (?, ?, ?);',
      [name, startDate, endDate]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Failed to create trip:', error);
    throw error;
  }
}

/**
 * @param {number} tripId
 * @param {string} name
 * @param {string} startDate
 * @param {string} endDate
 */
export function updateTripInDb(tripId, name, startDate, endDate) {
  try {
    const result = db.runSync(
      'UPDATE trips SET name = ?, start_date = ?, end_date = ? WHERE id = ?;',
      [name, startDate, endDate, tripId]
    );
    if (result.changes === 0) throw new Error(`Trip ${tripId} was not found.`);
  } catch (error) {
    console.error('Failed to update trip:', error);
    throw error;
  }
}

/** @param {number} tripId */
export function deleteTripFromDb(tripId) {
  try {
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM trip_stops WHERE trip_id = ?;', [tripId]);
      const result = db.runSync('DELETE FROM trips WHERE id = ?;', [tripId]);
      if (result.changes === 0) throw new Error(`Trip ${tripId} was not found.`);
    });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    throw error;
  }
}

/**
 * @param {number} tripId
 * @param {number[]} markerIds
 */
export function replaceTripStopsInDb(tripId, markerIds) {
  if (new Set(markerIds).size !== markerIds.length) {
    throw new Error('A place can only appear once in a trip.');
  }
  if (!markerIds.every((markerId) => Number.isInteger(markerId) && markerId > 0)) {
    throw new Error('Trip stops must reference saved places.');
  }
  try {
    db.withTransactionSync(() => {
      if (!db.getFirstSync('SELECT id FROM trips WHERE id = ?;', [tripId])) {
        throw new Error(`Trip ${tripId} was not found.`);
      }
      for (const markerId of markerIds) {
        if (!db.getFirstSync('SELECT id FROM markers WHERE id = ?;', [markerId])) {
          throw new Error(`Saved place ${markerId} was not found.`);
        }
      }
      db.runSync('DELETE FROM trip_stops WHERE trip_id = ?;', [tripId]);
      markerIds.forEach((markerId, position) => {
        db.runSync(
          'INSERT INTO trip_stops (trip_id, marker_id, position) VALUES (?, ?, ?);',
          [tripId, markerId, position]
        );
      });
    });
  } catch (error) {
    console.error('Failed to update trip stops:', error);
    throw error;
  }
}

/** @returns {ListIconOverride[]} */
export function getListIconOverrides() {
  try {
    return db.getAllSync('SELECT list_id, emoji FROM list_icon_overrides;');
  } catch (error) {
    console.error('Failed to fetch saved list icons from database:', error);
    throw error;
  }
}

/**
 * @param {string} listId
 * @param {string | null} emoji
 */
export function setListIconOverride(listId, emoji) {
  try {
    if (emoji) {
      db.runSync(
        'INSERT INTO list_icon_overrides (list_id, emoji) VALUES (?, ?) ON CONFLICT(list_id) DO UPDATE SET emoji = excluded.emoji;',
        [listId, emoji]
      );
    } else {
      db.runSync('DELETE FROM list_icon_overrides WHERE list_id = ?;', [listId]);
    }
  } catch (error) {
    console.error('Failed to update saved list icon in database:', error);
    throw error;
  }
}

/** @returns {ListColorOverride[]} */
export function getListColorOverrides() {
  try {
    return db.getAllSync('SELECT list_id, color, bg FROM list_color_overrides;');
  } catch (error) {
    console.error('Failed to fetch saved list colors from database:', error);
    throw error;
  }
}

/**
 * @param {string} listId
 * @param {{ color: string, bg: string } | null} colors
 */
export function setListColorOverride(listId, colors) {
  try {
    if (colors) {
      db.runSync(
        'INSERT INTO list_color_overrides (list_id, color, bg) VALUES (?, ?, ?) ON CONFLICT(list_id) DO UPDATE SET color = excluded.color, bg = excluded.bg;',
        [listId, colors.color, colors.bg]
      );
    } else {
      db.runSync('DELETE FROM list_color_overrides WHERE list_id = ?;', [listId]);
    }
  } catch (error) {
    console.error('Failed to update saved list color in database:', error);
    throw error;
  }
}