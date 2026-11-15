# PlacePrep AI: AI-Based Placement Preparation & Management Portal

A MERN-stack web app. Students prepare for campus placements (resume analysis, mock interviews, aptitude tests, coding practice, AI roadmap, company matching). Placement officers manage companies, drives, applications and reports.

```
placement-portal/
├── backend/            Node + Express + MongoDB (Mongoose)
│   ├── server.js
│   ├── config/db.js
│   ├── middleware/     auth (JWT + roles + error handling), upload (PDF validation)
│   ├── models/         12 Mongoose schemas
│   ├── controllers/    business logic per module
│   ├── routes/         auth, student, admin
│   ├── services/ai.js  AI provider call (Anthropic Messages API)
│   ├── utils/          stats (progress maths), match (eligibility/match %), role skills
│   └── seed/seed.js    sample data
└── frontend/           React + Vite + Tailwind + React Router + Recharts
    └── src/
        ├── pages/      Landing, Auth, student/*, admin/*
        └── components/ Layout (sidebar), ui (cards, modal, hooks)
```

## 1. Prerequisites

- **Node.js 18 or newer** (`node -v`)
- **MongoDB**: either local [MongoDB Community](https://www.mongodb.com/try/download/community) running on port 27017, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (use its connection string)
- **VS Code** (optional but recommended)
- An **Anthropic API key** for the AI features (https://console.anthropic.com). The app runs without it; AI features show a clear error until you add one.

## 2. Run it locally in VS Code

Open the `placement-portal` folder in VS Code (File → Open Folder), then open **two terminals** (Terminal → New Terminal, then the `+` / split icon).

**Terminal 1: backend**

```bash
cd backend
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Edit `backend/.env`:

| Variable | Meaning |
|---|---|
| `MONGO_URI` | `mongodb://127.0.0.1:27017/placement_portal` (local) or your Atlas string |
| `JWT_SECRET` | any long random string |
| `ANTHROPIC_API_KEY` | your API key (enables all AI features) |
| `AI_MODEL` | defaults to `claude-sonnet-5-5`; change if your account uses another model |
| `CLIENT_URL` | `http://localhost:5173` |

Then load sample data and start the API:

```bash
npm run seed
npm run dev
```

You should see `MongoDB connected` and `API running on http://localhost:5000`.

**Terminal 2: frontend**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` calls to the backend on port 5000, so no CORS setup is needed.

## 3. Demo logins (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Placement Officer | admin@college.edu | Admin@1234 |
| Student | aarav@college.edu (also priya, rohan, sneha, kabir) | Student@1234 |

Re-running `npm run seed` **wipes and recreates** all data.

## 4. What is real AI and what is calculated

Nothing is faked. If the AI key is missing or the call fails, you see an error instead of made-up output.

| Feature | How it works |
|---|---|
| Resume score | **Calculated** by a fixed rubric (contact 10, sections 20, role-skill match 30, quantified results 15, action verbs 10, length 15). The per-rule breakdown is shown to the student. |
| Resume skills, ATS tips, role improvements | **AI** (reads the extracted PDF text) |
| Interview questions + answer scoring/feedback | **AI** |
| Learning roadmap | **AI**, fed with the student's real coding, aptitude, interview and resume data |
| Aptitude study advice | **AI** (optional button), based on real test results |
| Company match % | **Calculated**: skills 50 + CGPA 20 + branch 15 + backlogs 15. AI can optionally write explanations for the top 3 |
| Dashboard progress, analytics, weak topics, recommended activities | **Calculated** from stored data (preparation = coding 30% + aptitude 30% + interview 20% + resume 20%) |

## 5. Features by module

Auth (register, student login, officer login, forgot/reset password, change password, profile) · Student dashboard · Resume analyzer (PDF only, 5 MB, text-based PDFs) · Mock interview · Aptitude (practice, timed quizzes, mock test, auto-scoring, topic analytics) · Coding practice · Roadmap with task tracking · Drives with eligibility check and apply/withdraw · Company match · Student analytics · Admin: overview analytics, students (edit/delete), companies CRUD, drives CRUD, eligible students per drive, application status management, coding question CRUD, placement report with CSV download.

## 6. Known limitations (please read)

- **Not yet run end-to-end.** The code was written in an environment without network access, so `npm install` was not possible. All files pass syntax/bundle checks, but expect to fix small issues on first run. Tell me the error and I'll fix it.
- **Coding practice does not execute code.** Students solve problems on the linked site (LeetCode links in the seed data), then mark them solved/attempted and optionally save their solution and notes. A real judge needs a sandboxed code-runner service.
- **Aptitude tests have no admin UI.** The API exists (`/api/admin/aptitude`, full CRUD); the seed adds four tests. Admin screens for it can be added.
- **Forgot password sends no email.** In development the reset link is shown on screen and printed in the backend console. For production, add a mailer in `auth.controller.js` and remove the `devResetLink` response.
- **Passwords use `bcryptjs`** (same algorithm as `bcrypt`, pure JavaScript, installs without native build tools on Windows).
- **Scanned/image-only PDFs** are rejected because there is no OCR.
- Officer accounts cannot self-register; create more by inserting a user with `role: 'admin'` (see `seed.js`).

## 7. API overview

`/api/auth/*` register, login, admin/login, forgot-password, reset-password/:token, me, password
`/api/student/*` profile, dashboard, analytics, resume, interview, aptitude, coding, roadmap, drives, applications, recommendations/companies
`/api/admin/*` students, companies, drives (+ `/:id/eligible`), applications, coding, aptitude, analytics, report (`?format=csv`)

All routes except `/api/auth/*` (public ones) require `Authorization: Bearer <JWT>`; student and admin routes are role-protected.

## 8. Troubleshooting

- `MongoDB connection failed`: start MongoDB (or check the Atlas string and IP allow-list).
- `JWT_SECRET is missing`: you did not create `backend/.env`.
- AI errors (503/502): check `ANTHROPIC_API_KEY` and `AI_MODEL`, then restart the backend.
- Port in use: change `PORT` in `backend/.env` and the proxy target in `frontend/vite.config.js`.
