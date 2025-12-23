require('dotenv').config();
const express = require('express');
const app = express();
const connectDB = require('./db/db');
connectDB();
const userRoutes = require('./routes/user.router');
const cookieParser = require('cookie-parser');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/', userRoutes)

module.exports = app;