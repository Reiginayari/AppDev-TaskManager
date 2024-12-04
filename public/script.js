// Remove the local tasks array since we'll fetch from the API
async function fetchTasks() {
    try {
        const response = await fetch('/api/tasks');
        const tasks = await response.json();
        renderTasks(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach((task) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.innerHTML = `
            <span>${task.title} (Priority: ${task.priority})</span>
            <button onclick="viewTaskDetails('${task._id}')">Details</button>
        `;
        taskList.appendChild(taskElement);
    });
}

document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskData = {
        title: document.getElementById('task-title').value,
        assignedTo: document.getElementById('task-assignee').value,
        dueDate: document.getElementById('task-due-date').value,
        priority: document.getElementById('task-priority').value,
    };

    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            await fetchTasks(); // Refresh the task list
            e.target.reset();
            document.getElementById('add-task-modal').classList.remove('visible');
        }
    } catch (error) {
        console.error('Error creating task:', error);
    }
});

async function viewTaskDetails(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`);
        const task = await response.json();
        
        document.getElementById('task-details-title').textContent = task.title;
        document.getElementById('task-details-info').textContent = `
            Assigned to: ${task.assignedTo}
            Due Date: ${task.dueDate}
            Priority: ${task.priority}
        `;
        
        document.getElementById('comment-list').innerHTML = task.comments
            ? task.comments.map(comment => `<li>${comment}</li>`).join('')
            : '';
            
        document.getElementById('task-details-modal').classList.add('visible');

        // Update comment handling
        document.getElementById('add-comment').onclick = async () => {
            const comment = document.getElementById('new-comment').value;
            if (comment) {
                try {
                    await fetch(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            comments: [...(task.comments || []), comment]
                        })
                    });
                    viewTaskDetails(taskId); // Refresh the details view
                } catch (error) {
                    console.error('Error adding comment:', error);
                }
            }
        };
    } catch (error) {
        console.error('Error fetching task details:', error);
    }
}

// Modal close handlers
document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => 
            modal.classList.remove('visible')
        );
    });
});

// Initial load of tasks
document.addEventListener('DOMContentLoaded', fetchTasks);

// Add this after your existing code
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            link.classList.add('active');
            
            // Update section title
            document.getElementById('section-title').textContent = link.textContent;
            
            // Filter tasks based on the selected navigation
            filterTasks(link.id);
        });
    });
    
    // Add click handler for new task button
    document.getElementById('add-task').addEventListener('click', () => {
        document.getElementById('add-task-modal').classList.add('visible');
    });
}

async function filterTasks(navId) {
    const tasks = await fetchTasks();
    let filteredTasks = tasks;
    
    switch(navId) {
        case 'important-tasks':
            filteredTasks = tasks.filter(task => task.important);
            break;
        case 'assigned-to-me':
            filteredTasks = tasks.filter(task => task.assignedTo === 'User 1'); // Replace with actual user
            break;
        case 'today-tasks':
            const today = new Date().toISOString().split('T')[0];
            filteredTasks = tasks.filter(task => task.dueDate === today);
            break;
    }
    
    renderTasks(filteredTasks);
}

// Add this to your DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    fetchTasks();
    initializeNavigation();
});
