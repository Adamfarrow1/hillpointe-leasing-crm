import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const seeds = [
        { unitNumber: '101', status: 'available' },
        { unitNumber: '102', status: 'held' },
        { unitNumber: '103', status: 'leased' },
        { unitNumber: '201', status: 'available' },
        { unitNumber: '202', status: 'available' },
    ] as const;

    for (const seed of seeds) {
        await prisma.unit.upsert({
            where: { unitNumber: seed.unitNumber },
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
