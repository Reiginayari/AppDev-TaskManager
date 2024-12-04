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
                priority: form.priority.value
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
        </div>
        <div class="task-actions">
            <button class="edit-task" data-id="${task._id}">Edit</button>
            <button class="delete-task" data-id="${task._id}">Delete</button>
        </div>
    `;
    return div;
}

function setupEventListeners() {
    const modal = document.getElementById('task-modal');
    
    document.getElementById('add-task').addEventListener('click', () => {
        modal.classList.add('visible');
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

// ... Add more helper functions for task operations