const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./src/config/db');
require('dotenv').config();
const http = require('http');
const socket = require('./src/config/socket');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.set('layout', 'layout');
app.use(expressLayouts);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'src/public')));

// Routes
app.use('/api/tasks', require('./src/routes/tasks'));
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));

// View routes
app.get('/', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

app.get('/app', (req, res) => {
    res.render('tasks/index', { title: 'Task Manager' });
});

// Connect to database
connectDB();

// Set up socket.io to send notifications to the client
io.on('connection', (socket) => {
    console.log('User connected to notifications');

    socket.on('taskUpdated', (task) => {
        console.log(`Task updated: ${task.title}`);
        io.emit('notification', {
            message: `${task.title} has been updated.`,
            taskId: task._id,
            timestamp: new Date().toLocaleString()
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected from notifications');
    });
});

// Import the job scheduler
const { scheduleDueDateNotifications } = require('./src/jobs/notifications');

// Schedule jobs
scheduleDueDateNotifications();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
