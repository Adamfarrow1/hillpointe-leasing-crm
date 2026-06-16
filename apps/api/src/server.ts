import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { unitsRouter } from './routes/units.routes.js';
import { prospectsRouter } from './routes/prospects.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { activityRouter } from './routes/activity.routes.js';
import { toursRouter } from './routes/tours.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
if (IS_PROD) {
    // In production the API serves the frontend — no CORS needed
    app.use(express.json());
} else {
    const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : ['http://localhost:5173'];
    app.use(cors({ origin: allowedOrigins, credentials: true }));
    app.use(express.json());
}

// API routes — must be registered BEFORE the static/fallback handlers
app.use('/api/units', unitsRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/activity-events', activityRouter);
app.use('/api/tours', toursRouter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// In production: serve the Vite frontend and handle client-side routing
if (IS_PROD) {
    // dist/server.js lives at apps/api/dist/server.js
    // apps/web/dist is two levels up then into web/dist
    const webDist = path.resolve(__dirname, '..', '..', '..', 'apps', 'web', 'dist');
    app.use(express.static(webDist));
    app.get('*', (_req, res) => {
        res.sendFile(path.join(webDist, 'index.html'));
    });
}

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
