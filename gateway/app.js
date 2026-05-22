import express from 'express';
import expressProxy from 'express-http-proxy';

const app = express();

app.use(express.json());

/**
 * @route   /user/*
 * @desc    Proxy all /user requests to the User microservice (port 3001)
 * @service User Service — handles passenger registration, login, logout, profile
 */

app.use('/user', expressProxy('http://localhost:3001'));

/**
 * @route   /captain/*
 * @desc    Proxy all /captain requests to the Captain microservice (port 3002)
 * @service Captain Service — handles driver registration, login, logout, profile, availability, ride polling
 */

app.use('/captain', expressProxy('http://localhost:3002'));

/**
 * @route   /ride/*
 * @desc    Proxy all /ride requests to the Ride microservice (port 3003)
 * @service Ride Service — handles ride creation and captain ride acceptance
 */

app.use('/ride', expressProxy('http://localhost:3003'));

app.listen(3000, () => {
    console.log('API Gateway is running on port 3000');
});