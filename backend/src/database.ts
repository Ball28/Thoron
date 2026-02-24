import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../thoron.db');

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
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
      mcNumber TEXT,
      dotNumber TEXT,
      contactName TEXT,
      contactEmail TEXT,
      contactPhone TEXT,
      insuranceLimit REAL DEFAULT 100000,
      serviceLevel TEXT,
      modes TEXT,
      onTimeRate REAL DEFAULT 0.95,
      claimRate REAL DEFAULT 0.01,
      rating REAL DEFAULT 4.0,
      status TEXT DEFAULT 'Active',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Migration: silently add any columns missing from older DB versions
    const migrations = [
      `ALTER TABLE carriers ADD COLUMN mcNumber TEXT`,
      `ALTER TABLE carriers ADD COLUMN dotNumber TEXT`,
      `ALTER TABLE carriers ADD COLUMN contactName TEXT`,
      `ALTER TABLE carriers ADD COLUMN contactEmail TEXT`,
      `ALTER TABLE carriers ADD COLUMN contactPhone TEXT`,
      `ALTER TABLE carriers ADD COLUMN insuranceLimit REAL DEFAULT 100000`,
      `ALTER TABLE carriers ADD COLUMN modes TEXT`,
      `ALTER TABLE carriers ADD COLUMN onTimeRate REAL DEFAULT 0.95`,
      `ALTER TABLE carriers ADD COLUMN claimRate REAL DEFAULT 0.01`,
      `ALTER TABLE carriers ADD COLUMN status TEXT DEFAULT 'Active'`,
    ];
    migrations.forEach(sql => {
      db.run(sql, (err) => { /* ignore "duplicate column" errors */ });
    });

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
      status TEXT DEFAULT 'Pending',
      carrierId INTEGER,
      trackingNumber TEXT,
      estimatedDelivery TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(carrierId) REFERENCES carriers(id)
    )`);

    // Shipment Events / Milestones table
    db.run(`CREATE TABLE IF NOT EXISTS shipment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER NOT NULL,
      eventType TEXT NOT NULL,
      location TEXT,
      message TEXT,
      eventTime DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(shipmentId) REFERENCES shipments(id)
    )`);

    // Seed demo data if shipments is empty
    db.get('SELECT COUNT(*) as count FROM shipments', (err: Error | null, row: any) => {
      if (!err && row && row.count === 0) {
        seedDemoShipments();
      }
    });

    // Seed carriers if empty
    db.get('SELECT COUNT(*) as count FROM carriers', (err: Error | null, row: any) => {
      if (!err && row && row.count === 0) {
        seedCarriers();
      }
    });
  });
}

function seedDemoShipments() {
  const shipments = [
    ['Chicago, IL', 'Dallas, TX', 1850, '48x40x48', '70', 'In Transit', 1, 'OLD-4491-2024', '2026-02-26'],
    ['Atlanta, GA', 'Los Angeles, CA', 3400, '96x48x60', '85', 'In Transit', 2, 'XPO-8823-2024', '2026-02-27'],
    ['New York, NY', 'Miami, FL', 920, '48x48x36', '55', 'Delivered', 3, 'FDX-2211-2024', '2026-02-23'],
    ['Seattle, WA', 'Phoenix, AZ', 2100, '80x48x52', '92.5', 'Exception', 4, 'EST-9944-2024', '2026-02-25'],
    ['Houston, TX', 'Denver, CO', 660, '40x32x28', '50', 'Dispatched', 5, 'WNR-5512-2024', '2026-02-28'],
    ['Boston, MA', 'Charlotte, NC', 450, '36x24x24', '50', 'Pending', 1, null, '2026-03-01'],
  ];

  const stmt = db.prepare(`
    INSERT INTO shipments (origin, destination, weight, dimensions, freightClass, status, carrierId, trackingNumber, estimatedDelivery)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  shipments.forEach(s => stmt.run(...s as any));
  stmt.finalize(() => {
    // Seed milestone events for the in-transit/delivered/exception shipments
    const events: any[] = [
      // Shipment 1: In Transit (Chicago → Dallas)
      [1, 'Picked Up', 'Chicago, IL', 'Shipment picked up from origin', '2026-02-24 08:00:00'],
      [1, 'Departed Terminal', 'Chicago IL Hub', 'Departed Chicago hub', '2026-02-24 14:30:00'],
      [1, 'In Transit', 'St. Louis, MO', 'En route to destination', '2026-02-25 06:15:00'],
      // Shipment 2: In Transit (Atlanta → LA)
      [2, 'Picked Up', 'Atlanta, GA', 'Shipment picked up from origin', '2026-02-23 09:00:00'],
      [2, 'Departed Terminal', 'Atlanta GA Hub', 'Departed Atlanta hub', '2026-02-23 17:00:00'],
      [2, 'In Transit', 'Dallas, TX', 'En route — on schedule', '2026-02-24 11:30:00'],
      // Shipment 3: Delivered (NY → Miami)
      [3, 'Picked Up', 'New York, NY', 'Shipment picked up', '2026-02-21 07:30:00'],
      [3, 'In Transit', 'Philadelphia, PA', 'Moving south on I-95', '2026-02-21 13:00:00'],
      [3, 'Out for Delivery', 'Miami, FL', 'Out for final delivery', '2026-02-23 07:45:00'],
      [3, 'Delivered', 'Miami, FL', 'Delivered and signed for by M. Garcia', '2026-02-23 11:20:00'],
      // Shipment 4: Exception (Seattle → Phoenix)
      [4, 'Picked Up', 'Seattle, WA', 'Shipment picked up', '2026-02-23 10:00:00'],
      [4, 'In Transit', 'Portland, OR', 'Moving south on I-5', '2026-02-23 15:00:00'],
      [4, 'Exception', 'Sacramento, CA', '⚠️ Mechanical delay — trailer breakdown. ETA pushed 24hrs.', '2026-02-24 09:00:00'],
      // Shipment 5: Dispatched (Houston → Denver)
      [5, 'Dispatched', 'Houston, TX', 'Driver assigned and en route to pickup', '2026-02-24 06:00:00'],
    ];

    const evtStmt = db.prepare(`
      INSERT INTO shipment_events (shipmentId, eventType, location, message, eventTime)
      VALUES (?, ?, ?, ?, ?)
    `);
    events.forEach(e => evtStmt.run(...e));
    evtStmt.finalize(() => console.log('Seeded demo shipments and events.'));
  });
}

