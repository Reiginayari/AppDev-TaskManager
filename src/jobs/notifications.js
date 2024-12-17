const schedule = require('node-schedule');
const Task = require('../models/Task');
const User = require('../models/User');

const notifyDueDates = async () => {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

        const upcomingTasks = await Task.find({
            dueDate: {
                $gte: tomorrow,
                $lt: dayAfterTomorrow
            }
        }).populate('assignedTo createdBy', 'name email');

        for (const task of upcomingTasks) {
            // Get all users involved in the task
            const involvedUsers = new Set([
                ...task.assignedTo.map(user => user._id.toString()),
                task.createdBy._id.toString()
            ]);

            for (const userId of involvedUsers) {
                const user = await User.findById(userId);
                if (user) {
                    // Check if a notification for this task's deadline already exists
                    const existingNotification = user.notifications.find(
                        n => n.taskId?.toString() === task._id.toString() && 
                        n.message.includes('due tomorrow')
                    );

                    if (!existingNotification) {
                        user.notifications.push({
                            message: `Task "${task.title}" is due tomorrow!`,
                            taskId: task._id,
                            createdAt: new Date(),
                            read: false
                        });
                        await user.save();
                    }
                }
            }
        }
        console.log("Due date notifications sent successfully!");
    } catch (error) {
        console.error("Error sending due date notifications:", error);
    }
};

// Schedule the job to run every hour
const scheduleDueDateNotifications = () => {
    schedule.scheduleJob('0 * * * *', notifyDueDates);
};

module.exports = { scheduleDueDateNotifications };
