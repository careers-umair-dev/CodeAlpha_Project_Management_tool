# Ridgeline — Project Management Tool

A full-stack, Trello/Asana-style project management platform built with the MERN stack. Ridgeline enables teams to create and manage projects, collaborate with members, organize work through Kanban boards, assign and track tasks, and communicate through real-time task comments.

## Tech Stack

| Layer                   | Technology                     |
| ----------------------- | ------------------------------ |
| Frontend                | React 18 + Vite + Tailwind CSS |
| Backend                 | Node.js + Express.js           |
| Database                | MongoDB + Mongoose             |
| Authentication          | JWT + bcrypt                   |
| Real-Time Communication | Socket.IO                      |
| HTTP Client             | Axios                          |

## Features

* **Authentication** — User registration, login, JWT-protected routes, profile management, password changes, and account deletion with password confirmation and shared-work anonymization. Deletion removes memberships, assignments, owned notifications, and avatar; shared tasks/comments remain attributed to “Former member”, and project ownership must be transferred first.
* **Profile & Avatar** — Edit your name and professional title, upload or remove a profile photo, and manage your password. JPEG, PNG, and WebP images up to 2 MB are supported.
* **Project Management** — Create, update, and delete projects, manage deadlines, invite or remove members by email, and track project progress.
* **Kanban Board** — Organize tasks across To Do, In Progress, Review, and Completed columns with drag-and-drop status updates.
* **Task Management** — Create tasks with titles, descriptions, assignees, priorities, due dates, and creation dates. Overdue and upcoming tasks are visually highlighted.
* **Task Checklists** — Add up to 50 trackable checklist items to a task, monitor completion progress on the Kanban cards, and save checklist changes with task updates.
* **Task Dependencies** — Link tasks that must finish first, see blocked tasks on the Kanban board and in My Tasks, and prevent completion until all dependencies are complete. Dependencies are restricted to the same project, cycles are rejected, and deleting or reopening a task keeps dependent work consistent.
* **My Tasks & Calendar** — View your assigned tasks across projects, search by title, filter by status, priority, project, or due-date range, and plan deadlines in a month calendar.
* **Persistent Notifications** — Assignment, completion, comment, and project-invite notifications are saved to your account, synced live, marked read on demand, and clearable from the notification menu.
* **Comments & Collaboration** — Add task-specific comments with author and timestamp information, delete your own comments, and receive live updates through Socket.IO.
* **Dashboard** — View project and task statistics, completed and pending tasks, overdue tasks, and recent activity.
* **Responsive UI/UX** — Modern responsive interface with sidebar navigation, navbar, loading states, empty states, toast notifications, and confirmation dialogs.
* **Premium workspace navigation** — Use `Ctrl/Cmd + K` to search workspace pages, projects, and tasks, with keyboard navigation and a persistent light/dark theme toggle.

## Project Structure

```text
project-management-tool/

├── backend/        Express API, MongoDB models, and Socket.IO
└── frontend/       React + Vite + Tailwind CSS client
```

### Backend & Frontend Structure

```text
backend/

├── config/db.js               MongoDB connection
├── controllers/               Route handlers for auth, projects, tasks, comments
├── models/                    Mongoose schemas for User, Project, Task, Comment
├── routes/                    Express API routers
├── middleware/                JWT authentication and centralized error handling
├── socket/socket.js           Socket.IO authentication and room management
└── server.js                  Application entry point

frontend/src/

├── components/                Reusable UI components
├── pages/                     Route-level views
├── context/AuthContext.jsx    Authentication state management
├── services/                  Axios API and Socket.IO client services
└── App.jsx / main.jsx         Application routing and bootstrap
```

## Prerequisites

* Node.js 18+
* MongoDB — local installation or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Setup

### 1. Clone or Extract the Project

Install dependencies for both the backend and frontend:

```bash
cd project-management-tool/backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment Variables

Both applications include an `.env.example` file. Copy it to `.env` and configure the required values.

**Backend — `backend/.env`**

```env
MONGO_URI=mongodb://127.0.0.1:27017/pm-tool

JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d

PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

