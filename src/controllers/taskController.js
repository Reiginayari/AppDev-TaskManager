const Task = require('../models/Task');
const User = require('../models/User');

exports.getAllTasks = async (req, res) => {
    try {
        // First, get the user with their co-taskers
        const user = await User.findById(req.userId).select('coTaskers');
        
        // Get tasks where:
        // 1. User created the task
        // 2. User is assigned to the task
        // 3. Task is created by one of user's co-taskers AND user is assigned to it
        const tasks = await Task.find({
            $or: [
                { createdBy: req.userId },
                { assignedTo: req.userId },
                { 
                    $and: [
                        { createdBy: { $in: user.coTaskers || [] } },
                        { assignedTo: req.userId }
                    ]
                }
            ]
        })
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email')
        .sort('-createdAt');
        
        console.log('User ID:', req.userId);
        console.log('User co-taskers:', user.coTaskers);
        console.log('Found tasks:', tasks);
        
        res.json(tasks);
    } catch (error) {
        console.error('Error in getAllTasks:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority,
            createdBy: req.userId,
            assignedTo: req.body.assignedTo
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