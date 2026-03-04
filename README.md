# 🎯 MCQ Master: Advanced Quiz Engine

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

A premium, full-stack MCQ application designed for Information Retrieval Techniques. Features a sleek **Glassmorphic UI**, real-time authentication, and a dynamic quiz management system.

---

## ✨ Key Features

- **🚀 Dynamic Quiz Engine**: Upload CSV files to instantly generate interactive quizzes with timers and scoring.
- **🛡️ Secure Authentication**: Powered by **Supabase** for robust user management and profile protection.
- **📁 Module Vault**: A sophisticated management system to organize, rename, and generate CSV-ready prompts for LLMs.
- **📊 Interactive Leaderboard**: Track performance with "Power Scores" based on accuracy and experience.
- **🎨 Premium UX/UI**:
  - Fluid **Framer Motion** animations.
  - Custom interactive background and cursor.
  - Fully responsive, dark-themed **Glassmorphism** design.
- **📈 Real-time Results**: Instant feedback after tests with historical data persistence.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS 4.0 (Modern Utility-First)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router 7

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Parsing**: CSV-Parser
- **Storage**: Local JSON & Multipart File Uploads (Multer)

### **Cloud / DevOps**
- **Auth/Database**: Supabase
- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel

---

## 📂 Project Structure

```text
web-mcq/
├── client/              # React frontend (Vite)
│   ├── src/components/  # Reusable UI components
│   ├── src/pages/       # Page-level components
│   └── src/assets/      # Stylings and media
├── server/              # Express API
│   ├── index.js         # Core server logic
│   └── results.json     # Local database for results
├── quizzes/             # Directory for CSV quiz modules
└── README.md            # You are here!
```

---

## 🚀 Deployment Guide

### **1. Backend (Render)**
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && node index.js`
- **Root Directory**: (Leave blank)
- **Env Vars**:
  - `NODE_ENV`: `production`

### **2. Frontend (Vercel)**
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Env Vars**:
  - `VITE_API_URL`: Your Render backend URL
  - `VITE_SUPABASE_URL`: Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY`: Your Supabase public key

---

## 🛠️ Local Development

1. **Clone the repo**:
   ```bash
   git clone https://github.com/masked-shinobi/MCQ_test_Maker_website.git
   ```

2. **Backend**:
   ```bash
   cd server
   npm install
   node index.js
   ```

3. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 📄 CSV Format Requirement
To upload a new quiz, ensure your CSV follows this header format:
`Question, OptionA, OptionB, OptionC, OptionD, Answer`

---

## 👤 Author
**Masked-Shinobi** - *Engineering Student*  
Information Retrieval Techniques Project

---
