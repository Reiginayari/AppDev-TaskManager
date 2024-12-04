document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    // Get selected assignees (convert to array)
    const assigneeSelect = document.getElementById('task-assignee');
    const selectedAssignees = Array.from(assigneeSelect.selectedOptions)
        .map(option => option.value)
        .filter(value => value !== ''); // Remove empty values

    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value || '',
        assignedTo: selectedAssignees,
        dueDate: document.getElementById('task-due-date').value,
        priority: document.getElementById('task-priority').value,
        important: document.getElementById('task-important').checked
    };

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            await fetchTasks(); // Refresh the task list
            e.target.reset();
            document.getElementById('add-task-modal').classList.remove('visible');
        } else {
            const error = await response.json();
            console.error('Server error:', error);
            alert(error.message || 'Failed to create task');
        }
    } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task');
    }
});

// Show modals
document.getElementById('add-task').addEventListener('click', () => {
    document.getElementById('add-task-modal').classList.add('visible');
});

document.getElementById('manage-cotaskers').addEventListener('click', () => {
    document.getElementById('manage-cotaskers-modal').classList.add('visible');
});

// Close modals
document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        modal.classList.remove('visible');
        // Reset form if it's the task modal
        if (modal.id === 'add-task-modal') {
            document.getElementById('add-task-form').reset();
        }
    });
});

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('visible');
            if (modal.id === 'add-task-modal') {
                document.getElementById('add-task-form').reset();
            }
        }
    });
});

async function fetchTasks() {
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
        console.error('Error fetching tasks:', error);
    }
}

function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.innerHTML = `
            <div class="task-content">
                <h3>${task.title}</h3>
                <p>${task.description || ''}</p>
                <p>Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
                <p>Created by: ${task.createdBy.name}</p>
                ${task.assignedTo.length ? `
                    <p>Working with: ${task.assignedTo.map(user => user.name).join(', ')}</p>
                ` : '<p>Working alone</p>'}
            </div>
            <div class="task-actions">
                <span class="priority-${task.priority}">${task.priority}</span>
                ${task.important ? '<span class="important">Important</span>' : ''}
                ${task.createdBy._id === getUserId() ? `
                    <button class="edit-task" data-id="${task._id}">Edit</button>
                    <button class="delete-task" data-id="${task._id}">Delete</button>
                ` : ''}
            </div>
        `;
        taskList.appendChild(taskElement);
    });
}

// Initial load of tasks
fetchTasks();

// Add these helper functions
function getUserId() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?._id;
}

// Add event listeners for task actions
document.getElementById('task-list').addEventListener('click', async (e) => {
    const taskId = e.target.dataset.id;
    if (!taskId) return;

    if (e.target.classList.contains('delete-task')) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    fetchTasks();
                }
            } catch (error) {
                console.error('Error deleting task:', error);
            }
        }
    }
    
    if (e.target.classList.contains('edit-task')) {
        // Implement edit functionality here
        // You'll need to create an edit modal similar to the create task modal
    }
});
