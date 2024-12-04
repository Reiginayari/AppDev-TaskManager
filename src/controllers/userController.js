const User = require('../models/User');

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
        const session = await User.startSession();
        session.startTransaction();

        try {
            const user = await User.findById(req.userId).session(session);
            const coTasker = await User.findById(req.body.userId).session(session);

            if (!user || !coTasker) {
                await session.abortTransaction();
                return res.status(404).json({ message: 'User not found' });
            }

            // Initialize arrays if they don't exist
            if (!user.coTaskers) user.coTaskers = [];
            if (!coTasker.coTaskers) coTasker.coTaskers = [];

            // Convert to strings for comparison
            const userCoTaskerIds = user.coTaskers.map(id => id.toString());
            const coTaskerIds = coTasker.coTaskers.map(id => id.toString());

            // Add bidirectional relationship
            if (!userCoTaskerIds.includes(coTasker._id.toString())) {
                user.coTaskers.push(coTasker._id);
                await user.save({ session });
            }

            if (!coTaskerIds.includes(user._id.toString())) {
                coTasker.coTaskers.push(user._id);
                await coTasker.save({ session });
            }

            await session.commitTransaction();
            
            // Reload both users with populated coTaskers
            const updatedUser = await User.findById(req.userId)
                .populate('coTaskers', 'name email');
            
            res.json({ message: 'Co-tasker added successfully', coTaskers: updatedUser.coTaskers });
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
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