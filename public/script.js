async function fetchTasks() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found');
            window.location.href = '/';
            return [];
        }

        const response = await fetch('/api/tasks', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error response from server:', error);
            throw new Error(error.message || 'Failed to fetch tasks');
        }

        const tasks = await response.json();
        console.log('Fetched tasks:', tasks);
        return tasks;
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

async function loadAndDisplayTasks(filterFn = null) {
    try {
        const tasks = await fetchTasks();
        if (!Array.isArray(tasks)) {
            console.error('Received invalid tasks data:', tasks);
            return;
        }
        
        const filteredTasks = filterFn ? tasks.filter(filterFn) : tasks;
        console.log('Displaying tasks:', filteredTasks);
        displayTasks(filteredTasks);
    } catch (error) {
        console.error('Error in loadAndDisplayTasks:', error);
    }
}

function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        // Task title with priority and important badge
        const titleElement = document.createElement('h3');
        titleElement.textContent = task.title;
        titleElement.className = `priority-${task.priority || 'medium'}`;
        
        if (task.important) {
            const importantBadge = document.createElement('span');
            importantBadge.className = 'important';
            importantBadge.textContent = '!';
            titleElement.appendChild(importantBadge);
        }
        
        // Task details
        const details = document.createElement('p');
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const assignees = task.assignedTo?.map(user => user.name).join(', ') || 'No assignees';
        details.textContent = `Due: ${dueDate} | Assignees: ${assignees}`;
        
        taskContent.appendChild(titleElement);
        taskContent.appendChild(details);
        
        // Task actions
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'task-actions';
        
        // Status select
        const statusSelect = document.createElement('select');
        statusSelect.className = 'status-select';
        ['pending', 'in-progress', 'completed'].forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            if (task.status === status) option.selected = true;
            statusSelect.appendChild(option);
        });
        
        statusSelect.addEventListener('change', async () => {
            try {
                await updateTask(task._id, { status: statusSelect.value });
            } catch (error) {
                console.error('Error updating task status:', error);
                statusSelect.value = task.status; // Revert on error
            }
        });
        
        // Edit and Delete buttons
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-task';
        editBtn.textContent = 'Edit';
        editBtn.onclick = () => editTask(task);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-task';
        deleteBtn.textContent = 'Delete';
        deleteBtn.onclick = () => deleteTask(task._id);
        
        actionsDiv.appendChild(statusSelect);
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        
        taskElement.appendChild(taskContent);
        taskElement.appendChild(actionsDiv);
        taskList.appendChild(taskElement);
    });
}

// Add these helper functions for task operations
async function updateTask(taskId, updates) {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
        throw new Error('Failed to update task');
    }
    
    return response.json();
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (response.ok) {
        loadAndDisplayTasks();
    } else {
        alert('Failed to delete task');
    }
}

// Initial load of tasks
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    // Load initial tasks
    loadAndDisplayTasks();

    // Priority filter
    document.getElementById('filter-priority').addEventListener('change', (e) => {
        const priority = e.target.value;
        if (priority === 'all') {
            loadAndDisplayTasks();
        } else {
            loadAndDisplayTasks(task => task.priority === priority);
        }
    });

    // Important tasks filter
    document.getElementById('important-tasks').addEventListener('click', () => {
        loadAndDisplayTasks(task => task.important);
    });

    // Assigned to me filter
    document.getElementById('assigned-to-me').addEventListener('click', () => {
        const userId = JSON.parse(localStorage.getItem('user')).id;
        loadAndDisplayTasks(task => task.assignedTo.some(user => user._id === userId));
    });

    // Today's tasks filter
    document.getElementById('today-tasks').addEventListener('click', () => {
        const today = new Date().toISOString().split('T')[0];
        loadAndDisplayTasks(task => {
            if (!task.dueDate) return false;
            return task.dueDate.split('T')[0] === today;
        });
    });
});