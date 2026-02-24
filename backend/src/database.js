import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../thoron.db');
export const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    }
    else {
        console.log('Connected to the SQLite database.');
        initializeDatabase();
    }
});
function initializeDatabase() {
    db.serialize(() => {
        // Carriers Table
        db.run(`CREATE TABLE IF NOT EXISTS carriers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rating REAL,
      serviceLevel TEXT
    )`);
        // Lanes Table
        db.run(`CREATE TABLE IF NOT EXISTS lanes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrierId INTEGER,
      originZone TEXT,
      destinationZone TEXT,
      FOREIGN KEY(carrierId) REFERENCES carriers(id)
    )`);
        // Rates Table
        db.run(`CREATE TABLE IF NOT EXISTS rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrierId INTEGER,
      laneId INTEGER,
      freightClass TEXT,
      baseRate REAL,
      fuelSurcharge REAL,
      FOREIGN KEY(carrierId) REFERENCES carriers(id),
      FOREIGN KEY(laneId) REFERENCES lanes(id)
    )`);
        // Shipments Table
        db.run(`CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      weight REAL NOT NULL,
      dimensions TEXT,
      freightClass TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Dispatched', 'In Transit', 'Delivered', 'Exception')),
      carrierId INTEGER,
      trackingNumber TEXT,
      estimatedDelivery TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(carrierId) REFERENCES carriers(id)
    )`);
    });
}
//# sourceMappingURL=database.js.map