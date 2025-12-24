require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./db/db');
connectDB();
const captainRoutes = require('./routes/captain.router');
const cookieParser = require('cookie-parser');

const rabbitMq = require('./service/rabbit')

rabbitMq.connect().catch((err) => {
    console.error('Failed to connect to RabbitMQ', err.message);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', captainRoutes)

module.exports = app;