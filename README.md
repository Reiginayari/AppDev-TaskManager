# AppDev Task Manager

AppDev Task Manager is a web application designed to help users manage tasks efficiently. It allows users to create, update, and delete tasks, as well as manage co-taskers.

## Members
- Reigina  Mascariñas
- Peter Abangan

## Features

- User authentication (login and registration)
- Task creation, update, and deletion
- Assign tasks to co-taskers
- Task status management
- Responsive UI with EJS templates

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- EJS for templating
- CSS for styling
- Node Schedule

## Getting Started

### Prerequisites

- Node.js and npm installed on your machine
- MongoDB installed and running

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/appdev-taskmanager.git
   cd AppDev-TaskManager
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add the following environment variables:

   ```plaintext
   JWT_SECRET=your_secret_key_here
   MONGODB_URI=mongodb://localhost/taskmanager
   PORT=3000
   ```

4. Start the application:

   ```bash
   npm run dev
   ```

   The application will be running at `http://localhost:3000`.

## Usage

- Navigate to `http://localhost:3000` to access the login page.
- Register a new account or log in with existing credentials.
- Once logged in, you can create, update, and delete tasks.
- Assign tasks to co-taskers and manage their statuses.

## Code Structure

- `app.js`: Main application file that sets up the server and routes.
- `src/config/db.js`: Database connection setup.
- `src/middleware/auth.js`: JWT authentication middleware.
- `src/controllers`: Contains the logic for handling requests.
- `src/models`: Mongoose models for User and Task.
- `src/routes`: Defines the API endpoints.
- `src/views`: EJS templates for rendering the UI.
- `src/public`: Static files including CSS and JavaScript.
