import mongoose from 'mongoose';

/**
 * Mongoose schema for the BlacklistToken collection (Captain service).
 * Stores invalidated JWT tokens to prevent reuse after logout.
 * Documents automatically expire after 1 hour via MongoDB TTL index.
 *
 * @typedef {Object} BlacklistTokenSchema
 * @property {string} token     - The blacklisted JWT token string (required)
 * @property {Date}   createdAt - Timestamp of blacklisting (auto-expires after 3600 seconds)
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