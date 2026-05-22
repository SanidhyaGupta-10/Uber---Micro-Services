import mongoose from 'mongoose';

/**
 * Mongoose schema for the User collection.
 * Stores rider/passenger credentials and profile information.
 *
 * @typedef {Object} UserSchema
 * @property {string} name     - Full name of the user (required)
 * @property {string} email    - Unique email address of the user (required)
 * @property {string} password - Hashed password of the user (required, not selected by default)
 */
const userSchema = new mongoose.Schema({
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
});

export default mongoose.model('User', userSchema);