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
        const user = await User.findById(req.userId);
        const coTaskerId = req.body.userId;

        if (!user.coTaskers.includes(coTaskerId)) {
            user.coTaskers.push(coTaskerId);
            await user.save();
        }

        res.json({ message: 'Co-tasker added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCoTaskers = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .populate('coTaskers', 'name email');
        res.json(user.coTaskers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};