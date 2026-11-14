import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('mapscribe.db');

export function initDatabase() {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        title TEXT,
        listType TEXT DEFAULT 'want_to_go'
      );
    `);

    const columns = db.getAllSync('PRAGMA table_info(markers)');
    if (!columns.some((column) => column.name === 'listType')) {
      db.execSync("ALTER TABLE markers ADD COLUMN listType TEXT DEFAULT 'want_to_go';");
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getMarkers() {
  try {
    return db.getAllSync('SELECT * FROM markers');
  } catch (error) {
    console.error('Failed to fetch markers from database:', error);
    throw error;
  }
}

export function addMarkerToDb(coordinate, title, listType = 'want_to_go') {
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