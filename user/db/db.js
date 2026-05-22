import mongoose from 'mongoose';

/**
 * Connects to the MongoDB database using the MONGO_URI environment variable.
 * Falls back to a local MongoDB URI for the user service if MONGO_URI is not set.
 *
 * @returns {void}
 */
function connectDB() {
    const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/user-service';

    mongoose.connect(dbURI).then(() => {
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });
}

export default connectDB;