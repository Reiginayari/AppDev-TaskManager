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
    div.innerHTML = `
        <div class="task-content">
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            <span class="priority ${task.priority}">${task.priority}</span>
            ${task.assignedTo && task.assignedTo.length > 0 ? `
                <div class="task-assigned">
                    <small>Assigned to: ${task.assignedTo.map(user => user.name).join(', ')}</small>
                </div>
            ` : ''}
        </div>
        <div class="task-actions">
            <button class="edit-task" data-id="${task._id}">Edit</button>
            <button class="delete-task" data-id="${task._id}">Delete</button>
        </div>
    `;

    // Add event listener for delete button
    const deleteButton = div.querySelector('.delete-task');
    deleteButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`/api/tasks/${task._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    div.remove(); // Remove the task element from the DOM
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to delete task');
                }
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Failed to delete task');
            }
        }
    });

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

// ... Add more helper functions for task operations