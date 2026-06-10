import { PrismaClient } from '@prisma/client';

// Single shared Prisma instance for the application
export const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
