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

    // Calculate completion percentage
    const totalUsers = task.userStatuses.length;
    const completedUsers = task.userStatuses.filter(s => s.status === 'completed').length;
    const completionPercentage = totalUsers > 0 ? Math.round((completedUsers / totalUsers) * 100) : 0;

    // Create status list for all users
    const statusListHTML = task.userStatuses.map(status => `
        <div class="user-status">
            <span class="user-name">${status.user.name}</span>
            <span class="status-badge ${status.status}">${status.status}</span>
        </div>
    `).join('');

    // Add this section right after the completion bar
    const statusButtonsHTML = `
        <div class="my-status-section">
            <h4>Update My Status:</h4>
            <div class="status-buttons">
                <button onclick="updateTaskStatus('${task._id}', 'pending')" 
                        class="status-btn ${userStatus === 'pending' ? 'active' : ''}">
                    Pending
                </button>
                <button onclick="updateTaskStatus('${task._id}', 'in-progress')" 
                        class="status-btn ${userStatus === 'in-progress' ? 'active' : ''}">
                    In Progress
                </button>
                <button onclick="updateTaskStatus('${task._id}', 'completed')" 
                        class="status-btn ${userStatus === 'completed' ? 'active' : ''}">
                    Completed
                </button>
            </div>
        </div>
    `;

    // Insert the status buttons HTML into the task's inner HTML
    div.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="priority ${task.priority}">${task.priority}</span>
        </div>
        <p>${task.description}</p>
        <div class="task-meta">
            <span>Created by: ${task.createdBy.name}</span>
            <span>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}</span>
        </div>
        ${(task.assignedTo.some(u => u._id === currentUserId) || task.createdBy._id === currentUserId) 
            ? statusButtonsHTML 
            : ''
        }
        <div class="completion-bar">
            <div class="completion-progress" style="width: ${completionPercentage}%"></div>
            <span class="completion-text">${completionPercentage}% Complete</span>
        </div>
        
        <div class="status-section">
            <h4>All Users Status:</h4>
            <div class="status-list">
                ${statusListHTML}
            </div>
        </div>
        
        <div class="comments-section">
            <h4>Comments:</h4>
            <ul class="comment-list">
                ${task.comments && task.comments.length > 0 
                    ? task.comments.map(comment => `
                        <li class="comment">
                            <div class="comment-header">
                                <span class="commenter-name">${comment.user.name}</span>
                                <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <div class="comment-text">${comment.text}</div>
                        </li>
                    `).join('')
                    : '<li>No comments yet</li>'
                }
            </ul>
            <div class="comment-input-container">
                <textarea placeholder="Add a comment..." id="comment-input-${task._id}"></textarea>
                <button onclick="addComment('${task._id}')">Add Comment</button>
            </div>
        </div>
    `;

    return div;
}

async function addComment(taskId) {
    const commentText = document.getElementById(`comment-input-${taskId}`).value;
    if (!commentText.trim()) return;
    
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
            
            // Find the correct task element and update its comments
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            const commentsList = taskElement.querySelector('.comment-list');
            
            const commentsHTML = updatedTask.comments.map(comment => {
                const userName = comment.user ? comment.user.name : 'Unknown User';
                const commentDate = new Date(comment.createdAt).toLocaleString();
                return `
                    <li class="comment">
                        <div class="comment-header">
                            <span class="commenter-name">${userName}</span>
                            <span class="comment-date">${commentDate}</span>
                        </div>
                        <div class="comment-text">${comment.text}</div>
                    </li>
                `;
            }).join('');
            
            commentsList.innerHTML = commentsHTML || '<li>No comments yet</li>';
            
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
    try {
        let url = '/api/tasks';
        const params = new URLSearchParams();

        // Get filter values
        const priorityFilter = document.getElementById('filter-priority').value;
        const dateFilter = document.getElementById('filter-date').value;
        const searchTerm = document.getElementById('task-search').value;

        if (priorityFilter && priorityFilter !== 'all') {
            params.append('priority', priorityFilter);
        }
        if (dateFilter) {
            // Don't add a day to the date filter, send it as is
            params.append('dueDate', dateFilter);
        }
        if (searchTerm) {
            params.append('search', searchTerm);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }

        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        displayTasks({ dueToday: [], upcoming: {} });
    }
}

async function displayTasks(taskData) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    if (!taskData || (!taskData.dueToday && !taskData.upcoming)) {
        taskList.innerHTML = '<p>No tasks available.</p>';
        return;
    }

    // Display Due Today tasks
    if (taskData.dueToday && taskData.dueToday.length > 0) {
        taskList.innerHTML += `<h2 class="task-group-header">Due Today</h2>`;
        taskData.dueToday.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    // Display Upcoming tasks
    if (taskData.upcoming && Object.keys(taskData.upcoming).length > 0) {
        Object.keys(taskData.upcoming)
            .sort((a, b) => new Date(a) - new Date(b))
            .forEach(date => {
                // Add one day to match the actual due date
                const displayDate = new Date(date);
                displayDate.setDate(displayDate.getDate() + 1);
                
                const formattedDate = displayDate.toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                taskList.innerHTML += `<h2 class="task-group-header">Due: ${formattedDate}</h2>`;
                taskData.upcoming[date].forEach(task => {
                    const taskElement = createTaskElement(task);
                    taskList.appendChild(taskElement);
                });
            });
    }

    if (taskList.innerHTML === '') {
        taskList.innerHTML = '<p>No tasks found.</p>';
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
    if (!newStatus) return;
    
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
        
        // Get the task element and its components
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const statusList = taskElement.querySelector('.status-list');
        
        // Update the status list
        const statusListHTML = updatedTask.userStatuses.map(status => `
            <div class="user-status">
                <span class="user-name">${status.user.name}</span>
                <span class="status-badge ${status.status}">${status.status}</span>
            </div>
        `).join('');
        
        // Update UI elements
        statusList.innerHTML = statusListHTML;

        // Update completion percentage
        const completionPercentage = Math.round((updatedTask.userStatuses.filter(s => s.status === 'completed').length / updatedTask.userStatuses.length) * 100);
        const completionBar = taskElement.querySelector('.completion-progress');
        const completionText = taskElement.querySelector('.completion-text');
        
        if (completionBar) {
            completionBar.style.width = `${completionPercentage}%`;
        }
        if (completionText) {
            completionText.textContent = `${completionPercentage}% Complete`;
        }

        // Update status buttons
        const statusButtons = taskElement.querySelectorAll('.status-btn');
        statusButtons.forEach(button => {
            const buttonStatus = button.textContent.toLowerCase().trim();
            if (buttonStatus === newStatus) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

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
