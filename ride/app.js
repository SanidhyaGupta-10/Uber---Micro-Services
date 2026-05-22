import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import connect from './db/db.js';
import rideRoutes from './routes/ride.route.js';
import rabbitMq from './service/rabbit.js';

// Connect to MongoDB
connect();

// Connect to RabbitMQ (non-blocking — log error and continue)
rabbitMq.connect().catch((err) => {
    console.error('Failed to connect to RabbitMQ', err.message);
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount ride routes at the root path
app.use('/', rideRoutes);

export default app;