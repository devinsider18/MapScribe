import * as SQLite from 'expo-sqlite';
import { DEFAULT_LIST_TYPE } from '../constants/listCategories';

/**
 * @typedef {{ latitude: number, longitude: number }} Coordinate
 * @typedef {{
 *   id: number,
 *   latitude: number,
 *   longitude: number,
 *   title: string | null,
 *   listType: string | null
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
        listType TEXT DEFAULT '${DEFAULT_LIST_TYPE}'
      );

      CREATE TABLE IF NOT EXISTS saved_lists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE
      );

      CREATE TABLE IF NOT EXISTS list_icon_overrides (
        list_id TEXT PRIMARY KEY NOT NULL,
        emoji TEXT NOT NULL
      );
    `);

    const columns = db.getAllSync('PRAGMA table_info(markers)');
    if (!columns.some((column) => column.name === 'listType')) {
      db.execSync(`ALTER TABLE markers ADD COLUMN listType TEXT DEFAULT '${DEFAULT_LIST_TYPE}';`);
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
export function updateMarkerInDb(id, coordinate, title, listType) {
  try {
    const result = db.runSync(
      'UPDATE markers SET latitude = ?, longitude = ?, title = ?, listType = ? WHERE id = ?;',
      [coordinate.latitude, coordinate.longitude, title, listType, id]
    );
    if (result.changes === 0) throw new Error(`Saved place ${id} was not found.`);
  } catch (error) {
    console.error('Failed to update marker in database:', error);
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