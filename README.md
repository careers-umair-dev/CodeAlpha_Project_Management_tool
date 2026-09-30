# Ridgeline — Project Management Tool

A full-stack, Trello/Asana-style project management platform built with the MERN stack. Teams can create projects, invite members, organize work on a Kanban board, assign and track tasks, and discuss work in real time through task comments.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Real-time | Socket.IO |
| HTTP client | Axios |

## Features

- **Auth** — registration, login, JWT-protected routes (frontend + backend), profile editing, password change.
- **Projects** — create/edit/delete, deadlines, invite/remove members by email, per-project progress bar.
- **Kanban board** — To Do / In Progress / Review / Completed columns with drag-and-drop status changes.
- **Tasks** — title, description, assignee, priority, due date, created date; overdue/upcoming tasks highlighted.
- **Comments** — per-task comments with author + timestamp, delete your own comments, live updates via Socket.IO.
- **Dashboard** — totals for projects/tasks, completed vs pending, overdue tasks, recent activity.
- **UI/UX** — responsive layout, sidebar + navbar, loading/empty states, toast notifications, confirmation dialogs.

## Project structure

```
project-management-tool/
├── backend/    Express API, MongoDB models, Socket.IO
└── frontend/   React + Vite + Tailwind client
```

See inline comments in each folder for details; the layout matches the structure below.

```
backend/
├── config/db.js              MongoDB connection
├── controllers/               Route handlers (auth, project, task, comment)
├── models/                    Mongoose schemas (User, Project, Task, Comment)
├── routes/                    Express routers
├── middleware/                JWT auth guard + centralized error handler
├── socket/socket.js           Socket.IO auth + room join/leave
└── server.js                  App entry point

frontend/src/
├── components/                Reusable UI (Navbar, Sidebar, KanbanBoard, TaskModal, ...)
├── pages/                     Route-level views (Login, Dashboard, Projects, ProjectDetails, Profile)
├── context/AuthContext.jsx    Auth state, login/register/logout
├── services/                  api.js (Axios) and socket.js (Socket.IO client)
└── App.jsx / main.jsx         Routing and app bootstrap
```

## Prerequisites

- Node.js 18+
- A MongoDB instance — either a local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

## Setup

### 1. Clone / unzip and install dependencies

```bash
cd project-management-tool/backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment variables

Each app has an `.env.example` — copy it to `.env` and fill in real values.

**backend/.env**
```
MONGO_URI=mongodb://127.0.0.1:27017/pm-tool
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**frontend/.env**
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> Never commit real `.env` files — they're already excluded via `.gitignore`.

### 3. Run in development

In two terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open `http://localhost:5173`, register an account, and start creating projects.

### 4. Build for production

```bash
cd frontend
npm run build      # outputs static files to frontend/dist

cd ../backend
npm start           # serves the API (pair with any static host / reverse proxy for the built frontend)
```

## API overview

All endpoints are prefixed with `/api` and JSON-based. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Log in, receive a JWT |
| GET | `/auth/me` | Current user profile |
| PUT | `/auth/me` | Update profile |
| PUT | `/auth/me/password` | Change password |
| GET | `/auth/search?q=` | Search users (for adding members) |
| GET | `/projects` | List my projects |
| POST | `/projects` | Create a project |
| GET/PUT/DELETE | `/projects/:id` | Read / update / delete a project |
| POST | `/projects/:id/members` | Add a member by email |
| DELETE | `/projects/:id/members/:userId` | Remove a member |
| GET | `/projects/dashboard/stats` | Aggregated dashboard data |
| GET | `/tasks/project/:projectId` | List tasks for a project |
| POST | `/tasks` | Create a task |
| GET/PUT/DELETE | `/tasks/:id` | Read / update / delete a task |
| GET | `/comments/task/:taskId` | List comments for a task |
| POST | `/comments` | Add a comment |
| DELETE | `/comments/:id` | Delete a comment |

## Real-time events (Socket.IO)

The client authenticates the socket handshake with its JWT and joins a `project:<id>` room while a project board is open. The server emits:

- `task:created`, `task:updated`, `task:deleted`
- `comment:created`, `comment:deleted`

## Notes

- Passwords are hashed with bcrypt before storage; the hash is never returned by the API.
- All project/task/comment routes verify the requester is the project owner or a member before allowing access.
- Only a project's owner can edit/delete the project or manage its members; only a comment's author can delete that comment.
