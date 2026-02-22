import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import routes from './routes';
import config from './config';
import { logger } from './utils/logger';
import errorHandler from './middlewares/errorHandler';
import connectDB from './db';

const app = express();

app.use(helmet());

const allowedOrigins = (config as any).frontendUrls || [config.frontendUrl]
const corsOptions = {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return cb(null, true)
    if (allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
app.use(limiter);

app.get('/', (_, res) => res.json({ status: 'ok', service: 'timegen-api' }));

app.use('/api', routes);

app.use(errorHandler);

const PORT = config.port;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});
