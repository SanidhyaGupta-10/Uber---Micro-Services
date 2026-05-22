import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import * as captainController from '../controllers/captain.controller.js';

const router = Router();

/**
 * @route   POST /register
 * @desc    Register a new captain (driver)
 * @access  Public
 * @body    { name: string, email: string, password: string }
 */
router.post('/register', captainController.register);

/**
 * @route   POST /login
 * @desc    Authenticate a captain and return a JWT token
 * @access  Public
 * @body    { email: string, password: string }
 */
router.post('/login', captainController.login);

/**
 * @route   POST /logout
 * @desc    Logout the current captain by blacklisting their JWT token
 * @access  Public (token required in cookie or Authorization header)
 */
router.post('/logout', captainController.logout);

/**
 * @route   GET /profile
 * @desc    Get the authenticated captain's profile
 * @access  Private (requires valid JWT via captainAuth middleware)
 */
router.get('/profile', authMiddleware.captainAuth, captainController.profile);

/**
 * @route   PATCH /toggle-availability
 * @desc    Toggle the captain's availability status (available / unavailable)
 * @access  Private (requires valid JWT via captainAuth middleware)
 */
router.patch('/toggle-availability', authMiddleware.captainAuth, captainController.toggleAvailability);

/**
 * @route   GET /new-ride
 * @desc    Long-polling endpoint — waits for a new ride request (max 30s)
 * @access  Private (requires valid JWT via captainAuth middleware)
 */
router.get('/new-ride', authMiddleware.captainAuth, captainController.waitForNewRide);

export default router;