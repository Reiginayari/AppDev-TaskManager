const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

// Apply middleware to all routes
router.use(authMiddleware);

// Get all tasks (only mine and shared with me)
router.get('/', async (req, res) => {
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
});

// Create new task
router.post('/', async (req, res) => {
    try {
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            important: req.body.important,
            dueDate: req.body.dueDate,
            assignedTo: req.body.assignedTo || [],
            createdBy: req.userId,
            priority: req.body.priority
        });

        const newTask = await task.save();
        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');

        res.status(201).json(populatedTask);
    } catch (error) {
        console.error('Task creation error:', error);
        res.status(400).json({ message: error.message || 'Failed to create task' });
    }
});

// Additional routes for update and delete
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, createdBy: req.userId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        
        Object.assign(task, req.body);
        await task.save();
        
        const updatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
            
        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, createdBy: req.userId });
        if (!task) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        await task.deleteOne();
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;