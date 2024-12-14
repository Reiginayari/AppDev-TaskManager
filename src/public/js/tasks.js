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
    
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const currentUserId = currentUser._id;
    
    // Initialize userStatuses if it doesn't exist
    if (!task.userStatuses) {
        task.userStatuses = [];
    }

    // Add creator to userStatuses if not present
    if (!task.userStatuses.some(status => status.user._id === task.createdBy._id)) {
        task.userStatuses.push({
            user: task.createdBy,
            status: 'pending'
        });
    }

    // Add current user to userStatuses if they're assigned but not present
    if (task.assignedTo.some(user => user._id === currentUserId) && 
        !task.userStatuses.some(status => status.user._id === currentUserId)) {
        task.userStatuses.push({
            user: currentUser,
            status: 'pending'
        });
    }

    const totalUsers = task.assignedTo.length + 1; // +1 for creator
    const completedCount = task.userStatuses.filter(s => s.status === 'completed').length;
    const completionPercentage = totalUsers > 0 ? Math.round((completedCount / totalUsers) * 100) : 0;

    div.innerHTML = `
        <div class="task-header">
            <h3>${task.title}</h3>
            <span class="priority ${task.priority}">${task.priority}</span>
            ${task.createdBy._id === currentUserId ? 
                `<button class="delete-task" data-task-id="${task._id}">Delete</button>` 
                : ''
            }
        </div>
        <p>${task.description}</p>
        <div class="task-meta">
            <span class="due-date">Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
            <div class="completion-progress">
                <div class="progress-bar" style="width: ${completionPercentage}%"></div>
                <span>${completionPercentage}% Complete (${completedCount}/${totalUsers} completed)</span>
            </div>
        </div>
        <div class="task-statuses">
            ${task.userStatuses.map(status => `
                <div class="user-status">
                    <span>${status.user.name}: ${status.status}</span>
                    ${status.user._id === currentUserId ? `
                        <select class="status-select" data-task-id="${task._id}">
                            <option value="pending" ${status.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in-progress" ${status.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="completed" ${status.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `;

    // Add event listeners after setting innerHTML
    const deleteButton = div.querySelector('.delete-task');
    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this task?')) {
                await deleteTask(task._id);
            }
        });
    }

    const statusSelect = div.querySelector('.status-select');
    if (statusSelect) {
        statusSelect.addEventListener('change', async (e) => {
            const taskId = e.target.dataset.taskId;
            const newStatus = e.target.value;
            await updateTaskStatus(taskId, newStatus);
        });
    }

    return div;
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

        // Reload tasks to show updated status
        await loadTasks();
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
