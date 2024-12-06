const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Route for searching users
router.get('/search', userController.searchUsers);

// Route for adding co-taskers
router.post('/coTaskers', userController.addCoTasker);

// Route for getting co-taskers
router.get('/coTaskers', userController.getCoTaskers);

// Route for removing co-taskers
router.delete('/coTaskers', userController.removeCoTasker);

module.exports = router;