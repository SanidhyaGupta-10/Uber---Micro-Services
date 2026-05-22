import rideModel from '../model/ride.model.js';
import rabbitMq from '../service/rabbit.js';

/**
 * @route   POST /create-ride
 * @desc    Creates a new ride request.
 *          Saves the ride to the database with status 'requested',
 *          then publishes the ride data to the 'new-ride' RabbitMQ queue
 *          so that available captains can be notified.
 *
 * @async
 * @param {import('express').Request}  req  - Request body: { pickup: string, destination: string }
 *                                           `req.user._id` is set by userAuth middleware
 * @param {import('express').Response} res  - JSON response with the newly created ride document
 * @param {import('express').NextFunction} next - Express next middleware (not used but kept for consistency)
 * @returns {Promise<void>}
 */
export const createRide = async (req, res, next) => {
    const { pickup, destination } = req.body;

    const newRide = new rideModel({
        user: req.user._id,
        pickup,
        destination
    });

    await newRide.save();
    console.log('New ride created', newRide);

    // Notify captains via RabbitMQ
    rabbitMq.publishToQueue('new-ride', JSON.stringify(newRide));

    res.send(newRide);
};

/**
 * @route   PUT /accept-ride
 * @desc    Allows a captain to accept a pending ride request.
 *          Finds the ride by ID (from query params), updates its status to 'accepted',
 *          and publishes the updated ride to the 'ride-accepted' RabbitMQ queue
 *          so the user (passenger) is notified.
 *
 * @async
 * @param {import('express').Request}  req  - Query params: { rideId: string }
 *                                           `req.captain` is set by captainAuth middleware
 * @param {import('express').Response} res  - JSON response with the updated ride document
 * @param {import('express').NextFunction} next - Express next middleware (not used but kept for consistency)
 * @returns {Promise<void>}
 */
export const acceptRide = async (req, res, next) => {
    const { rideId } = req.query;
    const ride = await rideModel.findById(rideId);

    if (!ride) {
        return res.status(404).json({ message: 'Ride not found' });
    }

    ride.status = 'accepted';
    await ride.save();

    // Notify the user that their ride has been accepted via RabbitMQ
    rabbitMq.publishToQueue('ride-accepted', JSON.stringify(ride));

    res.send(ride);
};
