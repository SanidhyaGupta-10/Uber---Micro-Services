import mongoose from 'mongoose';

/**
 * Mongoose schema for the Captain collection.
 * Stores driver/captain credentials, profile, and availability status.
 *
 * @typedef {Object} CaptainSchema
 * @property {string}  name        - Full name of the captain (required)
 * @property {string}  email       - Unique email address (required)
 * @property {string}  password    - Hashed password (required, not selected by default)
 * @property {boolean} isAvailable - Whether the captain is currently available for rides (default: false)
 */
const captainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    isAvailable: {
        type: Boolean,
        default: false
    }
});

export default mongoose.model('captain', captainSchema);