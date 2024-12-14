document.addEventListener('DOMContentLoaded', () => {
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
