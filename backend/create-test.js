import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'thoron.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
});

db.serialize(() => {
  // try to create the users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          passwordHash TEXT,
          role TEXT NOT NULL,
          department TEXT,
          tenantId TEXT DEFAULT 'default',
          lastLogin DATETIME,
          status TEXT DEFAULT 'Active',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
    (err) => {
      if (err) console.error('CREATE ERROR:', err);
      else console.log('Successfully created or checked users table');
    }
  );

  // try to list tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) console.error('SELECT ERR:', err);
    else console.log('TABLES:', rows);
  });
});
