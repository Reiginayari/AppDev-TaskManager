document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    async function loadCoTaskers() {
        try {
            const response = await fetch('/api/users/coTaskers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const coTaskers = await response.json();
            displayCoTaskers(coTaskers);
        } catch (error) {
            console.error('Error loading co-taskers:', error);
        }
    }

    function displayCoTaskers(coTaskers) {
        const coTaskerList = document.getElementById('co-tasker-list');
        coTaskerList.innerHTML = '';

        coTaskers.forEach(coTasker => {
            const coTaskerElement = document.createElement('div');
            coTaskerElement.textContent = `${coTasker.name} (${coTasker.email})`;
            coTaskerList.appendChild(coTaskerElement);
        });
    }

    loadCoTaskers();
});