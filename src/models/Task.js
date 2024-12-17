const mongoose = require('mongoose');

const taskUserStatusSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending'
    }
}, { _id: false });

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    dueDate: {
        type: Date
    },
    important: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
    },
    comments: [commentSchema],  
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    }],
    userStatuses: [taskUserStatusSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add compound index for better query performance
taskSchema.index({ createdBy: 1, assignedTo: 1 });

// Calculate completion percentage
taskSchema.methods.getCompletionPercentage = function() {
    // If there are no assigned users or no user statuses, return 0
    if (!this.userStatuses || this.userStatuses.length === 0) return 0;
    
    // Count how many users have completed status
    const completedCount = this.userStatuses.filter(status => status.status === 'completed').length;
    
    // Calculate percentage based on all users (including creator)
    return Math.round((completedCount / this.userStatuses.length) * 100);
};

module.exports = mongoose.model('Task', taskSchema);
