const sqlite3 = require('sqlite3');
const path = require('path');
const dbPath = path.resolve(process.cwd(), 'thoron.db');
const db = new sqlite3.Database(dbPath, (err) => {
    db.all(\"SELECT name FROM sqlite_master WHERE type='table'\", (err, rows) => {
        console.log(JSON.stringify(rows));
    });
});
