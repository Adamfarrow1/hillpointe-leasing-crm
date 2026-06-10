import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { unitsRouter } from './routes/units.routes.js';
import { prospectsRouter } from './routes/prospects.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/units', unitsRouter);
app.use('/api/prospects', prospectsRouter);
app.use('/api/tasks', tasksRouter);

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
