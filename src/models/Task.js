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
        ref: 'User'
    }],
    userStatuses: [taskUserStatusSchema],
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Calculate completion percentage
taskSchema.methods.getCompletionPercentage = function() {
    if (!this.userStatuses || this.userStatuses.length === 0) return 0;
    const completedCount = this.userStatuses.filter(status => status.status === 'completed').length;
    return Math.round((completedCount / this.userStatuses.length) * 100);
};

module.exports = mongoose.model('Task', taskSchema);
