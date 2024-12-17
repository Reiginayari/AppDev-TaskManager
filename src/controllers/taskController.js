const Task = require('../models/Task');
const User = require('../models/User');
const { getIO } = require('../config/socket');

exports.getAllTasks = async (req, res) => {
    try {
        const { priority, dueDate, search } = req.query;
        
        const filter = {
            $or: [
                { createdBy: req.userId },
                { assignedTo: req.userId }
            ]
        };

        if (search) {
            filter.$and = [{
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            }];
        }

        if (priority && priority !== 'all') {
            filter.priority = priority.toLowerCase();
        }

        if (dueDate) {
            const selectedDate = new Date(dueDate);
            selectedDate.setHours(23, 59, 59, 999);
            
            const startDate = new Date(dueDate);
            startDate.setHours(0, 0, 0, 0);
            
            filter.dueDate = {
                $gte: startDate,
                $lte: selectedDate
            };
        }

        const tasks = await Task.find(filter)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email')
            .populate('userStatuses.user', 'name email')
            .populate('comments.user', 'name email')
            .sort('-createdAt');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueToday = [];
        const upcoming = {};
        const byPriority = { high: [], medium: [], low: [] };

        // If priority filter is active, only show tasks in byPriority
        if (priority && priority !== 'all') {
            tasks.forEach(task => {
                if (task.priority === priority.toLowerCase()) {
                    byPriority[priority.toLowerCase()].push(task);
                }
            });

            return res.json({
                dueToday: [],
                upcoming: {},
                byPriority: {
                    High: byPriority.high,
                    Medium: byPriority.medium,
                    Low: byPriority.low
                }
            });
        }

        // Normal categorization for no priority filter
        tasks.forEach(task => {
            if (task.dueDate && new Date(task.dueDate).toDateString() === today.toDateString()) {
                dueToday.push(task);
            }

            if (task.dueDate) {
                const taskDueDate = new Date(task.dueDate);
                const daysDiff = Math.ceil((taskDueDate - today) / (1000 * 60 * 60 * 24));
                if (daysDiff > 0 && daysDiff <= 7) {
                    const formattedDate = taskDueDate.toDateString();
                    if (!upcoming[formattedDate]) upcoming[formattedDate] = [];
                    upcoming[formattedDate].push(task);
                }
            }

            const taskPriority = task.priority.toLowerCase();
            byPriority[taskPriority].push(task);
        });

        res.json({
            dueToday,
            upcoming,
            byPriority: {
                High: byPriority.high,
                Medium: byPriority.medium,
                Low: byPriority.low
            }
        });
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

        // Create notifications for assigned users
        for (const userId of assignedTo) {
            const user = await User.findById(userId);
            if (user) {
                user.notifications.push({
                    message: `You have been assigned to a new task: "${title}"`,
                    taskId: newTask._id,
                    createdAt: new Date(),
                    read: false
                });
                await user.save();
            }
        }

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

        Object.assign(task, req.body);
        await task.save();

        // Emit notification via Socket.IO
        const io = getIO();
        io.emit('notification', {
            message: `Task "${task.title}" has been updated.`,
            taskId: task._id,
            timestamp: new Date().toLocaleString()
        });

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

        const notification = {
            message: `Task "${task.title}" status has been updated to "${status}".`,
            taskId: task._id,
            timestamp: new Date().toLocaleString()
        };
        
        io.emit('notification', notification);

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

        const task = await Task.findById(taskId);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const comment = {
            user: req.userId,  
            text: text
        };

        task.comments.push(comment);
        await task.save();

        // Get all users involved in the task
        const involvedUsers = new Set([
            ...task.assignedTo.map(id => id.toString()),
            task.createdBy.toString()
        ]);
        involvedUsers.delete(req.userId.toString()); // Remove current user

        // Create notifications for all involved users
        const commentUser = await User.findById(req.userId);
        for (const userId of involvedUsers) {
            const user = await User.findById(userId);
            if (user) {
                user.notifications.push({
                    message: `${commentUser.name} commented on task "${task.title}": "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                    taskId: task._id,
                    createdAt: new Date(),
                    read: false
                });
                await user.save();
            }
        }

        const updatedTask = await Task.findById(taskId)
            .populate('comments.user', 'name email')
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
            
        res.status(201).json(updatedTask);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const user = req.user;  
        const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Server error');
    }
};