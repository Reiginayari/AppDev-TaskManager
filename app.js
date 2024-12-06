const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const connectDB = require('./src/config/db');
require('dotenv').config();

const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});