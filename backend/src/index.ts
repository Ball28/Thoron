import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { db } from './database.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Thoron API is running' });
});

// --- Shipments API ---
app.get('/api/shipments', (req: Request, res: Response) => {
    db.all('SELECT * FROM shipments', [], (err: Error | null, rows: any[]) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.post('/api/shipments', (req: Request, res: Response) => {
    const { origin, destination, weight, dimensions, freightClass, status, carrierId, trackingNumber, estimatedDelivery } = req.body;
    const query = `
    INSERT INTO shipments (origin, destination, weight, dimensions, freightClass, status, carrierId, trackingNumber, estimatedDelivery) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    db.run(query, [origin, destination, weight, dimensions, freightClass, status || 'Pending', carrierId, trackingNumber, estimatedDelivery], function (this: any, err: Error | null) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Shipment created successfully' });
    });
});

// --- Rates/Quotes API ---
app.post('/api/quotes', (req: Request, res: Response) => {
    const quotes = [
        { carrier: 'FedEx Freight', service: 'Priority', rate: 450.00, transitDays: 2, score: 95 },
        { carrier: 'XPO Logistics', service: 'Standard', rate: 320.00, transitDays: 4, score: 88 },
        { carrier: 'Old Dominion', service: 'Guaranteed', rate: 510.00, transitDays: 2, score: 98 },
    ];
    quotes.sort((a, b) => b.score - a.score);
    res.json(quotes);
});

// --- Carriers API ---
app.get('/api/carriers', (req: Request, res: Response) => {
    db.all('SELECT * FROM carriers ORDER BY rating DESC', [], (err: Error | null, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/carriers/:id', (req: Request, res: Response) => {
    db.get('SELECT * FROM carriers WHERE id = ?', [req.params.id], (err: Error | null, row: any) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Carrier not found' });
        res.json(row);
    });
});

app.post('/api/carriers', (req: Request, res: Response) => {
    const { name, mcNumber, dotNumber, contactName, contactEmail, contactPhone, insuranceLimit, serviceLevel, modes, status } = req.body;
    const query = `INSERT INTO carriers (name, mcNumber, dotNumber, contactName, contactEmail, contactPhone, insuranceLimit, serviceLevel, modes, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [name, mcNumber, dotNumber, contactName, contactEmail, contactPhone, insuranceLimit || 100000, serviceLevel, modes, status || 'Active'], function (this: any, err: Error | null) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Carrier created' });
    });
});

app.put('/api/carriers/:id', (req: Request, res: Response) => {
    const { name, mcNumber, dotNumber, contactName, contactEmail, contactPhone, insuranceLimit, serviceLevel, modes, status } = req.body;
    const query = `UPDATE carriers SET name=?, mcNumber=?, dotNumber=?, contactName=?, contactEmail=?, contactPhone=?, insuranceLimit=?, serviceLevel=?, modes=?, status=? WHERE id=?`;
    db.run(query, [name, mcNumber, dotNumber, contactName, contactEmail, contactPhone, insuranceLimit, serviceLevel, modes, status, req.params.id], function (this: any, err: Error | null) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Carrier updated' });
    });
});

app.delete('/api/carriers/:id', (req: Request, res: Response) => {
    db.run('DELETE FROM carriers WHERE id = ?', [req.params.id], function (this: any, err: Error | null) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Carrier deleted' });
    });
});

