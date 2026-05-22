import jwt from 'jsonwebtoken';
import axios from 'axios';

/**
 * Middleware — Authenticates a user (passenger) in the Ride service.
 *
 * Verifies the JWT from the cookie or Authorization header, then fetches
 * the user profile from the User microservice via the gateway to confirm
 * the user exists and is valid. Attaches the user to `req.user` on success.
 */
export const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify token signature and expiry locally
        jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the full user profile from the User service through the gateway
        const response = await axios.get(`${process.env.BASE_URL}/user/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const user = response.data;

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Middleware — Authenticates a captain (driver) in the Ride service.
 *
 * Verifies the JWT from the cookie or Authorization header, then fetches
 * the captain profile from the Captain microservice via the gateway to confirm
 * the captain exists and is valid. Attaches the captain to `req.captain` on success.
 *
 */
export const captainAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify token signature and expiry locally
        jwt.verify(token, process.env.JWT_SECRET);

        // Fetch the full captain profile from the Captain service through the gateway
        const response = await axios.get(`${process.env.BASE_URL}/captain/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const captain = response.data;

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { userAuth, captainAuth };