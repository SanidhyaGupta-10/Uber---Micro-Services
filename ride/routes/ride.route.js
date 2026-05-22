import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import * as rideController from '../controllers/ride.controller.js';

const router = Router();

/**
 * @route   POST /create-ride
 * @desc    Create a new ride request (passenger-facing)
 *          Publishes the ride to the 'new-ride' queue to notify available captains
 * @access  Private — user (passenger) must be authenticated via userAuth middleware
 * @body    { pickup: string, destination: string }
 */
router.post('/create-ride', authMiddleware.userAuth, rideController.createRide);

/**
 * @route   PUT /accept-ride
 * @desc    Accept a pending ride request (captain-facing)
 *          Updates ride status to 'accepted' and publishes to 'ride-accepted' queue
 * @access  Private — captain (driver) must be authenticated via captainAuth middleware
 * @query   { rideId: string }
 */
router.put('/accept-ride', authMiddleware.captainAuth, rideController.acceptRide);

export default router;