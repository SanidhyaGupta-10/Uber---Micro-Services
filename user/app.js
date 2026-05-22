import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './db/db.js';
import userRoutes from './routes/user.router.js';
import rabbitMq from './service/rabbit.js';

// Connect to MongoDB
connectDB();

// Connect to RabbitMQ (non-blocking — log error and continue)
rabbitMq.connect().catch((err) => {
    console.error('Failed to connect to RabbitMQ', err.message);
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount user routes at the root path
app.use('/', userRoutes);

export default app;