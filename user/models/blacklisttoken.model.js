import mongoose from 'mongoose';

/**
 * Mongoose schema for the BlacklistToken collection.
 * Stores invalidated JWT tokens to prevent their reuse after logout.
 * Documents automatically expire after 1 hour (matching JWT expiry).
 *
 * @typedef {Object} BlacklistTokenSchema
 * @property {string} token     - The blacklisted JWT token string (required)
 * @property {Date}   createdAt - Timestamp of when the token was blacklisted (auto-expires in 3600s)
 */
const blacklistTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // 1 hour in seconds — MongoDB TTL index auto-removes the document
    }
}, {
    timestamps: true
});

export default mongoose.model('blacklisttoken', blacklistTokenSchema);