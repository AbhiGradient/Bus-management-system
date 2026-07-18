# CLAUDE.md

# College Bus Management System

## Project Overview

This project is a full-stack College Bus Management System developed using Node.js, Express.js, EJS, MySQL, HTML, CSS and JavaScript.

The goal is to build a professional, production-like web application that demonstrates modern web development concepts while remaining suitable for a college major project.

The project must always remain visually consistent, modular, responsive and easy to extend.

------------------------------------------------------------

# Technology Stack

Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)
- EJS Templates

Backend
- Node.js
- Express.js

Database
- MySQL

Package Manager
- npm

------------------------------------------------------------

# Current Folder Structure

config/
database/
public/
routes/
views/

server.js
package.json
package-lock.json
.env

Do NOT change this structure unless specifically instructed.

Do NOT create subfolders inside the views folder.

All EJS pages remain directly inside the views folder.

------------------------------------------------------------

# Existing Views

admin-dashboard.ejs
assign-bus.ejs
buses.ejs
driver-dashboard.ejs
fees.ejs
login.ejs
profile.ejs
requests.ejs
student-dashboard.ejs
students.ejs

These pages already exist.

Future pages should match their coding style.

------------------------------------------------------------

# Existing Routes

admin.js
auth.js
driver.js
student.js

Future route files may be added whenever required.

------------------------------------------------------------

# Existing Public Folder

public/

css/
images/
js/

There is already one large CSS file that controls the complete website.

DO NOT split CSS into multiple files.

Instead continue adding new sections inside the existing CSS.

Example

/* Admin */

/* Driver */

/* Tracking */

/* QR */

/* Reports */

------------------------------------------------------------

# UI Design Rules

The website should have a premium modern appearance.

Use:

- Glassmorphism
- Claymorphism
- Soft shadows
- Rounded corners
- Animated hover effects
- Smooth transitions
- Professional gradients
- Responsive layouts

Avoid:

Bootstrap

Tailwind

Material UI

Bulma

Foundation

Use only vanilla HTML, CSS and JavaScript.

------------------------------------------------------------

------------------------------------------------------------

# Design Principles

Every page should

✔ Look modern

✔ Be responsive

✔ Use consistent spacing

✔ Have proper typography

✔ Use reusable card layouts

✔ Maintain same navbar

✔ Maintain same footer

✔ Maintain same dashboard styling

------------------------------------------------------------

# Coding Style

Always generate

Readable code

Proper indentation

Comments

Meaningful variable names

Consistent formatting

Avoid duplicate code whenever possible.

------------------------------------------------------------

# Backend Rules

Always use

Express Router

Async/Await

Parameterized MySQL queries

Error handling

Proper redirects

Validation

Flash messages if necessary

Never hardcode passwords.

Never expose database credentials.

------------------------------------------------------------

# Authentication

Three roles exist

Admin

Student

Driver

Authentication should remain role-based.

------------------------------------------------------------

# Database

Use MySQL.

Tables should include

admins

students

drivers

buses

routes

payments

attendance

requests

notifications

tracking

seats

The database should remain normalized.

------------------------------------------------------------

# Current Features

Already available

Login

Admin Dashboard

Student Dashboard

Driver Dashboard

Bus Assignment

Student List

Bus List

Fees

Profile

Requests

------------------------------------------------------------

# Future Features

Authentication

Forgot Password

Reset Password

Password Encryption

Profile Management

Admin

Add Student

Edit Student

Delete Student

Student Details

Add Driver

Edit Driver

Delete Driver

Driver Details

Add Bus

Edit Bus

Delete Bus

Bus Details

Reports

Statistics

Notifications

Settings

Students

Attendance

Attendance History

Fee Status

Payment History

Seat Management

Bus Details

Route Map

Bus Change

Request Status

Driver

Driver Profile

Today's Route

Start Trip

End Trip

Student Attendance

Live Location

Emergency Alert

QR Attendance

QR Generation

QR Scanning

Attendance Report

GPS Tracking

Live Bus Tracking

Speed Monitoring

Route Optimization

Bus Monitoring

Payments

Online Payment

Receipt

Payment Success

Payment Failed

Reports

Attendance Report

Fee Report

Driver Report

Bus Report

Notification System

Search

Filters

Pagination

Dashboard Cards

Charts

Analytics

------------------------------------------------------------

# Pages To Be Added

forgot-password.ejs

reset-password.ejs

change-password.ejs

add-student.ejs

edit-student.ejs

student-details.ejs

add-driver.ejs

edit-driver.ejs

driver-details.ejs

add-bus.ejs

edit-bus.ejs

bus-details.ejs

attendance.ejs

attendance-history.ejs

fee-status.ejs

payment-history.ejs

seat-management.ejs

live-bus.ejs

route-map.ejs

request-status.ejs

notifications.ejs

driver-profile.ejs

today-route.ejs

trip-start.ejs

trip-end.ejs

live-location.ejs

driver-notifications.ejs

pay-fees.ejs

payment-success.ejs

payment-failed.ejs

receipt.ejs

qr-generator.ejs

qr-scanner.ejs

attendance-report.ejs

live-tracking.ejs

gps-monitor.ejs

route-optimization.ejs

request-details.ejs

approve-request.ejs

reports.ejs

attendance-report.ejs

fee-report.ejs

driver-report.ejs

bus-report.ejs

admin-settings.ejs

student-settings.ejs

driver-settings.ejs

404.ejs

500.ejs

------------------------------------------------------------

# Route Files To Add

attendance.js

payment.js

tracking.js

seat.js

request.js

notification.js

report.js

profile.js

qr.js

settings.js

routeManagement.js

------------------------------------------------------------

# JavaScript Files

attendance.js

tracking.js

payment.js

seat.js

qr.js

maps.js

charts.js

validation.js

------------------------------------------------------------

# Image Assets

default-avatar.png

college-logo.png

driver-placeholder.png

student-placeholder.png

bus-placeholder.png

qr-frame.png

------------------------------------------------------------

# Development Instructions

When generating any page:

1. Match the existing project style.
2. Reuse existing classes whenever possible.
3. Do not redesign previous pages.
4. Keep navigation consistent.
5. Keep footer unchanged.
6. Use the existing CSS.
7. Use semantic HTML.
8. Generate clean EJS.
9. Make every page responsive.
10. Connect forms to appropriate routes.
11. Include proper validation.
12. Write scalable code.

------------------------------------------------------------

# Long-Term Goal

The final project should appear as a complete commercial-grade College Bus Management System suitable for demonstration before college faculty, project evaluators and technical judges.

Every new page should feel like it belongs to the same application, with consistent UI, navigation, architecture and coding style.

Quality, maintainability and consistency are more important than simply increasing the number of pages.