import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        // Run serially to avoid SQLite write contention across test files
        fileParallelism: false,
        env: {
            DATABASE_URL: 'file:./prisma/test.db',
        },
    },
});
