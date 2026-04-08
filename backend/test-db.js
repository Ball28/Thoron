import sqlite3 from 'sqlite3';
import path from 'path';
const dbPath = path.resolve(process.cwd(), 'thoron.db');
const db = new sqlite3.Database(dbPath, (err) => {
    db.all(\"SELECT name FROM sqlite_master WHERE type='table'\", (err, rows) => {
        console.log(JSON.stringify(rows));
    });
});
