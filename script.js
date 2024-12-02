const tasks = []; 

function renderTasks() {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task';
        taskElement.innerHTML = `
            <span>${task.title} (Priority: ${task.priority})</span>
            <button onclick="viewTaskDetails(${index})">Details</button>
        `;
        taskList.appendChild(taskElement);
    });
}

document.getElementById('add-task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const assignee = document.getElementById('task-assignee').value;
    const dueDate = document.getElementById('task-due-date').value;
    const priority = document.getElementById('task-priority').value;

    tasks.push({ title, assignee, dueDate, priority, comments: [] });
    renderTasks();
    e.target.reset();
    document.getElementById('add-task-modal').classList.remove('visible');
});

function viewTaskDetails(index) {
    const task = tasks[index];
    document.getElementById('task-details-title').textContent = task.title;
    document.getElementById('task-details-info').textContent = `
        Assigned to: ${task.assignee}
        Due Date: ${task.dueDate}
        Priority: ${task.priority}
    `;
    document.getElementById('comment-list').innerHTML = task.comments
        .map(comment => `<li>${comment}</li>`)
        .join('');
    document.getElementById('task-details-modal').classList.add('visible');

    document.getElementById('add-comment').onclick = () => {
        const comment = document.getElementById('new-comment').value;
        if (comment) {
            task.comments.push(comment);
            viewTaskDetails(index); 
        }
    };
}

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('visible'));
    });
});
