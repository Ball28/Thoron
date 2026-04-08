import sqlite3 from 'sqlite3';
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run('CREATE TABLE a (id INTEGER)');
    db.run('ALTER TABLE a ADD COLUMN id INTEGER', (err) => {
        if (err) console.log('CAUGHT ERR:', err.message);
    });
    db.run('CREATE TABLE b (id INTEGER)');
});
setTimeout(() => {
    db.all(\"SELECT name FROM sqlite_master WHERE type='table'\", (err, rows) => {
        console.log('TABLES:', rows);
    });
}, 500);
