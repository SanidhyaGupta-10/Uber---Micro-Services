import mongoose from 'mongoose';

/**
 * Mongoose schema for the Ride collection.
 * Represents a ride request created by a user (passenger) and optionally
 * assigned to a captain (driver).
 *
 * @typedef {Object} RideSchema
 * @property {mongoose.Types.ObjectId} captain     - Reference to the Captain document (optional — assigned on acceptance)
 * @property {mongoose.Types.ObjectId} user        - Reference to the User document (required)
 * @property {string}                  pickup      - Pickup location string (required)
 * @property {string}                  destination - Destination location string (required)
 * @property {string}                  status      - Current ride status: 'requested' | 'accepted' | 'started' | 'completed'
 */
const rideSchema = new mongoose.Schema({
    captain: {
        type: mongoose.Schema.Types.ObjectId,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    pickup: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'accepted', 'started', 'completed'],
        default: 'requested'
    },
}, {
    timestamps: true
});

export default mongoose.model('ride', rideSchema);