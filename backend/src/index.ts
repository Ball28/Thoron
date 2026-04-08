import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { db } from './database.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { requireRole } from './middleware/rbacMiddleware.js';
import authRoutes from './routes/authRoutes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Auth routes (unprotected) ---
app.use('/api/auth', authRoutes);

// --- Protect all other /api routes ---
app.use('/api', (req, res, next) => {
    // Skip auth for health check
    if (req.path === '/health') return next();
    authMiddleware(req, res, next);
});

// Basic health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Thoron API is running' });
});

// --- Shipments API ---
app.get('/api/shipments', async (req: Request, res: Response) => {
    try {
        const shipments = await db.shipment.findMany({
            include: { carrier: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(shipments);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/shipments', async (req: Request, res: Response) => {
    const { origin, destination, weight, dimensions, freightClass, status, carrierId, trackingNumber, estimatedDelivery } = req.body;
    try {
        const shipment = await db.shipment.create({
            data: {
                origin,
                destination,
                weight,
                dimensions,
                freightClass,
                status: status || 'Pending',
                carrierId,
                trackingNumber,
                estimatedDelivery
            }
        });
        res.json({ id: shipment.id, message: 'Shipment created successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
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
app.get('/api/carriers', async (req: Request, res: Response) => {
    try {
        const carriers = await db.carrier.findMany({
            orderBy: { rating: 'desc' }
        });
        res.json(carriers);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/carriers/:id', async (req: Request, res: Response) => {
    try {
        const carrier = await db.carrier.findUnique({
            where: { id: parseInt(req.params.id as string) }
        });
        if (!carrier) return res.status(404).json({ error: 'Carrier not found' });
        res.json(carrier);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/carriers', async (req: Request, res: Response) => {
    try {
        const carrier = await db.carrier.create({
            data: {
                ...req.body,
                insuranceLimit: req.body.insuranceLimit || 100000,
                status: req.body.status || 'Active'
            }
        });
        res.json({ id: carrier.id, message: 'Carrier created' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/carriers/:id', async (req: Request, res: Response) => {
    try {
        await db.carrier.update({
            where: { id: parseInt(req.params.id as string) },
            data: req.body
        });
        res.json({ message: 'Carrier updated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/carriers/:id', requireRole('Admin'), async (req: Request, res: Response) => {
    try {
        await db.carrier.delete({
            where: { id: parseInt(req.params.id as string) }
        });
        res.json({ message: 'Carrier deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Tracking API ---
app.get('/api/tracking', async (req: Request, res: Response) => {
    try {
        const shipments = await db.shipment.findMany({
            include: {
                carrier: true,
                events: {
                    orderBy: { eventTime: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = shipments.map((s: any) => ({
            ...s,
            carrierName: s.carrier?.name,
            lastEventType: s.events[0]?.eventType,
            lastLocation: s.events[0]?.location,
            lastEventTime: s.events[0]?.eventTime
        }));
        res.json(formatted);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/tracking/:id', async (req: Request, res: Response) => {
    try {
        const shipment = await db.shipment.findUnique({
            where: { id: parseInt(req.params.id as string) },
            include: {
                carrier: true,
                events: {
                    orderBy: { eventTime: 'asc' }
                }
            }
        });
        if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

        const formatted = {
            ...shipment,
            carrierName: shipment.carrier?.name,
            carrierPhone: shipment.carrier?.contactPhone
        };
        res.json(formatted);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/tracking/:id/events', async (req: Request, res: Response) => {
    const { eventType, location, message } = req.body;
    try {
        const event = await db.shipmentEvent.create({
            data: {
                shipmentId: parseInt(req.params.id as string),
                eventType,
                location,
                message
            }
        });
        res.json({ id: event.id, message: 'Event added' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Analytics API ---
app.get('/api/analytics/kpis', async (req: Request, res: Response) => {
    try {
        const totalSpend = await db.invoice.aggregate({
            _sum: { actualAmount: true },
            where: { status: { not: 'Pending' } }
        });
        const activeShipments = await db.shipment.count({
            where: { status: { notIn: ['Delivered', 'Canceled'] } }
        });
        const carriers = await db.carrier.aggregate({
            _avg: { onTimeRate: true }
        });

        res.json({
            totalSpendYTD: totalSpend._sum.actualAmount || 1245000,
            activeShipments: activeShipments || 142,
            avgOnTimeRate: (carriers._avg.onTimeRate ? carriers._avg.onTimeRate * 100 : 94.8).toFixed(1),
            exceptionRate: 2.1
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/analytics/spend-trend', (req: Request, res: Response) => {
    res.json([
        { month: 'Sep', spend: 180000, budget: 190000 },
        { month: 'Oct', spend: 210000, budget: 195000 },
        { month: 'Nov', spend: 195000, budget: 200000 },
        { month: 'Dec', spend: 240000, budget: 210000 },
        { month: 'Jan', spend: 185000, budget: 200000 },
        { month: 'Feb', spend: 235000, budget: 215000 }
    ]);
});

app.get('/api/analytics/carrier-performance', async (req: Request, res: Response) => {
    try {
        const carriers = await db.carrier.findMany({
            where: { status: 'Active' },
            select: { name: true, onTimeRate: true, rating: true, modes: true }
        });
        res.json(carriers.map((c: any) => ({
            ...c,
            onTimePercent: c.onTimeRate * 100
        })));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/analytics/lanes', (req: Request, res: Response) => {
    res.json([
        { lane: 'Chicago → Dallas', volume: 342, avgCost: 1850 },
        { lane: 'Atlanta → LA', volume: 289, avgCost: 3200 },
        { lane: 'New York → Miami', volume: 215, avgCost: 2100 },
        { lane: 'Seattle → Phoenix', volume: 178, avgCost: 2400 },
        { lane: 'Houston → Denver', volume: 156, avgCost: 1650 }
    ]);
});

// --- Documents API ---
app.get('/api/documents', async (req: Request, res: Response) => {
    try {
        const documents = await db.document.findMany({
            include: { shipment: true },
            orderBy: { uploadedAt: 'desc' }
        });
        res.json(documents.map((d: any) => ({
            ...d,
            trackingNumber: d.shipment?.trackingNumber
        })));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/documents', async (req: Request, res: Response) => {
    const { shipmentId, type, filename, size } = req.body;
    try {
        const doc = await db.document.create({
            data: {
                shipmentId,
                type,
                filename,
                size,
                status: 'Pending'
            }
        });
        res.json({ id: doc.id, message: 'Document uploaded successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
        await db.document.delete({
            where: { id: parseInt(req.params.id as string) }
        });
        res.json({ message: 'Document deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Invoices API ---
app.get('/api/invoices', async (req: Request, res: Response) => {
    try {
        const invoices = await db.invoice.findMany({
            include: { shipment: true, carrier: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(invoices.map((i: any) => ({
            ...i,
            trackingNumber: i.shipment?.trackingNumber,
            origin: i.shipment?.origin,
            destination: i.shipment?.destination,
            carrierName: i.carrier?.name
        })));
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/invoices/:id/status', async (req: Request, res: Response) => {
    const { status } = req.body;
    try {
        await db.invoice.update({
            where: { id: parseInt(req.params.id as string) },
            data: { status }
        });
        res.json({ message: 'Invoice status updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Orders (Load Planning) API ---
app.get('/api/orders', async (req: Request, res: Response) => {
    const { status } = req.query;
    try {
        const orders = await db.order.findMany({
            where: status ? { status: status as string } : undefined,
            orderBy: { createdAt: 'desc' }
        });
        res.json(orders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders/plan', async (req: Request, res: Response) => {
    const { orderIds, origin, destination, weight, dimensions } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: 'orderIds array is required' });
    }

    try {
        const result = await db.$transaction(async (tx: any) => {
            const shipment = await tx.shipment.create({
                data: {
                    origin,
                    destination,
                    weight,
                    dimensions,
                    status: 'Pending'
                }
            });

            await tx.order.updateMany({
                where: { id: { in: orderIds } },
                data: { status: 'Planned', shipmentId: shipment.id }
            });

            return shipment;
        });

        res.json({ message: 'Load planned successfully', shipmentId: result.id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Users API ---
app.get('/api/users', async (req: Request, res: Response) => {
    try {
        const users = await db.user.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/users/:id/role', requireRole('Admin'), async (req: Request, res: Response) => {
    const { role } = req.body;
    try {
        await db.user.update({
            where: { id: parseInt(req.params.id as string) },
            data: { role }
        });
        res.json({ message: 'User role updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
