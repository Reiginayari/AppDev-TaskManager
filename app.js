const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/taskmanager', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Routes
const taskRoutes = require('./src/routes/tasks');
app.use('/api/tasks', taskRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});