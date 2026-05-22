import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EventEmitter } from 'events';
import userModel from '../models/user.model.js';
import blacklisttokenModel from '../models/blacklisttoken.model.js';
import rabbitMq from '../service/rabbit.js';

/** EventEmitter used for long-polling the ride-accepted event */
const rideEventEmitter = new EventEmitter();

// ─── Subscribe to RabbitMQ queue ──────────────────────────────────────────────
// Listen for ride-accepted messages and emit them to waiting long-poll clients
rabbitMq.subscribeToQueue('ride-accepted', async (msg) => {
    console.log('ride accepted event received in user service', msg);
    const data = JSON.parse(msg);
    rideEventEmitter.emit('ride-accepted', data);
});

// ─── Controller Functions ─────────────────────────────────────────────────────

/**
 * @route   POST /register
 * @desc    Registers a new user (passenger).
 *          Hashes the password with bcrypt, creates a user document,
 *          signs a JWT, sets it as a cookie, and returns the token + user.
 */
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newUser = new userModel({ name, email, password: hash });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token);

        // Strip password from response
        delete newUser._doc.password;

        res.send({ token, newUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   POST /login
 * @desc    Authenticates an existing user.
 *          Compares the provided password against the stored hash,
 *          signs a JWT, sets it as a cookie, and returns the token + user.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel
            .findOne({ email })
            .select('+password');

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Strip password from response
        delete user._doc.password;

        res.cookie('token', token);

        res.send({ token, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   POST /logout
 * @desc    Logs out the authenticated user.
 *          Blacklists the current JWT token so it cannot be reused,
 *          then clears the token cookie.
 *
 */
export const logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        await blacklisttokenModel.create({ token });
        res.clearCookie('token');
        res.send({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   GET /profile
 * @desc    Returns the authenticated user's profile.
 *          Requires a valid JWT (enforced by userAuth middleware).
 *          The user object is attached to `req.user` by the middleware.
 *
 */

export const profile = async (req, res) => {
    try {
        res.send(req.user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   GET /accepted-ride
 * @desc    Long-polling endpoint that waits for a ride to be accepted.
 *          Listens for the 'ride-accepted' event emitted when a captain
 *          accepts the ride (received via RabbitMQ). Responds with the ride
 *          data when the event fires, or with HTTP 204 after a 30-second timeout.
 */
export const acceptedRide = async (req, res) => {
    // Register a one-time listener for the ride-accepted event
    rideEventEmitter.once('ride-accepted', (data) => {
        res.send(data);
    });

    // Respond with 204 No Content if no event fires within 30 seconds
    setTimeout(() => {
        res.status(204).send();
    }, 30000);
};