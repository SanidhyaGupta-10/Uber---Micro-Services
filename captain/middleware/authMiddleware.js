import jwt from 'jsonwebtoken';
import captainModel from '../models/captain.model.js';
import blacklisttokenModel from '../models/blacklisttoken.model.js';

/**
 * Middleware — Authenticates a captain by verifying their JWT token.
 *
 * Extracts the token from the request cookie or the Authorization header.
 * Rejects blacklisted tokens and tokens that do not belong to a valid captain.
 * On success, attaches the authenticated captain document to `req.captain`.
 *
 */
export const captainAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const isBlacklisted = await blacklisttokenModel.find({ token });

        if (isBlacklisted.length) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const captain = await captainModel.findById(decoded.id);

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.captain = captain;

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default { captainAuth };