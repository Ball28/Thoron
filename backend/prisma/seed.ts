import 'dotenv/config';
import { db as prisma } from '../src/database.js';
import * as bcrypt from 'bcryptjs';

// Removed duplicate manual prisma client instantiation

async function main() {
    console.log('Seeding database...');

    // Users
    const passwordHash = await bcrypt.hash('admin123', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@thoron.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@thoron.com',
            passwordHash,
            role: 'Admin',
            department: 'Management',
            tenantId: 'default'
        }
    });

    const dispatcher = await prisma.user.upsert({
        where: { email: 'jane@thoron.com' },
        update: {},
        create: {
            name: 'Dispatcher Jane',
            email: 'jane@thoron.com',
            passwordHash,
            role: 'Dispatcher',
            department: 'Operations',
            tenantId: 'default'
        }
    });

    console.log('Seeded demo users.');

    // Carriers
    const carriers = [
        { name: 'Old Dominion Freight Line', mcNumber: 'MC-123456', dotNumber: 'DOT-987654', contactName: 'John Smith', contactEmail: 'jsmith@odfl.com', contactPhone: '1-800-432-6335', insuranceLimit: 1000000, serviceLevel: 'Guaranteed LTL', modes: 'LTL', onTimeRate: 0.98, claimRate: 0.005, rating: 4.8, status: 'Active' },
        { name: 'XPO Logistics', mcNumber: 'MC-107672', dotNumber: 'DOT-0023389', contactName: 'Sarah Chen', contactEmail: 's.chen@xpo.com', contactPhone: '1-844-742-5976', insuranceLimit: 500000, serviceLevel: 'Standard', modes: 'LTL, FTL, Intermodal', onTimeRate: 0.96, claimRate: 0.012, rating: 4.2, status: 'Active' },
        { name: 'FedEx Freight', mcNumber: 'MC-299007', dotNumber: 'DOT-0226516', contactName: 'James Holloway', contactEmail: 'j.holloway@fedex.com', contactPhone: '1-866-393-4585', insuranceLimit: 2000000, serviceLevel: 'Priority', modes: 'LTL', onTimeRate: 0.99, claimRate: 0.002, rating: 4.9, status: 'Active' },
        { name: 'Estes Express Lines', mcNumber: 'MC-115869', dotNumber: 'DOT-0050750', contactName: 'Mike Torres', contactEmail: 'mtorres@estes-express.com', contactPhone: '1-804-353-1900', insuranceLimit: 500000, serviceLevel: 'Standard', modes: 'LTL, Final Mile', onTimeRate: 0.95, claimRate: 0.015, rating: 3.9, status: 'Active' },
        { name: 'Werner Enterprises', mcNumber: 'MC-163479', dotNumber: 'DOT-0053896', contactName: 'Amanda Wright', contactEmail: 'awright@werner.com', contactPhone: '1-800-228-2240', insuranceLimit: 1000000, serviceLevel: 'Dedicated', modes: 'FTL, Global', onTimeRate: 0.97, claimRate: 0.008, rating: 4.5, status: 'Active' },
        { name: 'J.B. Hunt', mcNumber: 'MC-063994', dotNumber: 'DOT-0019448', contactName: 'David Ross', contactEmail: 'dross@jbhunt.com', contactPhone: '1-800-4JBHUNT', insuranceLimit: 1500000, serviceLevel: 'Standard', modes: 'Intermodal, FTL', onTimeRate: 0.96, claimRate: 0.010, rating: 4.3, status: 'Active' }
    ];

    const carrierRecords = [];
    for (const data of carriers) {
        const c = await prisma.carrier.upsert({
            where: { id: carrierRecords.length + 1 },
            update: {},
            create: data
        });
        carrierRecords.push(c);
    }

    console.log('Seeded 6 demo carriers.');

    // Shipments
    const shipments = [
        { origin: 'Chicago, IL', destination: 'Dallas, TX', weight: 1850, dimensions: '48x40x48', freightClass: '70', status: 'In Transit', carrierId: carrierRecords[0]!.id, trackingNumber: 'OLD-4491-2024', estimatedDelivery: '2026-02-26' },
        { origin: 'Atlanta, GA', destination: 'Los Angeles, CA', weight: 3400, dimensions: '96x48x60', freightClass: '85', status: 'In Transit', carrierId: carrierRecords[1]!.id, trackingNumber: 'XPO-8823-2024', estimatedDelivery: '2026-02-27' },
        { origin: 'New York, NY', destination: 'Miami, FL', weight: 920, dimensions: '48x48x36', freightClass: '55', status: 'Delivered', carrierId: carrierRecords[2]!.id, trackingNumber: 'FDX-2211-2024', estimatedDelivery: '2026-02-23' },
        { origin: 'Seattle, WA', destination: 'Phoenix, AZ', weight: 2100, dimensions: '80x48x52', freightClass: '92.5', status: 'Exception', carrierId: carrierRecords[3]!.id, trackingNumber: 'EST-9944-2024', estimatedDelivery: '2026-02-25' },
        { origin: 'Houston, TX', destination: 'Denver, CO', weight: 660, dimensions: '40x32x28', freightClass: '50', status: 'Dispatched', carrierId: carrierRecords[4]!.id, trackingNumber: 'WNR-5512-2024', estimatedDelivery: '2026-02-28' },
        { origin: 'Boston, MA', destination: 'Charlotte, NC', weight: 450, dimensions: '36x24x24', freightClass: '50', status: 'Pending', carrierId: carrierRecords[0]!.id, trackingNumber: null, estimatedDelivery: '2026-03-01' },
    ];

    const shipmentRecords = [];
    for (const data of shipments) {
        const s = await prisma.shipment.create({
            data
        });
        shipmentRecords.push(s);
    }

    // Events and Docs for Shipment 1
    await prisma.shipmentEvent.createMany({
        data: [
            { shipmentId: shipmentRecords[0]!.id, eventType: 'Dispatched', location: 'Chicago, IL', message: 'Driver assigned and en route to pickup' },
            { shipmentId: shipmentRecords[0]!.id, eventType: 'Picked Up', location: 'Chicago, IL', message: 'Freight loaded' },
            { shipmentId: shipmentRecords[0]!.id, eventType: 'In Transit', location: 'St. Louis, MO', message: 'Passed weigh station' },
        ]
    });

    await prisma.document.createMany({
        data: [
            { shipmentId: shipmentRecords[0]!.id, type: 'BOL', filename: 'BOL-OLD-4491.pdf', size: 1024 * 50 },
            { shipmentId: shipmentRecords[0]!.id, type: 'Invoice', filename: 'INV-OLD-4491.pdf', size: 1024 * 35 },
        ]
    });

    console.log('Seeded demo shipments, events, and documents.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
