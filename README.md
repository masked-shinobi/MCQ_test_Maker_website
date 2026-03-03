# MCQ Test Engine - Web App

A modern, production-ready MCQ web application for Information Retrieval Techniques.

## Features
- **Frontend**: React (Vite), TailwindCSS, Framer Motion
- **Backend**: Node.js, Express, CSV-to-JSON dynamic parsing
- **UI/UX**: Dark mode, Glassmorphism, Custom animated cursor, Smooth transitions
- **Performance**: Optimized rendering and lazy animations

## Project Structure
```
web-mcq/
├── client/          # React frontend
├── server/          # Node.js Express backend
└── ir_mcq.csv       # Source question data
```

## Setup Instructions

### 1. Backend Setup
1. Open a terminal in `web-mcq/server`
2. Run `npm install`
3. Run `node index.js` (Server starts on http://localhost:5000)

### 2. Frontend Setup
1. Open a terminal in `web-mcq/client`
2. Run `npm install`
3. Run `npm run dev` (App starts on http://localhost:5173)

## CSV Data Format
The application reads questions from `ir_mcq.csv` in the root directory.
Format: `question, optionA, optionB, optionC, optionD, answer`

## Dependencies
- **Frontend**: `framer-motion`, `lucide-react`, `react-router-dom`, `axios`, `tailwindcss`
- **Backend**: `express`, `csv-parser`, `cors`
