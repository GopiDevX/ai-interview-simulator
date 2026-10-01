# 🚀 Quick Commands Guide — InterviewAI

### 📦 Option 1: Standard Local Development (Dual Terminal)

#### Terminal 1 — Backend Server
```powershell
cd "c:\Projects\AI Interview Platfrom\interviewai\server"
npm install
npm run dev
```

#### Terminal 2 — Frontend Client
```powershell
cd "c:\Projects\AI Interview Platfrom\interviewai\client"
npm install
npm run dev
```
> Open http://localhost:5173 in your browser.

---

### 🐳 Option 2: 1-Click Production Docker Deployment

Run the entire platform (MongoDB + Express Backend + Nginx React Frontend):
```powershell
cd "c:\Projects\AI Interview Platfrom\interviewai"
docker compose up --build
```
> Open http://localhost in your browser.

---

### 🧠 Option 3: Train Custom Machine Learning Model

Re-train the Scikit-Learn TF-IDF + Ridge Regression + Logistic Classifier pipeline on company datasets:
```powershell
cd "c:\Projects\AI Interview Platfrom\interviewai\server\ml"
.\train.bat
```

---

### 🐙 Option 4: Sync & Push to GitHub

Push your latest changes to `https://github.com/GopiDevX/ai-interview-simulator.git`:
```powershell
cd "c:\Projects\AI Interview Platfrom"
git add .
git commit -m "feat: production-ready ML transparency, PDF dossiers, sandbox execution, and dockerization"
git push origin main
```
