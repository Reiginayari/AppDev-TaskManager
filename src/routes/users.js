const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);
router.get('/search', userController.searchUsers);
router.post('/coTaskers', userController.addCoTasker);
router.get('/coTaskers', userController.getCoTaskers);

module.exports = router;