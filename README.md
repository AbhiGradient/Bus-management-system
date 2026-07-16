# 🚌 Smart College Bus Management System

A simple full-stack college project built with **Node.js, Express, MySQL, and EJS**, styled with **Bootstrap 5**.

## Features

- **3 user roles**: Admin, Student, Driver — each with their own dashboard
- **Admin**: manage buses, manage students, assign buses/drivers, review transport requests, manage fee records
- **Student**: view assigned bus & driver info, submit transport requests, view fee status, edit profile
- **Driver**: view assigned bus and the list of students on it, edit profile
- Session-based authentication with hashed passwords (bcrypt)

## Tech Stack

- Express.js (routing)
- MySQL (via `mysql2`)
- EJS (server-rendered views)
- Bootstrap 5 + Bootstrap Icons (CDN)
- express-session for login sessions
- method-override for PUT/DELETE from HTML forms

## Setup Instructions

### 1. Install dependencies
```bash
cd college-bus-management
npm install
```

### 2. Create the MySQL database
Open MySQL and run the schema + seed file:
```bash
mysql -u root -p < database/bus_management.sql
```
This creates the `bus_management` database with tables and demo data.

### 3. Configure environment variables
Edit `.env` and set your MySQL credentials:
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=bus_management
DB_PORT=3306
SESSION_SECRET=collegeBusSecretKey123
```

### 4. Run the app
```bash
npm start
```
Or, for auto-restart during development:
```bash
npm run dev
```

Visit **http://localhost:3000** in your browser.

## Demo Login Accounts

| Role    | Email                  | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@college.edu       | admin123    |
| Driver  | driver1@college.edu     | driver123   |
| Driver  | driver2@college.edu     | driver123   |
| Student | student1@college.edu    | student123  |
| Student | student2@college.edu    | student123  |
| Student | student3@college.edu    | student123  |

## Project Structure

```
college-bus-management/
├── server.js              # App entry point
├── package.json
├── .env                    # Environment config
├── config/
│   └── db.js               # MySQL connection pool
├── routes/
│   ├── auth.js              # Login / logout
│   ├── admin.js              # Buses, students, assign-bus, requests, fees, profile
│   ├── student.js           # Dashboard, requests, fees, profile
│   └── driver.js             # Dashboard, profile
├── views/                   # EJS templates (Bootstrap 5 UI)
├── public/
│   ├── css/style.css
│   ├── js/script.js
│   └── images/
└── database/
    └── bus_management.sql   # Schema + seed data
```

## Notes

- Passwords are hashed with `bcryptjs` before being stored.
- New students are created only by the Admin (via **Manage Students**); this also creates their login account.
- The default password assigned to a newly created student is `student123` unless a custom password is entered in the Add Student form.
