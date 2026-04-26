import cors from 'cors';
import express from 'express';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import router from './routes';

const app = express();

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Analyst-Id'],
  }),
);
app.use(requestLogger);
app.use(express.json());
app.use(router);
app.use(notFound);
app.use(errorHandler);

export default app;
