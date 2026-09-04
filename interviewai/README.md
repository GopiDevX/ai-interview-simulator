# InterviewAI 🎤

> An AI-powered mock interview platform — practice with personalized, realistic interviews and get detailed performance feedback.

## Screenshots

| Landing | Interview Chat | Coding Round | Report |
|---------|---------------|--------------|--------|
| Hero + Feature grid | Live streaming chat | Monaco Editor | Radar chart + scores |

## Features

- 🧠 **AI Interviewer** — Realistic mock interview conducted by "Alex" (simulated AI responses)
- 💬 **Real-Time Streaming Chat** — Word-by-word streaming responses via Socket.IO
- 📄 **Resume Upload** — Upload your PDF resume for personalized question generation
- 🎯 **Role & Company Targeting** — Tailored questions for specific roles and companies
- 💻 **Coding Round** — Monaco Editor with language support (JS, Python, Java, C++)
- 📊 **Performance Report** — Detailed scorecard with radar chart, strengths, and improvement tips
- 🔐 **JWT Authentication** — Secure register/login with access + refresh tokens
- 📱 **Responsive Design** — Works on mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animation | Framer Motion |
| Charts | Recharts |
| Code Editor | Monaco Editor |
| Backend | Node.js + Express.js |
| Database | MongoDB (sessions) |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.IO |
| File Uploads | Multer (local storage) |

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup & Running

### 1. Clone the repo
```bash
git clone <repo-url>
cd interviewai
```

### 2. Install server dependencies
```bash
cd server
npm install
```

### 3. Install client dependencies
```bash
cd ../client
npm install
```

### 4. Configure environment

**server/.env** (already configured for local development):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interviewai
JWT_SECRET=interviewai_jwt_secret_mvp_2024
JWT_REFRESH_SECRET=interviewai_refresh_secret_mvp_2024
CLIENT_URL=http://localhost:5173
```

**client/.env** (already configured):
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 5. Start the servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open `http://localhost:5173`

## Folder Structure

```
interviewai/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios API clients
│       ├── components/      # UI + Interview + Report components
│       ├── context/         # Auth + Interview context
│       ├── hooks/           # useSocket
│       ├── pages/           # 8 pages
│       └── utils/           # Helper functions
└── server/                  # Express backend
    └── src/
        ├── config/          # DB connection
        ├── controllers/     # Auth + Interview controllers
        ├── middleware/       # JWT + Upload + Rate limiter
        ├── models/          # MongoDB schemas
        ├── routes/          # API routes
        ├── services/        # Mock AI service
        └── socket/          # Socket.IO handlers
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get current user |
| POST | /api/interview/start | Start interview session |
| POST | /api/interview/message | Send message, get AI response |
| POST | /api/interview/evaluate-answer | Score a candidate answer |
| POST | /api/interview/evaluate-code | Score code submission |
| POST | /api/interview/report/generate | Generate performance report |
| GET | /api/interview/user/sessions | List user's sessions |

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT — see [LICENSE](LICENSE)
