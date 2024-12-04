const Task = require('../models/Task');

exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            $or: [
                { createdBy: req.userId },
                { assignedTo: req.userId }
            ]
        })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort('-createdAt');
        
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const task = new Task({
            ...req.body,
            createdBy: req.userId,
            assignedTo: req.body.assignedTo || []
        });

        const newTask = await task.save();
        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.userId },
            req.body,
            { new: true }
        )
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.userId
        });

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};