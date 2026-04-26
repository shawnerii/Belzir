import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { notFound } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import router from './routes/index';

const app = express();

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(requestLogger);
app.use(express.json());
app.use(router);
app.use(notFound);
app.use(errorHandler);

export default app;
