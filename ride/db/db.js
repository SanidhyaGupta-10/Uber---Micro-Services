import mongoose from 'mongoose';

/**
 * Connects the Ride service to its MongoDB database using the MONGO_URI environment variable.
 */
function connect() {
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log('Ride Service connected to MongoDB');
    }).catch((err) => {
        console.log(err);
    });
}

export default connect;