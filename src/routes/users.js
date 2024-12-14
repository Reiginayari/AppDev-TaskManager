const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

router.use(authMiddleware);

// Route for searching users
router.get('/search', userController.searchUsers);

// Route for adding co-taskers
router.post('/coTaskers', userController.addCoTasker);

// Route for getting co-taskers
router.get('/coTaskers', userController.getCoTaskers);

// Route for removing co-taskers
router.delete('/coTaskers', userController.removeCoTasker);

router.get('/notifications', async (req, res) => {
    const user = await User.findById(req.userId).select('notifications');
    res.json(user.notifications);
});

router.post('/notifications/read', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Mark all notifications as read
        user.notifications.forEach(notification => {
            notification.read = true;
        });

        await user.save();
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;