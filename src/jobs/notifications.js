const schedule = require('node-schedule');
const Task = require('../models/Task');
const User = require('../models/User');

const notifyDueDates = async () => {
    try {
        const now = new Date();
        const upcomingTasks = await Task.find({
            dueDate: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) }, // Due within 24 hours
        }).populate('assignedTo', '_id');

        for (const task of upcomingTasks) {
            for (const user of task.assignedTo) {
                const userDoc = await User.findById(user._id);
                userDoc.notifications.push({
                    message: `Task "${task.title}" is due soon.`,
                    taskId: task._id,
                });
                await userDoc.save();
            }
        }
        console.log("Notifications for due tasks sent successfully!");
    } catch (error) {
        console.error("Error sending due task notifications:", error);
    }
};

// Schedule the job to run every hour
const scheduleDueDateNotifications = () => {
    schedule.scheduleJob('0 * * * *', notifyDueDates); // Runs every hour
};

module.exports = { scheduleDueDateNotifications };
