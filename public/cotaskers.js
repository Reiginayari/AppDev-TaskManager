document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    
    // Load co-taskers into task assignment dropdown
    async function loadCoTaskers() {
        try {
            const response = await fetch('/api/users/coTaskers', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const coTaskers = await response.json();
            
            // Update task assignment dropdown
            const assigneeSelect = document.getElementById('task-assignee');
            assigneeSelect.innerHTML = '<option value="">No Assignee</option>';
            
            coTaskers.forEach(user => {
                const option = document.createElement('option');
                option.value = user._id;
                option.textContent = user.name;
                assigneeSelect.appendChild(option);
            });

            // Update co-tasker list
            const cotaskerList = document.getElementById('cotasker-list');
            cotaskerList.innerHTML = '';
            coTaskers.forEach(user => {
                const div = document.createElement('div');
                div.className = 'cotasker-item';
                div.innerHTML = `
                    <span>${user.name} (${user.email})</span>
                    <button class="remove-cotasker" data-id="${user._id}">Remove</button>
                `;
                cotaskerList.appendChild(div);
            });
        } catch (error) {
            console.error('Error loading co-taskers:', error);
        }
    }

    // Search users
    let searchTimeout;
    document.getElementById('cotasker-email').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const email = e.target.value;
            if (email.length < 3) {
                document.getElementById('search-results').innerHTML = '';
                return;
            }

            try {
                const response = await fetch(`/api/users/search?email=${email}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const users = await response.json();
                
                const searchResults = document.getElementById('search-results');
                searchResults.innerHTML = '';
                users.forEach(user => {
                    const div = document.createElement('div');
                    div.className = 'search-result';
                    div.innerHTML = `
                        <span>${user.name} (${user.email})</span>
                        <button class="add-cotasker" data-id="${user._id}">Add</button>
                    `;
                    searchResults.appendChild(div);
                });
            } catch (error) {
                console.error('Error searching users:', error);
            }
        }, 300);
    });

    // Event delegation for add/remove buttons
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('add-cotasker')) {
            const userId = e.target.dataset.id;
            try {
                await fetch('/api/users/coTaskers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ userId })
                });
                loadCoTaskers();
            } catch (error) {
                console.error('Error adding co-tasker:', error);
            }
        }
    });

    // Initial load
    loadCoTaskers();
});