function seedCarriers() {
  const carriers = [
    ['FedEx Freight', 'MC-299007', 'DOT-0226516', 'James Holloway', 'j.holloway@fedexfreight.com', '1-800-463-3339', 1000000, 'Priority', 'LTL,FTL', 0.97, 0.005, 4.8, 'Active'],
    ['XPO Logistics', 'MC-107672', 'DOT-0023389', 'Sarah Chen', 's.chen@xpo.com', '1-844-742-5976', 500000, 'Standard', 'LTL,FTL,Intermodal', 0.93, 0.012, 4.4, 'Active'],
    ['Old Dominion Freight', 'MC-209676', 'DOT-0082619', 'Marcus Webb', 'm.webb@odfl.com', '1-800-432-6335', 750000, 'Guaranteed', 'LTL', 0.99, 0.003, 4.9, 'Active'],
    ['Estes Express Lines', 'MC-029405', 'DOT-0029405', 'Diane Forrest', 'd.forrest@estes-express.com', '1-804-353-1900', 500000, 'Standard', 'LTL', 0.94, 0.008, 4.5, 'Active'],
    ['Werner Enterprises', 'MC-112923', 'DOT-0070278', 'Tom Brierly', 't.brierly@werner.com', '1-800-228-2240', 1000000, 'Standard', 'FTL,Temp Controlled', 0.95, 0.006, 4.6, 'Active'],
    ['Spot Carrier LLC', 'MC-887412', 'DOT-0344892', 'Al Martinez', 'a.martinez@spotcarrier.com', '555-209-4471', 100000, 'Spot', 'FTL', 0.88, 0.020, 3.7, 'Pending'],
  ];

  const stmt = db.prepare(`
    INSERT INTO carriers (name, mcNumber, dotNumber, contactName, contactEmail, contactPhone, insuranceLimit, serviceLevel, modes, onTimeRate, claimRate, rating, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  carriers.forEach(c => stmt.run(...c as any));
  stmt.finalize(() => console.log('Seeded 6 demo carriers.'));
}
