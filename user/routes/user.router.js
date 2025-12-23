const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const authMiddleware = require('../middleware/authMiddleware');



router.post('/register', controller.register);
router.post('/login', controller.register);
router.post('/logout', controller.register);
router.get('/profile', authMiddleware.userAuth, controller.profile);


module.exports = router;