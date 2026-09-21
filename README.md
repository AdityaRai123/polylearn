# PolyLearn 🌍

A multi-language learning web app (Duolingo-style) with teacher-set tests. React (Vite) frontend, Express + Sequelize API, MySQL / Postgres / SQLite database.

---

## Features

**Students**
- Bite-sized lessons (Spanish, French, Japanese) with instant feedback, XP, daily streaks, hearts and a leaderboard.
- **Tests** page: take tests published by teachers. Answers are graded on the server and the score (plus a question-by-question review) appears immediately after submitting. One attempt per test; in-progress answers survive a page refresh.

**Teachers**
- Create tests with **multiple-choice** (2–6 options) and **short-answer** questions (several accepted spellings; matching ignores case and extra spaces), with points per question.
- Save as draft or publish. Students only see published tests.
- See every submission with average/high/low scores, open any student's answers, and **allow a retake** by resetting a submission.

**Security**
- Correct answers are never sent to the browser before an answer is submitted — for lessons or tests.
- Role checks happen on the server (`requireRole`), not just in the UI.
- Teacher sign-up requires an access code (`TEACHER_INVITE_CODE`).

---

## Folder Structure

```text
/PolyLearn
├── client/                       # React frontend (Vite)
│   └── src/
│       ├── components/           # AppShell (navigation), ProtectedRoute, shared UI, AnswerReview
│       ├── context/AuthContext   # Signed-in user + role
│       ├── pages/                # Auth, Dashboard, Courses, Lesson, Results, Tests, TakeTest, TestResult
│       │   └── teacher/          # TeacherDashboard, TestEditor, TestSubmissions
│       ├── services/api.js       # Axios client (JWT interceptor)
│       └── index.css             # Design system (light + dark mode, responsive)
├── server/                       # Express API
│   ├── config/                   # env, database connection, schema bootstrap
│   ├── controllers/              # auth, course, lesson, user, test (student), teacher
│   ├── middleware/               # authenticateToken, requireRole
│   ├── models/                   # User, Stats, Progress, Language, Unit, Lesson, Question, Test, TestQuestion, TestAttempt
│   ├── routes/
│   ├── scripts/makeTeacher.js    # Promote an existing account to teacher
│   ├── seed/seed.js              # Demo content
│   └── utils/                    # HTTP errors, answer grading
└── render.yaml                   # Render blueprint for the API
```

---

## Running locally

1. **Prerequisites:** Node.js 18+, and MySQL on port 3306 (or set `DB_DIALECT=sqlite` in `.env` to skip MySQL entirely).
2. `cp .env.example .env` and adjust the database settings. Set `TEACHER_INVITE_CODE` if you want to test teacher sign-up.
3. `npm run install-all`
4. `npm run seed` — **resets the database** and loads demo lessons, users and a sample test.
5. `npm run dev` — frontend on http://localhost:5173, API on http://localhost:5000.

Existing databases are upgraded automatically on start (new tables are created and the `users.role` column is added).

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Student (progress seeded) | `student@polylearn.com` | `password123` |
| Student (fresh) | `demo@polylearn.com` | `demo123` |
| Teacher | `teacher@polylearn.com` | `teacher123` |

The login page has buttons that fill these in. **Change or remove the demo teacher on a public deployment** — anyone who reads this README can sign in with it.

### Making teacher accounts

- **Sign-up with a code:** set `TEACHER_INVITE_CODE` on the server and share it with teachers; they choose "Teacher" on the sign-up form.
- **Promote an existing user:** `npm run make-teacher --prefix server -- someone@example.com` (use `... someone@example.com student` to undo).

---

## Deployment

### Backend on Render

Use the blueprint (`render.yaml`) or create a Web Service with root directory `server`, build `npm install`, start `npm start`. Environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | long random string (the blueprint generates one) |
| `CLIENT_URL` | your frontend URL, e.g. `https://polylearn.vercel.app` (comma-separate several) |
| `TEACHER_INVITE_CODE` | code teachers enter at sign-up |
| `DATABASE_URL` + `DB_SSL=true` | **recommended** — a hosted Postgres or MySQL database |

> ⚠️ Without `DATABASE_URL` the API uses SQLite on Render's disk, which is **wiped on every deploy and restart** (free instances restart after ~15 minutes idle). Tests created by teachers and students' scores would be lost. A free Postgres database from [Neon](https://neon.tech) or Render works — paste its connection string into `DATABASE_URL`.

### Frontend on Vercel

Import the repo, set **Root Directory** to `client`, framework preset **Vite**, and add `VITE_API_URL=https://<your-render-service>.onrender.com`. `client/vercel.json` rewrites all routes to `index.html` so refreshing pages like `/tests` works. (Netlify config is also included.)

---

## API overview

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` | anyone / signed in | Accounts (`role`: `student` or `teacher`) |
| `GET /api/user/dashboard`, `POST /api/user/refill-hearts` | student | Stats, progress, leaderboard |
| `GET /api/lessons/:id`, `POST /api/lessons/:id/check`, `POST /api/lessons/:id/submit` | student | Lessons |
| `GET /api/tests`, `GET /api/tests/:id`, `POST /api/tests/:id/submit`, `GET /api/tests/:id/result` | student | Take tests and see scores |
| `GET/POST /api/teacher/tests`, `GET/PUT/DELETE /api/teacher/tests/:id`, `PATCH /api/teacher/tests/:id/publish` | teacher | Manage tests |
| `GET /api/teacher/tests/:id/attempts[/:attemptId]`, `DELETE …/attempts/:attemptId` | teacher | Results, answer review, allow retake |