In development, CORS also allows HTTP origins on `localhost`, `127.0.0.1`, and `::1` at any port, so Vite can use its fallback port (such as `5174`). In production, only origins listed in `CLIENT_URL` are allowed.

**Frontend — `frontend/.env`**

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> **Security:** Never commit real `.env` files or expose sensitive credentials. Environment files are already excluded through `.gitignore`.

Profile photos are stored under `backend/uploads/avatars` and served by the API. This folder is ignored by Git. Production deployments must use persistent storage for this directory or replace the local storage implementation with an object-storage provider.

### 3. Run in Development

Start the backend and frontend in separate terminals.

**Terminal 1 — Backend**

```bash
cd backend
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

Open the frontend URL, create an account, and start managing your projects.

### 4. Build for Production

Build the frontend:

```bash
cd frontend
npm run build
```

The production build will be generated inside:

```text
frontend/dist
```

Start the backend:

```bash
cd ../backend
npm start
```

The frontend and backend can then be deployed using suitable hosting or a reverse proxy configuration.

## API Overview

All API endpoints use the `/api` prefix and return JSON responses. Protected endpoints require:

```text
Authorization: Bearer <token>
```

| Method         | Endpoint                        | Description                         |
| -------------- | ------------------------------- | ----------------------------------- |
| POST           | `/auth/register`                | Create a new account                |
| POST           | `/auth/login`                   | Authenticate and receive a JWT      |
| GET            | `/auth/me`                      | Get the current user profile        |
| PUT            | `/auth/me`                      | Update the current user profile     |
| POST           | `/auth/me/avatar`               | Upload or replace a profile photo (`multipart/form-data`, field: `avatar`) |
| DELETE         | `/auth/me/avatar`               | Remove the current profile photo    |
| PUT            | `/auth/me/password`             | Change account password             |
| DELETE         | `/auth/me/account`               | Delete the account after password and `DELETE` confirmation; blocks deletion while the user owns projects |
| GET            | `/auth/search?q=`               | Search users for project membership |
| GET            | `/projects`                     | Get the user's projects             |
| POST           | `/projects`                     | Create a new project                |
| GET/PUT/DELETE | `/projects/:id`                 | Read, update, or delete a project   |
| POST           | `/projects/:id/members`         | Add a project member by email       |
| DELETE         | `/projects/:id/members/:userId` | Remove a project member             |
| GET            | `/projects/dashboard/stats`     | Get aggregated dashboard statistics |
| GET            | `/tasks/project/:projectId`     | Get project tasks                   |
| GET            | `/tasks/mine`                   | Get assigned tasks; supports `q`, `status`, `priority`, `projectId`, `from`, and `to` filters |
| GET            | `/tasks/search?q=`              | Search task titles and descriptions across projects available to the current user |
| POST           | `/tasks`                        | Create a task; optionally provide `blockedBy` task IDs from the same project |
| GET/PUT/DELETE | `/tasks/:id`                    | Read, update, or delete a task; updates can change `blockedBy` dependencies |
| GET            | `/comments/task/:taskId`        | Get task comments                   |
| POST           | `/comments`                     | Add a comment                       |
| DELETE         | `/comments/:id`                 | Delete a comment                    |
| GET            | `/notifications`                | Get the latest 30 notifications and unread count |
| PATCH          | `/notifications/read`           | Mark all of the current user's notifications as read |
| DELETE         | `/notifications`                | Clear the current user's notifications |

## Real-Time Events

Ridgeline uses Socket.IO to provide real-time collaboration.

The client authenticates the socket connection using the user's JWT and joins a project-specific room while viewing a project board.

### Task Events

```text
task:created
task:updated
task:deleted
```

### Comment Events

```text
comment:created
comment:deleted
```

## Security & Access Control

* Passwords are securely hashed using **bcrypt** before being stored.
* Password hashes are never returned through the API.
* JWT authentication protects private application routes.
* Project, task, and comment operations verify that the requester is authorized as a project owner or member.
* Only project owners can update or delete projects and manage project members.
* Only comment authors can delete their own comments.
* Sensitive environment variables are excluded from version control.

---

                    Built with ❤️ by Umair Ansari
