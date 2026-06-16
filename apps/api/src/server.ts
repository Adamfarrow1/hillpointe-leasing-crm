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

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Routes
app.use('/api/units', unitsRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/activity-events', activityRouter);
app.use('/api/tours', toursRouter);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Global error handler
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});
