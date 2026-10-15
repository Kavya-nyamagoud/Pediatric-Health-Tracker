#!/usr/bin/env node

/**
 * QUICK START SUMMARY
 * Pediatric Health Tracker - How to Run
 */

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║           🏥 PEDIATRIC HEALTH TRACKER - QUICK START GUIDE 🏥              ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝


📋 PREREQUISITES
═══════════════════════════════════════════════════════════════════════════════

Required Software:
  • Node.js 20+ (https://nodejs.org/)
  • PostgreSQL 14+ (https://www.postgresql.org/)

Verify Installation:
  node --version      # Should show v20.0.0+
  npm --version       # Should show 10.0.0+
  psql --version      # Should show PostgreSQL 14+


🚀 QUICK START (3 STEPS)
═══════════════════════════════════════════════════════════════════════════════

STEP 1: Setup Database
──────────────────────────────────────────────────────────────────────────────
  1. Open PowerShell
  2. Connect to PostgreSQL:
     psql -U postgres
  
  3. Create database:
     CREATE DATABASE pediatric_health;
     \\q


STEP 2: Start Backend Server
──────────────────────────────────────────────────────────────────────────────
  1. Open PowerShell
  2. Navigate to backend:
     cd "c:\\Users\\ADMIN\\New folder (2)\\PediatricHealthTracker\\backend"
  
  3. Install dependencies:
     npm install
  
  4. Create .env file with your database credentials
  
  5. Start server:
     npm start
  
  ✓ Backend runs on http://localhost:5000/api


STEP 3: Start Frontend Dev Server
──────────────────────────────────────────────────────────────────────────────
  1. Open ANOTHER PowerShell window
  2. Navigate to frontend:
     cd "c:\\Users\\ADMIN\\New folder (2)\\PediatricHealthTracker\\frontend"
  
  3. Install dependencies:
     npm install
  
  4. Start frontend:
     npm run dev
  
  ✓ Frontend runs on http://localhost:5173


📱 OPEN APPLICATION
═══════════════════════════════════════════════════════════════════════════════

  Open browser: http://localhost:5173
  
  1. Click "Register"
  2. Enter: Name, Email, Password
  3. Click "Register"
  4. You're logged in!


🎯 FIRST TIME USAGE
═══════════════════════════════════════════════════════════════════════════════

  ✅ Create Account
     └─ Register with email/password

  ✅ Add a Child
     └─ Go to "Children" → Click "➕ Add Child"
     └─ Fill: First Name, Last Name, DOB, Gender

  ✅ Add Health Records
     └─ Click child name → "➕ Add Record"
     └─ Choose: Growth, Vaccination, Visit, or Medication

  ✅ View Analytics
     └─ Go to "Analytics"
     └─ Select child from dropdown
     └─ See AI growth predictions + charts

  ✅ Check Vaccination Status
     └─ Open child detail page
     └─ Scroll to "💉 Vaccination Status"
     └─ View due/overdue vaccines

  ✅ Export Reports
     └─ On child detail page
     └─ Click "📄 Quick Summary" or "📋 Full Report"
     └─ PDF downloads automatically


📊 FEATURES AVAILABLE
═══════════════════════════════════════════════════════════════════════════════

  Core Features:
    ✓ User authentication (register, login, JWT)
    ✓ Child profile management
    ✓ Health records (growth, vaccination, visits)
    ✓ Dashboard with statistics
    ✓ Responsive design

  Advanced Features:
    ✓ AI Growth Prediction (ML model)
    ✓ Vaccination Reminders (WHO/CDC schedule)
    ✓ Multi-user Roles (Parent, Doctor, Admin)
    ✓ PDF Reports (full report + quick summary)


🔐 USER ROLES
═══════════════════════════════════════════════════════════════════════════════

  Parent (Default)
    • Manage own children
    • View own children's data
    • Add health records

  Doctor (For Testing)
    • View all children
    • Add records to any child
    • See all vaccination schedules

  Admin (For Testing)
    • Full system access


⚙️ .ENV CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════

Create file: backend/.env

  # Database
  DB_HOST=localhost
  DB_USER=postgres
  DB_PASSWORD=your_password
  DB_NAME=pediatric_health
  DB_PORT=5432

  # Server
  PORT=5000
  NODE_ENV=development

  # JWT
  JWT_SECRET=your_super_secret_key_12345
  JWT_REFRESH_SECRET=your_super_secret_refresh_key
  JWT_EXPIRE=15m

  # CORS
  CORS_ORIGIN=http://localhost:5173


🛠️ TERMINAL COMMANDS REFERENCE
═══════════════════════════════════════════════════════════════════════════════

Backend Setup:
  cd backend
  npm install
  npm start

Frontend Setup:
  cd frontend
  npm install
  npm run dev

Frontend Build:
  npm run build

Testing:
  npm run test

Backend Tests:
  node test-api.js
  node test-vaccination-service.js


📂 PROJECT STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

  PediatricHealthTracker/
  ├── backend/
  │   ├── controllers/      # API logic
  │   ├── models/          # Database models
  │   ├── routes/          # API endpoints
  │   ├── services/        # PDF, AI, Vaccination logic
  │   ├── middleware/      # Auth, RBAC
  │   ├── server.js
  │   └── package.json
  │
  ├── frontend/
  │   ├── src/
  │   │   ├── pages/       # Dashboard, Analytics, etc.
  │   │   ├── components/  # Reusable components
  │   │   ├── App.jsx
  │   │   └── main.jsx
  │   └── package.json
  │
  └── SETUP_AND_RUN_GUIDE.md


❌ TROUBLESHOOTING
═══════════════════════════════════════════════════════════════════════════════

Backend won't start?
  → Check PostgreSQL is running
  → Verify .env file exists with correct credentials
  → Run: npm install (reinstall dependencies)

Frontend can't connect to backend?
  → Make sure backend is running on port 5000
  → Check browser console for errors
  → Try: curl http://localhost:5000/api

Port already in use?
  → Stop Node process: Get-Process -Name node | Stop-Process -Force
  → Use different port: npm run dev -- --port 5174

Need to reset database?
  → Drop database: DROP DATABASE pediatric_health;
  → Recreate: CREATE DATABASE pediatric_health;
  → Restart backend to sync tables


📞 SUPPORT
═══════════════════════════════════════════════════════════════════════════════

For detailed setup instructions, see: SETUP_AND_RUN_GUIDE.md
For API documentation, see: backend/API_SPEC.md
For feature details, see: backend/ADVANCED_FEATURES_COMPLETE.js


═══════════════════════════════════════════════════════════════════════════════

Happy Health Tracking! 🏥✨

Start with: npm start (backend) + npm run dev (frontend)

═══════════════════════════════════════════════════════════════════════════════
`)
