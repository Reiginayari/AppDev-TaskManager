document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/';
        return;
    }

    const cotaskerModal = document.getElementById('cotasker-modal');
    const searchInput = document.getElementById('cotasker-search');
    const searchResults = document.getElementById('search-results');

    document.getElementById('manage-cotaskers').addEventListener('click', () => {
        cotaskerModal.classList.add('visible');
        loadCoTaskers();
    });

    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').classList.remove('visible');
        });
    });

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => searchUsers(e.target.value), 300);
    });

    async function searchUsers(email) {
        if (!email) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/api/users/search?email=${email}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await response.json();
            displaySearchResults(users);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    }

    function displaySearchResults(users) {
        searchResults.innerHTML = users.map(user => `
            <div class="user-result">
                <span>${user.name} (${user.email})</span>
                <button class="add-cotasker" data-userid="${user._id}">Add</button>
            </div>
        `).join('');

        searchResults.querySelectorAll('.add-cotasker').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const userId = button.dataset.userid;
                console.log(`Attempting to add co-tasker with ID: ${userId}`);
                try {
                    const response = await fetch('/api/users/coTaskers', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ userId })
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('Co-tasker added successfully:', result);
                        displayCoTaskers(result.coTaskers);
                        updateTaskCoTaskersList(result.coTaskers);
                        searchInput.value = '';
                        searchResults.innerHTML = '';
                    } else {
                        console.error('Failed to add co-tasker:', await response.text());
                    }
                } catch (error) {
                    console.error('Error adding co-tasker:', error);
                }
            });
        });
    }

    async function loadCoTaskers() {
        try {
            const response = await fetch('/api/users/coTaskers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const coTaskers = await response.json();
            displayCoTaskers(coTaskers);
            updateTaskCoTaskersList(coTaskers);
        } catch (error) {
            console.error('Error loading co-taskers:', error);
        }
    }

    function displayCoTaskers(coTaskers) {
        const coTaskerList = document.getElementById('co-tasker-list');
        coTaskerList.innerHTML = coTaskers.map(coTasker => `
            <div class="cotasker-item">
                <span>${coTasker.name} (${coTasker.email})</span>
            </div>
        `).join('');
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
});