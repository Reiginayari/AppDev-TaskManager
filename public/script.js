document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.nav-link');
    const sectionTitle = document.getElementById('section-title');
    const taskDetailsModal = document.getElementById('task-details');
    const closeModal = document.querySelector('.close-modal');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sectionTitle.textContent = tab.textContent;
        });
    });

    document.querySelectorAll('.view-details').forEach(button => {
        button.addEventListener('click', () => {
            taskDetailsModal.classList.remove('hidden');
        });
    });

    closeModal.addEventListener('click', () => {
        taskDetailsModal.classList.add('hidden');
    });
});
