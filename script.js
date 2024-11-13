document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.nav-link');
    const sectionTitle = document.getElementById('section-title');
    const taskDetailsModal = document.getElementById('task-details');
    const closeModal = document.querySelector('.close-modal');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sectionTitle.textContent = tab.textContent;
            // Logic to update task list based on the tab clicked
        });
    });

    // Show modal
    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            taskDetailsModal.classList.remove('hidden');
        });
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        taskDetailsModal.classList.add('hidden');
    });
});
