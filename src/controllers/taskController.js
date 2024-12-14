const Task = require('../models/Task');
const User = require('../models/User');

exports.getAllTasks = async (req, res) => {
    try {
        const { priority, dueDate } = req.query;
        const filter = {
            $or: [
                { createdBy: req.userId },
                { assignedTo: req.userId }
            ]
        };

        if (priority && priority !== 'all') filter.priority = priority;
        if (dueDate) filter.dueDate = { $lte: new Date(dueDate) };

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('userStatuses.user', 'name email')
            .sort('-createdAt');

        res.json(tasks);
    } catch (error) {
        console.error('Error in getAllTasks:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createTask = async (req, res) => {
    try {
        const { title, description, priority, assignedTo, dueDate } = req.body;
        
        // Create initial user statuses for all assigned users
        const userStatuses = assignedTo.map(userId => ({
            user: userId,
            status: 'pending'
        }));

        const task = new Task({
            title,
            description,
            priority,
            dueDate: dueDate ? new Date(dueDate) : null,
            createdBy: req.userId,
            assignedTo,
            userStatuses
        });

        const newTask = await task.save();
        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('userStatuses.user', 'name email');

        res.status(201).json(populatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const updates = req.body;
        Object.assign(task, updates);
        await task.save();

        // Notify assigned users
        const notifications = task.assignedTo.map(userId => ({
            userId,
            message: `Task "${task.title}" has been updated.`,
            taskId: task._id,
        }));

        // Save notifications to each user
        await Promise.all(notifications.map(async (notification) => {
            const user = await User.findById(notification.userId);
            user.notifications.push(notification);
            await user.save();
        }));

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

exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Initialize userStatuses if it doesn't exist
        if (!task.userStatuses) {
            task.userStatuses = [];
        }

        // Find the user's status entry
        const statusIndex = task.userStatuses.findIndex(
            s => s.user.toString() === req.userId.toString()
        );

        if (statusIndex > -1) {
            task.userStatuses[statusIndex].status = status;
        } else {
            task.userStatuses.push({
                user: req.userId,
                status: status
            });
        }

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('userStatuses.user', 'name email');

        res.json(updatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.addComment = async (req, res) => {
    try {
        const { taskId } = req.params;  
        const { text } = req.body;      

        // Find the task by its ID
        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Create a comment object
        const comment = {
            user: req.userId,  
            text: text
        };

        task.comments.push(comment);

        await task.save();

        // Return the updated task with populated comments
        const updatedTask = await Task.findById(taskId).populate('comments.user', 'name email');
        res.status(201).json(updatedTask);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: error.message });
    }
};