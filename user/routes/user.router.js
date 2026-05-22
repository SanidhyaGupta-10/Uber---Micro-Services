import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as controller from '../controllers/user.controller.js';

const router = Router();

/**
 * @route   POST /register
 * @desc    Register a new user (passenger)
 * @access  Public
 * @body    {
 *  name: string, email: string, password: string }
 */
router.post('/register', controller.register);

/**
 * @route   POST /login
 * @desc    Authenticate a user and return a JWT token
 * @access  Public
 * @body    { email: string, password: string }
 */

router.post('/login', controller.login);

/**
 * @route   POST /logout
 * @desc    Logout the current user by blacklisting their JWT token
 * @access  Public (token required in cookie or Authorization header)
 */

router.post('/logout', controller.logout);

/**
 * @route   GET /profile
 * @desc    Get the authenticated user's profile
 * @access  Private (requires valid JWT via userAuth middleware)
 */

router.get('/profile', authMiddleware.userAuth, controller.profile);

/**
 * @route   GET /accepted-ride
 * @desc    Long-polling endpoint — waits for a ride-accepted event (max 30s)
 * @access  Private (requires valid JWT via userAuth middleware)
 */

router.get('/accepted-ride', authMiddleware.userAuth, controller.acceptedRide);

export default router;