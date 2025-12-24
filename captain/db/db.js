const mongoose = require('mongoose');

function connectDB() {
    const dbURI = process.env.MONGO_URI || 'mongodb://localhost:27017/uber_captain_service';

    mongoose.connect(dbURI).then(() => {
        console.log('Connected to MongoDB');
    }).catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });
}

module.exports = connectDB; 