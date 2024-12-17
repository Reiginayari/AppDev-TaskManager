let notifications = [];

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    displayUserName();
    loadNotifications();
    setInterval(loadNotifications, 60000);

    // Add notification icon click handler
    const notificationIcon = document.querySelector('.notification-icon');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = document.getElementById('notifications-container');
            if (container) {
                container.classList.toggle('show');
                if (container.classList.contains('show')) {
                    loadNotifications(); // Refresh notifications when opening
                }
            }
        });
    }

    // Close notifications when clicking outside
    document.addEventListener('click', (e) => {
        const container = document.getElementById('notifications-container');
        const icon = document.querySelector('.notification-icon');
        if (container && icon && !container.contains(e.target) && !icon.contains(e.target)) {
            container.classList.remove('show');
        }
    });

    // Add search input handler
    const searchInput = document.getElementById('task-search');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadTasks();
        }, 300);
    });
});

function displayUserName() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('user-name').textContent = user.name;
    }
}

async function handleTaskSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const token = localStorage.getItem('token');

    // Get selected co-taskers
    const selectedCoTaskers = Array.from(form.querySelectorAll('input[name="assignedTo"]:checked'))
        .map(checkbox => checkbox.value);

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: form.title.value,
                description: form.description.value,
                priority: form.priority.value,
                dueDate: form.dueDate.value,
                assignedTo: selectedCoTaskers
            })
        });

        if (response.ok) {
            const task = await response.json();
            document.getElementById('task-modal').classList.remove('visible');
            form.reset();
            loadTasks();

            addNotification(`New task "${task.title}" created successfully.`);
        }
    } catch (error) {
        console.error('Error creating task:', error);
    }
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task';
    div.dataset.taskId = task._id;
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser._id;
    
    // Get current user's status
    const userStatus = task.userStatuses.find(status => 
        status.user._id === currentUserId
    )?.status || 'pending';

    // Get all users involved in the task (creator and assigned users)
    const allUsers = [task.createdBy, ...task.assignedTo];
    const uniqueUsers = Array.from(new Set(allUsers.map(user => user._id)))
        .map(id => allUsers.find(user => user._id === id));

    // Create status list for all users
    const statusListHTML = uniqueUsers.map(user => {
        const status = task.userStatuses.find(s => s.user._id === user._id)?.status || 'pending';
        return `
            <div class="user-status">
                <span class="user-name">${user.name}</span>
                <span class="status-badge ${status}">${status}</span>
            </div>
        `;
    }).join('');

    // Format comments
    const commentsHTML = task.comments && task.comments.length > 0 
        ? task.comments.map(comment => `
            <li class="comment">
                <div class="comment-header">
                    <span class="commenter-name">${comment.user.name}</span>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </li>
        `).join('')
        : '<li>No comments yet</li>';

    div.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="priority ${task.priority}">${task.priority}</span>
        </div>
        <p>${task.description}</p>
        <div class="task-meta">
            <span>Created by: ${task.createdBy.name}</span>
            <span>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'No due date'}</span>
        </div>
        <div class="status-section">
            <h4>Task Status:</h4>
            <div class="status-list">
                ${statusListHTML}
            </div>
            ${(task.assignedTo.some(u => u._id === currentUserId) || task.createdBy._id === currentUserId) ? `
                <div class="my-status">
                    <label>My Status:</label>
                    <div class="status-update-container">
                        <span class="current-status status-badge ${userStatus}">${userStatus}</span>
                        <select class="status-select" onchange="updateTaskStatus('${task._id}', this.value)">
                            <option value="">Change Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>
            ` : ''}
        </div>
        <div class="comments-section">
            <h4>Comments:</h4>
            <ul class="comment-list" id="comment-list-${task._id}">
                ${commentsHTML}
            </ul>
            <div class="comment-input-container">
                <textarea id="comment-input-${task._id}" placeholder="Add a comment..."></textarea>
                <button onclick="addComment('${task._id}')">Add Comment</button>
            </div>
        </div>
    `;

    return div;
}

async function addComment(taskId) {
    const commentText = document.getElementById(`comment-input-${taskId}`).value;
    if (!commentText.trim()) return; // Don't submit empty comments
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ text: commentText })
        });

        if (response.ok) {
            const updatedTask = await response.json();
            
            // Update only the comments section of this specific task
            const commentsList = document.getElementById(`comment-list-${taskId}`);
            const commentsHTML = updatedTask.comments.map(comment => `
                <li class="comment">
                    <div class="comment-header">
                        <span class="commenter-name">${comment.user.name}</span>
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </li>
            `).join('');
            
            commentsList.innerHTML = commentsHTML;
            
            // Clear the input field
            document.getElementById(`comment-input-${taskId}`).value = '';
        } else {
            throw new Error('Failed to add comment');
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        alert('Failed to add comment');
    }
}

function setupEventListeners() {
    const modal = document.getElementById('task-modal');
    
    document.getElementById('add-task').addEventListener('click', async () => {
        modal.classList.add('visible');
        await loadCoTaskers();
    });

    document.querySelector('.close-modal').addEventListener('click', () => {
        modal.classList.remove('visible');
    });

    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
}

async function loadTasks() {
    const token = localStorage.getItem('token');
    const priorityFilter = document.getElementById('filter-priority').value;
    const dateFilter = document.getElementById('filter-date').value;
    const searchTerm = document.getElementById('task-search').value.trim();

    try {
        const params = new URLSearchParams();
        
        if (priorityFilter && priorityFilter !== 'all') {
            params.append('priority', priorityFilter);
        }
        if (dateFilter) {
            params.append('dueDate', dateFilter);
        }
        if (searchTerm) {
            params.append('search', searchTerm);
        }

        const response = await fetch(`/api/tasks?${params.toString()}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch tasks');
        }

        const taskData = await response.json();
        displayTasks(taskData);
    } catch (error) {
        console.error('Error loading tasks:', error);
        displayTasks({ dueToday: [], upcoming: {}, byPriority: {} });
    }
}

