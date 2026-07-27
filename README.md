# PolyLearn 🌍

A multi-language learning web app (Duolingo-style MVP) built using the MERN stack, but with **MySQL** instead of MongoDB (React + Express + Node.js + MySQL + Sequelize).

This project is structured as a clean academic MVP demo, pre-configured with environment settings and a database seeding script to get it running immediately.

---

## Tech Stack & Core Features

- **Frontend**: React (Vite), Axios, React Router v6, HSL-curated custom CSS (sidebar grid layout, progress bars, interactive question cards, results screen, glassmorphism cards).
- **Backend**: Node.js, Express (REST API).
- **Database**: MySQL, Sequelize (ORM for migrations, models, and relationships).
- **Authentication**: JWT stored client-side, bcrypt for secure password hashing.
- **Gamification**: Total XP metrics, daily streaks, 5 hearts/lives progression penalty, heart refills.

---

## Folder Structure

```text
/PolyLearn
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── components/         # ProtectedRoute guard
│   │   ├── pages/              # Auth, Dashboard, CourseSelector, Lesson, Results pages
│   │   ├── services/           # api.js client utilizing Axios and JWT interceptors
│   │   └── index.css           # Premium global stylesheet
├── server/                     # Node.js + Express Backend
│   ├── config/db.js            # Sequelize MySQL client
│   ├── controllers/            # Auth, Course, User dashboard and evaluation logic
│   ├── middleware/             # JWT authenticateToken check
│   ├── models/                 # Sequelize User, Stats, Progress, Unit, Lesson, Question models
│   ├── routes/                 # Express route entry points
│   └── seed/seed.js            # Database initializer & mock data seeder
├── .env.example                # Configuration template
├── package.json                # Concurrently runner root configuration
└── README.md                   # Setup documentation
```

---

## Setup & Running Instructions

### 1. Prerequisites

- **Node.js** (LTS or above)
- **MySQL Server** (running locally on port `3306` with `root` user and empty password, or custom credentials configured below).

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Ensure the MySQL database credentials (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`) match your local environment. The application will **automatically create** the database schema if it doesn't already exist.

### 3. Install Dependencies

Run the install command from the root folder to download all dependencies for the root, backend, and frontend workspaces:

```bash
npm run install-all
```

*(This triggers npm install in `/`, `/server`, and `/client` consecutively).*

### 4. Seed the Database

Populate languages (Spanish, French, Japanese), units, lessons, interactive questions, and demo student users:

```bash
npm run seed
```

### 5. Launch the Application

Start both the Express backend and React frontend concurrently:

```bash
npm run dev
```

- **React Frontend**: http://localhost:5173
- **Express Backend**: http://localhost:5000

---

## Academic Assessment Demo Accounts

Click the prefill buttons on the login screen or enter manually:

1. **Seeded Student Account** (Has 45 XP, 3-day streak, and some completed Spanish lessons):

   - **Email**: `student@polylearn.com`
   - **Password**: `password123`
2. **Fresh Demo Account** (XP: 0, streak: 0, hearts: 5, empty progress):

   - **Email**: `demo@polylearn.com`
   - **Password**: `demo123`