// --- Dev reset: drop + recreate + reseed carriers ---
app.post('/api/carriers/reset', (req: Request, res: Response) => {
    db.serialize(() => {
        db.run(`DROP TABLE IF EXISTS carriers`);
        db.run(`CREATE TABLE carriers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            mcNumber TEXT, dotNumber TEXT,
            contactName TEXT, contactEmail TEXT, contactPhone TEXT,
            insuranceLimit REAL DEFAULT 100000,
            serviceLevel TEXT, modes TEXT,
            onTimeRate REAL DEFAULT 0.95,
            claimRate REAL DEFAULT 0.01,
            rating REAL DEFAULT 4.0,
            status TEXT DEFAULT 'Active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        const seed = [
            ['FedEx Freight', 'MC-299007', 'DOT-0226516', 'James Holloway', 'j.holloway@fedexfreight.com', '1-800-463-3339', 1000000, 'Priority', 'LTL,FTL', 0.97, 0.005, 4.8, 'Active'],
            ['XPO Logistics', 'MC-107672', 'DOT-0023389', 'Sarah Chen', 's.chen@xpo.com', '1-844-742-5976', 500000, 'Standard', 'LTL,FTL,Intermodal', 0.93, 0.012, 4.4, 'Active'],
            ['Old Dominion Freight', 'MC-209676', 'DOT-0082619', 'Marcus Webb', 'm.webb@odfl.com', '1-800-432-6335', 750000, 'Guaranteed', 'LTL', 0.99, 0.003, 4.9, 'Active'],
            ['Estes Express Lines', 'MC-029405', 'DOT-0029405', 'Diane Forrest', 'd.forrest@estes-express.com', '1-804-353-1900', 500000, 'Standard', 'LTL', 0.94, 0.008, 4.5, 'Active'],
            ['Werner Enterprises', 'MC-112923', 'DOT-0070278', 'Tom Brierly', 't.brierly@werner.com', '1-800-228-2240', 1000000, 'Standard', 'FTL,Temp Controlled', 0.95, 0.006, 4.6, 'Active'],
            ['Spot Carrier LLC', 'MC-887412', 'DOT-0344892', 'Al Martinez', 'a.martinez@spotcarrier.com', '555-209-4471', 100000, 'Spot', 'FTL', 0.88, 0.020, 3.7, 'Pending'],
        ];
        const stmt = db.prepare(`INSERT INTO carriers (name,mcNumber,dotNumber,contactName,contactEmail,contactPhone,insuranceLimit,serviceLevel,modes,onTimeRate,claimRate,rating,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
        seed.forEach(row => stmt.run(...row as any));
        stmt.finalize(() => res.json({ message: 'Carriers table reset and seeded with 6 carriers.' }));
    });
});

// Reset data (for demo purposes)
app.post('/api/tracking/reset', (req: Request, res: Response) => {
    db.serialize(() => {
        db.run('DROP TABLE IF EXISTS shipment_events');
        db.run('DROP TABLE IF EXISTS documents');
        db.run('DROP TABLE IF EXISTS invoices');
        db.run('DROP TABLE IF EXISTS orders');
        db.run('DROP TABLE IF EXISTS users');
        db.run('DROP TABLE IF EXISTS shipments');
        db.run(`CREATE TABLE shipments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            origin TEXT NOT NULL, destination TEXT NOT NULL,
            weight REAL NOT NULL, dimensions TEXT, freightClass TEXT,
            status TEXT DEFAULT 'Pending',
            carrierId INTEGER, trackingNumber TEXT, estimatedDelivery TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(carrierId) REFERENCES carriers(id)
        )`);
        db.run(`CREATE TABLE shipment_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipmentId INTEGER NOT NULL,
            eventType TEXT NOT NULL, location TEXT, message TEXT,
            eventTime DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shipmentId) REFERENCES shipments(id)
        )`);
        db.run(`CREATE TABLE documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipmentId INTEGER,
            type TEXT NOT NULL, filename TEXT NOT NULL, size INTEGER NOT NULL,
            status TEXT DEFAULT 'Verified',
            uploadedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shipmentId) REFERENCES shipments(id)
        )`);
        db.run(`CREATE TABLE invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            shipmentId INTEGER NOT NULL,
            carrierId INTEGER NOT NULL,
            invoiceNumber TEXT NOT NULL,
            quotedAmount REAL NOT NULL,
            actualAmount REAL NOT NULL,
            status TEXT DEFAULT 'Pending',
            dueDate DATETIME,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shipmentId) REFERENCES shipments(id),
            FOREIGN KEY(carrierId) REFERENCES carriers(id)
        )`);
        db.run(`CREATE TABLE orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customerName TEXT NOT NULL,
            poNumber TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL,
            weight REAL NOT NULL,
            dimensions TEXT,
            status TEXT DEFAULT 'Unplanned',
            shipmentId INTEGER,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(shipmentId) REFERENCES shipments(id)
        )`);
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL, department TEXT,
            lastLogin DATETIME, status TEXT DEFAULT 'Active',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        const shipments = [
            ['Chicago, IL', 'Dallas, TX', 1850, '48x40x48', '70', 'In Transit', 1, 'OLD-4491-2024', '2026-02-26'],
            ['Atlanta, GA', 'Los Angeles, CA', 3400, '96x48x60', '85', 'In Transit', 2, 'XPO-8823-2024', '2026-02-27'],
            ['New York, NY', 'Miami, FL', 920, '48x48x36', '55', 'Delivered', 3, 'FDX-2211-2024', '2026-02-23'],
            ['Seattle, WA', 'Phoenix, AZ', 2100, '80x48x52', '92.5', 'Exception', 4, 'EST-9944-2024', '2026-02-25'],
            ['Houston, TX', 'Denver, CO', 660, '40x32x28', '50', 'Dispatched', 5, 'WNR-5512-2024', '2026-02-28'],
            ['Boston, MA', 'Charlotte, NC', 450, '36x24x24', '50', 'Pending', 1, null, '2026-03-01'],
        ];
        const sStmt = db.prepare(`INSERT INTO shipments (origin,destination,weight,dimensions,freightClass,status,carrierId,trackingNumber,estimatedDelivery) VALUES (?,?,?,?,?,?,?,?,?)`);
        shipments.forEach(s => sStmt.run(...s as any));
        sStmt.finalize(() => {
            const events: any[] = [
                [1, 'Picked Up', 'Chicago, IL', 'Shipment picked up from origin', '2026-02-24 08:00:00'],
                [1, 'Departed Terminal', 'Chicago IL Hub', 'Departed Chicago hub', '2026-02-24 14:30:00'],
                [1, 'In Transit', 'St. Louis, MO', 'En route to destination', '2026-02-25 06:15:00'],
                [2, 'Picked Up', 'Atlanta, GA', 'Shipment picked up from origin', '2026-02-23 09:00:00'],
                [2, 'Departed Terminal', 'Atlanta GA Hub', 'Departed Atlanta hub', '2026-02-23 17:00:00'],
                [2, 'In Transit', 'Dallas, TX', 'En route — on schedule', '2026-02-24 11:30:00'],
                [3, 'Picked Up', 'New York, NY', 'Shipment picked up', '2026-02-21 07:30:00'],
                [3, 'In Transit', 'Philadelphia, PA', 'Moving south on I-95', '2026-02-21 13:00:00'],
                [3, 'Out for Delivery', 'Miami, FL', 'Out for final delivery', '2026-02-23 07:45:00'],
                [3, 'Delivered', 'Miami, FL', 'Delivered and signed for by M. Garcia', '2026-02-23 11:20:00'],
                [4, 'Picked Up', 'Seattle, WA', 'Shipment picked up', '2026-02-23 10:00:00'],
                [4, 'In Transit', 'Portland, OR', 'Moving south on I-5', '2026-02-23 15:00:00'],
                [4, 'Exception', 'Sacramento, CA', 'Mechanical delay — trailer breakdown. ETA pushed 24hrs.', '2026-02-24 09:00:00'],
                [5, 'Dispatched', 'Houston, TX', 'Driver assigned and en route to pickup', '2026-02-24 06:00:00'],
            ];
            const eStmt = db.prepare(`INSERT INTO shipment_events (shipmentId,eventType,location,message,eventTime) VALUES (?,?,?,?,?)`);
            events.forEach(e => eStmt.run(...e));
            eStmt.finalize(() => {
                const docs: any[] = [
                    [1, 'BOL', 'BOL-4491.pdf', 1250000, 'Verified'],
                    [1, 'Customs', 'commercial_invoice_CA.pdf', 850000, 'Verified'],
                    [2, 'Rate Confirmation', 'RateCon-XPO-8823.pdf', 450000, 'Pending'],
                    [3, 'POD', 'POD_signed_Garcia.pdf', 2100000, 'Verified'],
                    [3, 'Invoice', 'INV-FDX-2211.pdf', 520000, 'Verified'],
                    [5, 'BOL', 'BOL-WNR-5512.pdf', 980000, 'Verified']
                ];
                const docStmt = db.prepare(`INSERT INTO documents (shipmentId, type, filename, size, status) VALUES (?, ?, ?, ?, ?)`);
                docs.forEach(d => docStmt.run(...d));
                docStmt.finalize(() => {
                    const invoices: any[] = [
                        [1, 1, 'INV-4491-A', 1850, 1850, 'Approved', '2026-03-26'],
                        [2, 2, 'INV-8823-B', 3400, 3600, 'Disputed', '2026-03-27'], // Discrepancy (detention or accessorials)
                        [3, 3, 'INV-2211-C', 920, 920, 'Paid', '2026-03-23'],
                        [4, 4, 'INV-9944-D', 2100, 2100, 'Pending', '2026-03-25'],
                    ];
                    const invStmt = db.prepare(`INSERT INTO invoices (shipmentId, carrierId, invoiceNumber, quotedAmount, actualAmount, status, dueDate) VALUES (?, ?, ?, ?, ?, ?, ?)`);
                    invoices.forEach(i => invStmt.run(...i));
                    invStmt.finalize(() => {
                        const orders: any[] = [
                            ['Acme Corp', 'PO-9921', 'Cleveland, OH', 'Houston, TX', 4500, '4 Pallets', 'Unplanned', null],
                            ['Globex Inc', 'PO-A441', 'Cleveland, OH', 'Houston, TX', 6200, '6 Pallets', 'Unplanned', null],
                            ['Stark Ind', 'PO-X920', 'Seattle, WA', 'Portland, OR', 12000, '12 Pallets', 'Unplanned', null],
                            ['Wayne Ent', 'PO-B811', 'Seattle, WA', 'Portland, OR', 3000, '3 Pallets', 'Unplanned', null],
                            // Planned orders on existing generic shipment 6
                            ['Cyberdyne', 'PO-T800', 'Boston, MA', 'Charlotte, NC', 450, '36x24x24', 'Planned', 6],
                        ];
                        const orderStmt = db.prepare(`INSERT INTO orders (customerName, poNumber, origin, destination, weight, dimensions, status, shipmentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
                        orders.forEach(o => orderStmt.run(...o));
                        orderStmt.finalize(() => {
                            const users: any[] = [
                                ['Admin User', 'admin@thoron.com', 'Admin', 'Management', '2026-02-24 08:00:00', 'Active'],
                                ['Sarah Dispatch', 'sarah@thoron.com', 'Dispatcher', 'Operations', '2026-02-23 09:15:00', 'Active'],
                                ['Mike Driver', 'mike@thoron.com', 'Driver', 'Fleet', '2026-02-24 06:30:00', 'Active'],
                                ['Acme Logistics', 'portal@acmecorp.com', 'Customer', 'External', '2026-02-20 14:00:00', 'Active']
                            ];
                            const userStmt = db.prepare(`INSERT INTO users (name, email, role, department, lastLogin, status) VALUES (?, ?, ?, ?, ?, ?)`);
                            users.forEach(u => userStmt.run(...u));
                            userStmt.finalize(() => res.json({ message: 'Database fully reset and seeded (including users).' }));
                        });
                    });
                });
            });
        });
    });
});

// --- Tracking API ---
// All active shipments enriched with carrier name and latest event
app.get('/api/tracking', (req: Request, res: Response) => {
    const query = `
        SELECT s.*, c.name as carrierName,
               e.eventType as lastEventType,
               e.location as lastLocation,
               e.eventTime as lastEventTime
        FROM shipments s
        LEFT JOIN carriers c ON s.carrierId = c.id
        LEFT JOIN (
            SELECT shipmentId, eventType, location, eventTime,
                   ROW_NUMBER() OVER (PARTITION BY shipmentId ORDER BY eventTime DESC) as rn
            FROM shipment_events
        ) e ON e.shipmentId = s.id AND e.rn = 1
        ORDER BY s.createdAt DESC
    `;
    db.all(query, [], (err: Error | null, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Single shipment with full milestone timeline
app.get('/api/tracking/:id', (req: Request, res: Response) => {
    db.get(
        `SELECT s.*, c.name as carrierName, c.contactPhone as carrierPhone FROM shipments s LEFT JOIN carriers c ON s.carrierId = c.id WHERE s.id = ?`,
        [req.params.id],
        (err: Error | null, shipment: any) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
            db.all(
                `SELECT * FROM shipment_events WHERE shipmentId = ? ORDER BY eventTime ASC`,
                [req.params.id],
                (err2: Error | null, events: any[]) => {
                    if (err2) return res.status(500).json({ error: err2.message });
                    res.json({ ...shipment, events: events || [] });
                }
            );
        }
    );
});

// Add a tracking event
app.post('/api/tracking/:id/events', (req: Request, res: Response) => {
    const { eventType, location, message } = req.body;
    db.run(
        `INSERT INTO shipment_events (shipmentId, eventType, location, message) VALUES (?, ?, ?, ?)`,
        [req.params.id, eventType, location, message],
        function (this: any, err: Error | null) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Event added' });
        }
    );
});

// --- Analytics API ---
app.get('/api/analytics/kpis', (req: Request, res: Response) => {
    // Return high-level stats: total spend, active shipments, avg on-time rate
    res.json({
        totalSpendYTD: 1245000,
        activeShipments: 142,
        avgOnTimeRate: 94.8,
        exceptionRate: 2.1
    });
});

app.get('/api/analytics/spend-trend', (req: Request, res: Response) => {
    // Mock 6-month spend trend for area chart
    res.json([
        { month: 'Sep', spend: 180000, budget: 190000 },
        { month: 'Oct', spend: 210000, budget: 195000 },
        { month: 'Nov', spend: 195000, budget: 200000 },
        { month: 'Dec', spend: 240000, budget: 210000 },
        { month: 'Jan', spend: 185000, budget: 200000 },
        { month: 'Feb', spend: 235000, budget: 215000 }
    ]);
});

app.get('/api/analytics/carrier-performance', (req: Request, res: Response) => {
    // Fetch carrier performance for scatter/bar charts
    db.all(`SELECT name, onTimeRate * 100 as onTimePercent, rating, modes FROM carriers WHERE status = 'Active'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/analytics/lanes', (req: Request, res: Response) => {
    // Mock top lanes
    res.json([
        { lane: 'Chicago → Dallas', volume: 342, avgCost: 1850 },
        { lane: 'Atlanta → LA', volume: 289, avgCost: 3200 },
        { lane: 'New York → Miami', volume: 215, avgCost: 2100 },
        { lane: 'Seattle → Phoenix', volume: 178, avgCost: 2400 },
        { lane: 'Houston → Denver', volume: 156, avgCost: 1650 }
    ]);
});

// --- Documents API ---
// List all documents with shipment tracking number
app.get('/api/documents', (req: Request, res: Response) => {
    const query = `
        SELECT d.*, s.trackingNumber 
        FROM documents d
        LEFT JOIN shipments s ON d.shipmentId = s.id
        ORDER BY d.uploadedAt DESC
    `;
    db.all(query, [], (err: Error | null, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Upload (simulate) a document
app.post('/api/documents', (req: Request, res: Response) => {
    const { shipmentId, type, filename, size } = req.body;
    db.run(
        `INSERT INTO documents (shipmentId, type, filename, size, status) VALUES (?, ?, ?, ?, 'Pending')`,
        [shipmentId || null, type, filename, size],
        function (this: any, err: Error | null) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Document uploaded successfully' });
        }
    );
});

// Delete a document
app.delete('/api/documents/:id', (req: Request, res: Response) => {
    db.run(
        `DELETE FROM documents WHERE id = ?`,
        [req.params.id],
        function (this: any, err: Error | null) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Document not found' });
            res.json({ message: 'Document deleted successfully' });
        }
    );
});

// --- Invoices API ---
// Get all invoices enriched with shipment and carrier data
app.get('/api/invoices', (req: Request, res: Response) => {
    const query = `
        SELECT i.*, 
               s.trackingNumber, s.origin, s.destination,
               c.name as carrierName
        FROM invoices i
        JOIN shipments s ON i.shipmentId = s.id
        JOIN carriers c ON i.carrierId = c.id
        ORDER BY i.createdAt DESC
    `;
    db.all(query, [], (err: Error | null, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update invoice status (Approve, Dispute, Paid)
app.put('/api/invoices/:id/status', (req: Request, res: Response) => {
    const { status } = req.body;
    db.run(
        `UPDATE invoices SET status = ? WHERE id = ?`,
        [status, req.params.id],
        function (this: any, err: Error | null) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
            res.json({ message: 'Invoice status updated successfully' });
        }
    );
});

// --- Orders (Load Planning) API ---
// Get all orders (optionally filter by status)
app.get('/api/orders', (req: Request, res: Response) => {
    const { status } = req.query;
    let query = `SELECT * FROM orders`;
    let params: any[] = [];
    if (status) {
        query += ` WHERE status = ?`;
        params.push(status);
    }
    query += ` ORDER BY createdAt DESC`;

    db.all(query, params, (err: Error | null, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Plan orders into a single shipment (load)
app.post('/api/orders/plan', (req: Request, res: Response) => {
    const { orderIds, origin, destination, weight, dimensions } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'orderIds array is required' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
            INSERT INTO shipments (origin, destination, weight, dimensions, status)
            VALUES (?, ?, ?, ?, 'Pending')
        `);

        stmt.run(origin, destination, weight, dimensions, function (this: any, err: Error | null) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const shipmentId = this.lastID;

            // Update orders to point to new shipment and set status to Planned
            const placeholders = orderIds.map(() => '?').join(',');
            const updateQuery = `UPDATE orders SET status = 'Planned', shipmentId = ? WHERE id IN (${placeholders})`;

            db.run(updateQuery, [shipmentId, ...orderIds], function (err2: Error | null) {
                if (err2) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: err2.message });
                }

                db.run('COMMIT');
                res.json({ message: 'Load planned successfully', shipmentId });
            });
        });
        stmt.finalize();
    });
});

// --- Users API ---
app.get('/api/users', (req: Request, res: Response) => {
    db.all('SELECT * FROM users ORDER BY name ASC', [], (err: Error | null, rows: any[]) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.put('/api/users/:id/role', (req: Request, res: Response) => {
    const { role } = req.body;
    db.run(
        `UPDATE users SET role = ? WHERE id = ?`,
        [role, req.params.id],
        function (this: any, err: Error | null) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'User role updated successfully' });
        }
    );
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