function displayTasks(taskData) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (!taskData || (!taskData.dueToday && !taskData.upcoming && !taskData.byPriority)) {
        taskList.innerHTML = '<p>No tasks available.</p>';
        return;
    }

    // Display Due Today tasks if not filtering by priority
    if (!document.getElementById('filter-priority').value || document.getElementById('filter-priority').value === 'all') {
        if (taskData.dueToday && taskData.dueToday.length > 0) {
            taskList.innerHTML += `<h2 class="task-group-header">Due Today</h2>`;
            taskData.dueToday.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }

        // Display Upcoming tasks
        if (taskData.upcoming && Object.keys(taskData.upcoming).length > 0) {
            Object.keys(taskData.upcoming).sort((a, b) => new Date(a) - new Date(b)).forEach(date => {
                taskList.innerHTML += `<h2 class="task-group-header">Upcoming: ${date}</h2>`;
                taskData.upcoming[date].forEach(task => {
                    const taskElement = createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
            });
        }
    }

    // Display tasks by Priority
    if (taskData.byPriority) {
        const priorities = ['High', 'Medium', 'Low'];
        priorities.forEach(priority => {
            if (taskData.byPriority[priority] && taskData.byPriority[priority].length > 0) {
                taskList.innerHTML += `<h3 class="priority-group-header">${priority} Priority</h3>`;
                taskData.byPriority[priority].forEach(task => {
                    const taskElement = createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
            }
        });
    }

    if (taskList.innerHTML === '') {
        taskList.innerHTML = '<p>No tasks found matching the current filters.</p>';
    }
}

async function loadCoTaskers() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/api/users/coTaskers', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const coTaskers = await response.json();
        updateTaskCoTaskersList(coTaskers);
    } catch (error) {
        console.error('Error loading co-taskers:', error);
    }
}

function updateTaskCoTaskersList(coTaskers) {
    const taskCoTaskers = document.getElementById('task-cotaskers');
    if (taskCoTaskers) {
        taskCoTaskers.innerHTML = coTaskers.map(coTasker => `
            <div class="cotasker-checkbox">
                <input type="checkbox" name="assignedTo" value="${coTasker._id}" id="cotasker-${coTasker._id}">
                <label for="cotasker-${coTasker._id}">${coTasker.name}</label>
            </div>
        `).join('');
    }
}

async function updateTaskStatus(taskId, newStatus) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/tasks/${taskId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        const updatedTask = await response.json();
        
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const statusList = taskElement.querySelector('.status-list');
        
        const allUsers = [updatedTask.createdBy, ...updatedTask.assignedTo];
        const uniqueUsers = Array.from(new Set(allUsers.map(user => user._id)))
            .map(id => allUsers.find(user => user._id === id));

        const statusListHTML = uniqueUsers.map(user => {
            const status = updatedTask.userStatuses.find(s => s.user._id === user._id)?.status || 'pending';
            return `
                <div class="user-status">
                    <span class="user-name">${user.name}</span>
                    <span class="status-badge ${status}">${status}</span>
                </div>
            `;
        }).join('');
        
        statusList.innerHTML = statusListHTML;
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('Failed to update task status');
    }
}

