import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { unitsRouter } from './routes/units.routes.js';
import { prospectsRouter } from './routes/prospects.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { activityRouter } from './routes/activity.routes.js';
import { toursRouter } from './routes/tours.routes.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

// CORS — allow the Vercel frontend in production, localhost in development
const allowedOrigins = IS_PROD
    ? [process.env.FRONTEND_URL].filter(Boolean) as string[]
    : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: false }));
app.use(express.json());

// API routes
app.use('/api/units', unitsRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/activity-events', activityRouter);
app.use('/api/tours', toursRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
});

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
