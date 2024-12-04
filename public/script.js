document.getElementById('add-task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-description').value || '',
        assignedTo: document.getElementById('task-assignee').value,
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
            alert(error.message);
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
