import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Units
    const unitSeeds = [
        { unitNumber: '101', status: 'held' },
        { unitNumber: '102', status: 'available' },
        { unitNumber: '103', status: 'leased' },
        { unitNumber: '201', status: 'available' },
        { unitNumber: '202', status: 'available' },
    ] as const;

    for (const seed of unitSeeds) {
        await prisma.unit.upsert({
            where: { unitNumber: seed.unitNumber },
            update: {},
            create: seed,
        });
    }

    // Prospects — demonstrate the full pipeline
    const prospectSeeds = [
        {
            email: 'sarah.johnson@example.com',
            name: 'Sarah Johnson',
            phone: '(555) 100-0001',
            status: 'new',
            assignedUnit: null,
        },
        {
            email: 'marcus.williams@example.com',
            name: 'Marcus Williams',
            phone: '(555) 100-0002',
            status: 'contacted',
            assignedUnit: null,
        },
        {
            email: 'emily.chen@example.com',
            name: 'Emily Chen',
            phone: '(555) 100-0003',
            status: 'tour_scheduled',
            assignedUnit: '101', // has unit — can demo new → contacted → toured → application → leased
        },
        {
            email: 'david.rodriguez@example.com',
            name: 'David Rodriguez',
            phone: '(555) 100-0004',
            status: 'toured',
            assignedUnit: '102',
        },
        {
            email: 'jessica.park@example.com',
            name: 'Jessica Park',
            phone: '(555) 100-0005',
            status: 'application',
            assignedUnit: '201', // can demo application → leased
        },
    ];

    for (const seed of prospectSeeds) {
        await prisma.prospect.upsert({
            where: { email: seed.email },
            update: {},
            create: seed,
        });
    }

    console.log('Seed complete.');
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