async function deleteTask(taskId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete task');
        }

        loadTasks(); // Reload the task list
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Failed to delete task');
    }
}

document.getElementById('filter-priority').addEventListener('change', loadTasks);
document.getElementById('filter-date').addEventListener('change', loadTasks);

function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<p class="no-notifications">No notifications</p>';
        return;
    }

    // Sort notifications by date in descending order (newest first)
    const sortedNotifications = [...notifications].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );

    container.innerHTML = sortedNotifications.map(notif => `
        <div class="notification-container ${notif.read ? 'read' : 'unread'}" data-notification-id="${notif._id}">
            <div class="notification-content">
                <p>${notif.message}</p>
                <small>${new Date(notif.createdAt).toLocaleString(undefined, { 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}</small>
            </div>
            <div class="notification-buttons">
                ${notif.read 
                    ? `<button class="mark-unread-btn" onclick="markNotificationAsUnread('${notif._id}')">
                        Mark as Unread
                       </button>`
                    : `<button class="mark-read-btn" onclick="markNotificationAsRead('${notif._id}')">
                        Mark as Read
                       </button>`
                }
            </div>
        </div>
    `).join('');
}

function addNotification(message) {
    const newNotification = {
        message: message,
        time: new Date()
    };

    notifications.push(newNotification);  
    renderNotifications();  
}

async function loadNotifications() {
    try {
        const response = await fetch('/api/users/notifications', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            notifications = await response.json();
            renderNotifications();
            updateNotificationCount();
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        const response = await fetch(`/api/users/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notifElement) {
                notifElement.classList.remove('unread');
                notifElement.classList.add('read');
                const buttonContainer = notifElement.querySelector('.notification-buttons');
                buttonContainer.innerHTML = `
                    <button class="mark-unread-btn" onclick="markNotificationAsUnread('${notificationId}')">
                        Mark as Unread
                    </button>
                `;
            }
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsAsRead() {
    try {
        const response = await fetch('/api/users/notifications/read-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            // Reload notifications to show updated state
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadNotifications);

async function markNotificationAsUnread(notificationId) {
    try {
        const response = await fetch(`/api/users/notifications/${notificationId}/unread`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            // Update the UI immediately
            const notifElement = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notifElement) {
                notifElement.classList.remove('read');
                notifElement.classList.add('unread');
                // Replace the button
                const buttonContainer = notifElement.querySelector('.notification-buttons');
                buttonContainer.innerHTML = `
                    <button class="mark-read-btn" onclick="markNotificationAsRead('${notificationId}')">
                        Mark as Read
                    </button>
                `;
            }
        }
    } catch (error) {
        console.error('Error marking notification as unread:', error);
    }
}

async function markAllNotificationsAsUnread() {
    try {
        const response = await fetch('/api/users/notifications/unread-all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            // Reload notifications to show updated state
            loadNotifications();
        }
    } catch (error) {
        console.error('Error marking all notifications as unread:', error);
    }
}

function updateNotificationCount() {
    const unreadCount = notifications.filter(notif => !notif.read).length;
    const countElement = document.querySelector('.notification-count');
    countElement.textContent = unreadCount;
    countElement.style.display = unreadCount > 0 ? 'block' : 'none';
}
