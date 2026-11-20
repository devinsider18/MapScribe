import * as SQLite from 'expo-sqlite';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';
import { PLACE_PROGRESS } from '../constants/placeProgress.mjs';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
 * @typedef {{
 *   id: number,
 *   latitude: number,
 *   longitude: number,
 *   title: string | null,
 *   listType: string | null,
 *   photos: string | null,
 *   progress: string | null
 * }} MarkerRow
 * @typedef {{ id: number, name: string }} SavedListRow
 * @typedef {{ list_id: string, emoji: string }} ListIconOverride
 */

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
        progress TEXT NOT NULL DEFAULT '${PLACE_PROGRESS.unvisited}'
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
 * @returns {number}
 */
export function addMarkerToDb(coordinate, title, listType = DEFAULT_LIST_TYPE) {
  try {
    const result = db.runSync(
      'INSERT INTO markers (latitude, longitude, title, listType) VALUES (?, ?, ?, ?);',
      [coordinate.latitude, coordinate.longitude, title, listType]
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
 */
export function updateMarkerInDb(
  id,
  coordinate,
  title,
  listType,
  photos = [],
  progress = PLACE_PROGRESS.unvisited
) {
  try {
    const result = db.runSync(
      'UPDATE markers SET latitude = ?, longitude = ?, title = ?, listType = ?, photos = ?, progress = ? WHERE id = ?;',
      [
        coordinate.latitude,
        coordinate.longitude,
        title,
        listType,
        JSON.stringify(photos),
        progress,
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
 * @param {string} progress
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
    const result = db.runSync('DELETE FROM markers WHERE id = ?;', [id]);
    if (result.changes === 0) throw new Error(`Saved place ${id} was not found.`);
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

/** @returns {Array<{ list_id: string, color: string, bg: string }>} */
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