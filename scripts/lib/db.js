const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_DIR = path.join(__dirname, "..", "..", "db");

function dbPath(type) {
  return path.join(DB_DIR, `${type}-database.sqlite`);
}

function dbExists(type) {
  return fs.existsSync(dbPath(type));
}

function deleteDb(type) {
  const file = dbPath(type);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function openDb(type) {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(dbPath(type));
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

/**
 * Runs `count` inserts through `insertFn(i)` inside a single transaction
 * for speed, reporting progress via `onProgress`.
 */
function seedTable(db, count, insertFn, onProgress) {
  const run = db.transaction((n) => {
    for (let i = 0; i < n; i++) {
      insertFn(i);
      if (onProgress && i % 1000 === 0) onProgress(i, n);
    }
  });
  run(count);
  if (onProgress) onProgress(count, count);
}

module.exports = {
  DB_DIR,
  dbPath,
  dbExists,
  deleteDb,
  openDb,
  seedTable,
};
