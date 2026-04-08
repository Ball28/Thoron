import { Router, type Request, type Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../database.js';
import { signToken, authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    console.log('[DEBUG] Hit /register', req.body);
    const { name, email, password, role, department } = req.body;

    if (!name || !email || !password) {
        console.log('[DEBUG] Validation failed');
        res.status(400).json({ error: 'Name, email, and password are required' });
        return;
    }

    try {
        console.log('[DEBUG] Checking if user exists');
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        console.log('[DEBUG] Hashing password');
        const passwordHash = await bcrypt.hash(password, 12);
        console.log('[DEBUG] Hashes complete');
        const userRole = role || 'Customer';
        const tenantId = 'default';

        console.log('[DEBUG] Inserting into db');
        const user = await db.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: userRole,
                department: department || null,
                tenantId,
                status: 'Active'
            }
        });

        console.log('[DEBUG] Signing token');
        const token = signToken({ id: user.id, email, role: userRole, tenantId });
        res.status(201).json({
            token,
            user: { id: user.id, name, email, role: userRole, department, tenantId }
        });
    } catch (err: any) {
        console.error('[DEBUG] Hash error', err);
        res.status(500).json({ error: err.message || 'Failed to create user' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
    }

    try {
        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const valid = await bcrypt.compare(password, user.passwordHash || '');
        if (!valid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Update last login
        await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId || 'default'
        });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                tenantId: user.tenantId || 'default'
            }
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message || 'Authentication failed' });
    }
});

// GET /api/auth/me — restore session from token
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }

    try {
        const user = await db.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true, department: true, tenantId: true, status: true }
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
