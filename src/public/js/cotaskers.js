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
        const searchTerm = e.target.value.trim();
        searchTimeout = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchUsers(searchTerm);
            } else {
                searchResults.innerHTML = '';
            }
        }, 300);
    });

    async function searchUsers(email) {
        try {
            const response = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const users = await response.json();
            console.log('Search results:', users);
            displaySearchResults(users);
        } catch (error) {
            console.error('Error searching users:', error);
            searchResults.innerHTML = '<div class="error">Error searching users</div>';
        }
    }

    function displaySearchResults(users) {
        if (!users || users.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No users found</div>';
            return;
        }

        searchResults.innerHTML = users.map(user => `
            <div class="user-result">
                <span>${user.name} (${user.email})</span>
                <button class="add-cotasker" data-userid="${user._id}">Add</button>
            </div>
        `).join('');

        const addButtons = searchResults.querySelectorAll('.add-cotasker');
        addButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const userId = button.dataset.userid;
                button.disabled = true;
                button.textContent = 'Adding...';

                try {
                    const response = await fetch('/api/users/coTaskers', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ userId })
                    });

                    const result = await response.json();

                    if (!response.ok) {
                        throw new Error(result.message || 'Failed to add co-tasker');
                    }

                    console.log('Co-tasker added:', result);
                    
                    displayCoTaskers(result.coTaskers);
                    updateTaskCoTaskersList(result.coTaskers);
                    
                    searchInput.value = '';
                    searchResults.innerHTML = '';
                    
                    const successMsg = document.createElement('div');
                    successMsg.className = 'success-message';
                    successMsg.textContent = 'Co-tasker added successfully!';
                    searchResults.appendChild(successMsg);
                    setTimeout(() => successMsg.remove(), 3000);
                    
                } catch (error) {
                    console.error('Error adding co-tasker:', error);
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = error.message || 'Failed to add co-tasker';
                    searchResults.appendChild(errorMsg);
                    setTimeout(() => errorMsg.remove(), 3000);
                    
                    button.textContent = 'Error';
                    setTimeout(() => {
                        button.disabled = false;
                        button.textContent = 'Add';
                    }, 2000);
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
                <button class="remove-cotasker" data-userid="${coTasker._id}">Remove</button>
            </div>
        `).join('');

        const removeButtons = coTaskerList.querySelectorAll('.remove-cotasker');
        removeButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = button.dataset.userid;
                await removeCoTasker(userId);
            });
        });
    }

    async function removeCoTasker(userId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/users/coTaskers`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                throw new Error('Failed to remove co-tasker');
            }

            const result = await response.json();
            console.log('Co-tasker removed:', result);
            loadCoTaskers();
        } catch (error) {
            console.error('Error removing co-tasker:', error);
            alert(error.message || 'Failed to remove co-tasker');
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
});