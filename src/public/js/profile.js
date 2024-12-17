document.addEventListener('DOMContentLoaded', () => {
<<<<<<< Updated upstream
=======
    renderNotifications();
    
    // Check if user is logged in
>>>>>>> Stashed changes
    const token = localStorage.getItem('token');
    const notificationBtn = document.getElementById('notification-btn');
    const notificationDropdown = document.getElementById('notification-dropdown');
    const notificationList = document.getElementById('notification-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Toggle dropdown visibility
    notificationBtn.addEventListener('click', () => {
        notificationDropdown.classList.toggle('visible');
        loadNotifications();
    });
<<<<<<< Updated upstream

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');  
            localStorage.removeItem('user');   
            window.location.href = '/';         
        });
    }

    async function loadNotifications() {
        const response = await fetch('/api/users/notifications', {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const notifications = await response.json();

        notificationList.innerHTML = notifications.map(notification => `
            <li>
                ${notification.message}
                <small>${new Date(notification.createdAt).toLocaleString()}</small>
            </li>
        `).join('');
    }
});
=======
});

function renderNotifications() {
    const notificationsList = document.getElementById('notifications-list');
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];

    notificationsList.innerHTML = notifications.map(notification => `
        <div class="notification">
            <span class="notification-message">${notification.message}</span>
            <span class="notification-time">${new Date(notification.time).toLocaleString()}</span>
        </div>
    `).join('');
}

function addNotification(message) {
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const newNotification = {
        message: message,
        time: new Date()
    };

    notifications.push(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications)); 
    renderNotifications();  
}
>>>>>>> Stashed changes
