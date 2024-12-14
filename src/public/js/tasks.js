document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
    displayUserName();
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
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
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
            <span>Due: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'No due date'}</span>
        </div>
        <div class="status-section">
            <h4>Task Status:</h4>
            <div class="status-list">
                ${statusListHTML}
            </div>
            ${(task.assignedTo.some(u => u._id === currentUserId) || task.createdBy._id === currentUserId) ? `
                <div class="my-status">
                    <label>Update My Status:</label>
                    <select class="status-select" onchange="updateTaskStatus('${task._id}', this.value)">
                        <option value="pending" ${userStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="in-progress" ${userStatus === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="completed" ${userStatus === 'completed' ? 'selected' : ''}>Completed</option>
                    </select>
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
                        <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
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
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
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
        
        // Find and update the specific task's status list
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const statusList = taskElement.querySelector('.status-list');
        
        // Get all users involved in the task
        const allUsers = [updatedTask.createdBy, ...updatedTask.assignedTo];
        const uniqueUsers = Array.from(new Set(allUsers.map(user => user._id)))
            .map(id => allUsers.find(user => user._id === id));

        // Update the status list HTML
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

async function loadTasks() {
    const priority = document.getElementById('filter-priority').value;
    const dueDate = document.getElementById('filter-date').value;
    const token = localStorage.getItem('token');

    const response = await fetch(`/api/tasks?priority=${priority}&dueDate=${dueDate}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    const tasks = await response.json();
    displayTasks(tasks);
}
