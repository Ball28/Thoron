import express, {} from 'express';
import cors from 'cors';
import { db } from './database.js';
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
// Basic health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Thoron API is running' });
});
// --- Shipments API ---
app.get('/api/shipments', (req, res) => {
    db.all('SELECT * FROM shipments', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});
app.post('/api/shipments', (req, res) => {
    const { origin, destination, weight, dimensions, freightClass, status, carrierId, trackingNumber, estimatedDelivery } = req.body;
    const query = `
    INSERT INTO shipments (origin, destination, weight, dimensions, freightClass, status, carrierId, trackingNumber, estimatedDelivery) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
    db.run(query, [origin, destination, weight, dimensions, freightClass, status || 'Pending', carrierId, trackingNumber, estimatedDelivery], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, message: 'Shipment created successfully' });
    });
});
// --- Rates/Quotes API ---
// Dummy implementation for rate quoting
app.post('/api/quotes', (req, res) => {
    const { origin, destination, weight, freightClass } = req.body;
    // Dummy rates response
    const quotes = [
        { carrier: 'FedEx Freight', service: 'Priority', rate: 450.00, transitDays: 2, score: 95 },
        { carrier: 'XPO Logistics', service: 'Standard', rate: 320.00, transitDays: 4, score: 88 },
        { carrier: 'Old Dominion', service: 'Guaranteed', rate: 510.00, transitDays: 2, score: 98 },
    ];
    // Sort by recommendation score
    quotes.sort((a, b) => b.score - a.score);
    res.json(quotes);
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
//# sourceMappingURL=index.js.map