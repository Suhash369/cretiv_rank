# CretivRank — Production-Grade Secure Recruitment Assessment Platform

A complete, production-ready **secure online recruitment assessment platform** designed for organizations to conduct professional hiring assessments.

---

## 🌟 Key Architecture & Non-Negotiable Product Principles

1. **ADMIN OWNS ALL QUESTIONS**: Zero AI auto-generation of questions. Every question is uploaded via CSV/Excel or manually created by authorized administrators.
2. **NO NEGATIVE MARKING**: Scoring model is strictly `Correct = assigned marks`, `Incorrect = 0`, `Unanswered = 0`. No negative scoring configuration exists anywhere in DB, backend, or candidate interfaces.
3. **HIDDEN DIFFICULTY**: Question internal difficulty (`Easy`, `Medium`, `Hard`, `Very Hard`, `Expert`) is strictly for internal recruiter organization and analytics. It is NEVER exposed to candidate frontend or APIs.
4. **LAYERED SECURITY & EVIDENCE MODEL**: Transparent proctoring capturing webcam face detection signals, full-screen lock enforcement, tab switch/window blur detection, clipboard restriction, server-authoritative countdown timer, and candidate verification interviews.
5. **IMMUTABLE QUESTION & ASSESSMENT VERSIONING**: Published assessments freeze question versions (`questionId`, `questionVersion`) to guarantee audit integrity.
6. **POST-ASSESSMENT VERIFICATION INTERVIEW**: Built-in post-exam verbal defense workflow where interviewers pick 3–5 questions from the candidate's actual attempt, score technical/communication parameters, and submit final recommendations (`STRONG HIRE`, `HIRE`, `BORDERLINE`, `REJECT`).

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, XLSX
- **Backend**: Node.js, Express.js, TypeScript, REST API
- **Database**: MongoDB & Mongoose (with `mongodb-memory-server` out-of-the-box fallback for zero-config local execution)
- **Security**: JWT Auth, Cryptographic Invitation Tokens, bCrypt Password Hashing, RBAC

---

## 🛠️ Quick Start Guide

### 1. Installation

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 2. Running Local Development Server

```bash
# Terminal 1: Start Backend API (runs auto-seed out of the box on port 5000)
cd server
npm run dev

# Terminal 2: Start Frontend Application (runs on port 5173)
cd client
npm run dev
```

---

## 🔑 Demo Access Credentials (Auto-Seeded)

- **Recruiter Admin**: `admin@example.com` / `password123`
- **Interviewer**: `interviewer@example.com` / `password123`
- **Candidate Sample Assessment Link**: `http://localhost:5173/candidate/invite/demo-candidate-token-2026`

---

## 📋 Comprehensive Workflow Overview

```text
ADMIN LOGIN
   ↓
CREATE / BULK UPLOAD QUESTIONS (CSV/XLSX Dry-Run Validation)
   ↓
QUESTION BANK & IMMUTABLE VERSIONING
   ↓
BUILD & PUBLISH ASSESSMENT (Question Pool Validation)
   ↓
INVITE CANDIDATES (Cryptographic Single-Use Tokens)
   ↓
CANDIDATE ENVIRONMENT & SYSTEM CHECKS (Camera, Mic, Latency, Fullscreen)
   ↓
PRIVACY CONSENT & WEBCAM IDENTITY SNAPSHOT
   ↓
SECURE ASSESSMENT ROOM (Server Countdown Timer, Background Autosave)
   ↓
PROCTORING SIGNAL LOGGING (Tab Switch, Focus Loss, Fullscreen Exits)
   ↓
AUTOMATIC SCORING (Zero Negative Marking)
   ↓
POST-ASSESSMENT VERIFICATION INTERVIEW (3-5 Question Verbal Defense)
   ↓
FINAL INTERVIEWER DECISION (STRONG HIRE / HIRE / BORDERLINE / REJECT)
```

---

## 🔒 Security & Privacy Features

- **Strict API Separation**: Candidate endpoints have zero access to admin routes or internal question metadata (difficulty, answer keys, explanations).
- **Audit Logs**: All sensitive administrative actions and candidate attempts generate immutable audit entries.
- **Server Timer Authority**: Remaining exam time is strictly controlled server-side; client clock manipulations have zero effect.
- **Data Retention**: Configurable organization retention policies.
