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

// Get all notifications
router.get('/notifications', async (req, res) => {
    const user = await User.findById(req.userId).select('notifications');
    res.json(user.notifications);
});

// Mark a single notification as read
router.post('/notifications/:notificationId/read', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const notification = user.notifications.id(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await user.save();
        
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: error.message });
    }
});

// Mark all notifications as read
router.post('/notifications/read-all', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.notifications.forEach(notification => {
            notification.read = true;
        });

        await user.save();
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: error.message });
    }
});

// Mark notification as unread
router.post('/notifications/:notificationId/unread', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const notification = user.notifications.id(req.params.notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = false;
        await user.save();
        res.json({ message: 'Notification marked as unread' });
    } catch (error) {
        console.error('Error marking notification as unread:', error);
        res.status(500).json({ message: error.message });
    }
});

// Mark all notifications as unread
router.post('/notifications/unread-all', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.notifications.forEach(notification => {
            notification.read = false;
        });

        await user.save();
        res.json({ message: 'All notifications marked as unread' });
    } catch (error) {
        console.error('Error marking all notifications as unread:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;