import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import captainModel from '../models/captain.model.js';
import blacklisttokenModel from '../models/blacklisttoken.model.js';
import rabbitMq from '../service/rabbit.js';

/**
 * Array holding pending long-poll response objects awaiting a new-ride event.
 * When a new-ride message arrives via RabbitMQ, all pending responses are flushed.
 */
const pendingRequests = [];

// ─── Subscribe to RabbitMQ queue ──────────────────────────────────────────────
// Listen for new-ride messages and push ride data to all long-polling captains
rabbitMq.subscribeToQueue('new-ride', (data) => {
    const rideData = JSON.parse(data);
    console.log('new ride request for captain', rideData);

    // Send the new ride data to all waiting long-poll clients
    pendingRequests.forEach((res) => {
        res.json(rideData);
    });

    // Clear the pending requests array after flushing
    pendingRequests.length = 0;
});

// ─── Controller Functions ─────────────────────────────────────────────────────

/**
 * @route   POST /register
 * @desc    Registers a new captain (driver).
 *          Hashes the password with bcrypt, creates a captain document,
 *          signs a JWT, sets it as a cookie, and returns the token + captain.
 */
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const captain = await captainModel.findOne({ email });

        if (captain) {
            return res.status(400).json({ message: 'Captain already exists' });
        }

        const hash = await bcrypt.hash(password, 10);
        const newCaptain = new captainModel({ name, email, password: hash });

        await newCaptain.save();

        const token = jwt.sign({ id: newCaptain._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token);

        // Strip password from response
        delete newCaptain._doc.password;

        res.send({ token, newCaptain });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   POST /login
 * @desc    Authenticates an existing captain.
 *          Compares the provided password against the stored hash,
 *          signs a JWT, sets it as a cookie, and returns the token + captain.
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const captain = await captainModel
            .findOne({ email })
            .select('+password');

        if (!captain) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, captain.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: captain._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Strip password from response
        delete captain._doc.password;

        res.cookie('token', token);

        res.send({ token, captain });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   POST /logout
 * @desc    Logs out the authenticated captain.
 *          Blacklists the current JWT token so it cannot be reused,
 *          then clears the token cookie.
 */
export const logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        await blacklisttokenModel.create({ token });
        res.clearCookie('token');
        res.send({ message: 'Captain logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   GET /profile
 * @desc    Returns the authenticated captain's profile.
 *          Requires a valid JWT (enforced by captainAuth middleware).
 *          The captain object is attached to `req.captain` by the middleware.
 */
export const profile = async (req, res) => {
    try {
        res.send(req.captain);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   PATCH /toggle-availability
 * @desc    Toggles the captain's availability status between true and false.
 *          Requires a valid JWT (enforced by captainAuth middleware).
 */
export const toggleAvailability = async (req, res) => {
    try {
        const captain = await captainModel.findById(req.captain._id);
        captain.isAvailable = !captain.isAvailable;
        await captain.save();
        res.send(captain);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @route   GET /new-ride
 * @desc    Long-polling endpoint that waits for a new ride request.
 *          Adds the response object to a shared pending array; when a new-ride
 *          message is received from RabbitMQ, all pending responses are flushed
 *          with the ride data. Responds with HTTP 204 if no event fires within 30s.
 */
export const waitForNewRide = async (req, res) => {
    // Respond with 204 No Content if no new-ride event fires within 30 seconds
    req.setTimeout(30000, () => {
        res.status(204).end();
    });

    // Register this response to be notified when a new ride arrives
    pendingRequests.push(res);
};
