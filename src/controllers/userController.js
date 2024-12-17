const User = require('../models/User');
const Task = require('../models/Task');

exports.searchUsers = async (req, res) => {
    try {
        const searchEmail = req.query.email;
        const users = await User.find({
            email: { $regex: searchEmail, $options: 'i' },
            _id: { $ne: req.userId }
        }).select('name email');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.addCoTasker = async (req, res) => {
    try {
        // Check if userId is provided
        if (!req.body.userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // Check if user exists
        const user = await User.findById(req.userId);
        const coTasker = await User.findById(req.body.userId);

        if (!user || !coTasker) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize arrays if they don't exist
        if (!user.coTaskers) user.coTaskers = [];
        if (!coTasker.coTaskers) coTasker.coTaskers = [];

        // Check if already a co-tasker
        if (user.coTaskers.includes(coTasker._id)) {
            return res.status(400).json({ message: 'Already a co-tasker' });
        }

        // Add bidirectional relationship
        user.coTaskers.push(coTasker._id);
        coTasker.coTaskers.push(user._id);

        // Save both users
        await user.save();
        await coTasker.save();

        // Fetch updated user with populated coTaskers
        const updatedUser = await User.findById(req.userId)
            .populate('coTaskers', 'name email');

        res.json({ 
            message: 'Co-tasker added successfully', 
            coTaskers: updatedUser.coTaskers 
        });
    } catch (error) {
        console.error('Error in addCoTasker:', error);
        res.status(500).json({ message: error.message });
    }
};


exports.getCoTaskers = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('coTaskers', 'name email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize coTaskers array if it doesn't exist
        if (!user.coTaskers) {
            user.coTaskers = [];
            await user.save();
        }

        // Return the populated coTaskers array
        res.json(user.coTaskers);
    } catch (error) {
        console.error('Error in getCoTaskers:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.removeCoTasker = async (req, res) => {
    try {
        const { userId } = req.body;
        console.log('Removing co-tasker with ID:', userId);

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(req.userId);
        const coTasker = await User.findById(userId);

        if (!user || !coTasker) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove co-tasker from both users
        user.coTaskers.pull(coTasker._id);
        coTasker.coTaskers.pull(user._id);

        // Delete tasks where the co-tasker is assigned and the current user created them
        await Task.deleteMany({
            createdBy: user._id,
            assignedTo: coTasker._id
        });

        // Unassign the co-tasker from tasks created by the user
        await Task.updateMany(
            { createdBy: user._id },
            { $pull: { assignedTo: coTasker._id } }
        );

        // Delete tasks where the current user is assigned and the co-tasker created them
        await Task.deleteMany({
            createdBy: coTasker._id,
            assignedTo: user._id
        });

        await user.save();
        await coTasker.save();

        // Return updated co-taskers list
        const updatedUser = await User.findById(req.userId)
            .populate('coTaskers', 'name email');

        res.json({ 
            message: 'Co-tasker removed successfully',
            coTaskers: updatedUser.coTaskers 
        });
    } catch (error) {
        console.error('Error in removeCoTasker:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const user = await User.findById(req.userId);
        
        const notification = user.notifications.id(notificationId);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        notification.read = true;
        await user.save();

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.markAllNotificationsAsRead = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        user.notifications.forEach(notification => {
            notification.read = true;
        });
        
        await user.save();
        
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};