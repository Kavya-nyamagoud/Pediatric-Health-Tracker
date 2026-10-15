# Pediatric Health Tracker - Setup & Run Guide

## 📋 Prerequisites

Before running the project, ensure you have:
- **Node.js** 20+ (https://nodejs.org/)
- **PostgreSQL** 14+ (https://www.postgresql.org/)
- **Git** (optional, for version control)

Verify installations:
```bash
node --version    # Should show v20.0.0+
npm --version     # Should show 10.0.0+
psql --version    # Should show PostgreSQL 14+
```

---

## 🗄️ Step 1: Database Setup

### 1.1 Create PostgreSQL Database

Open PowerShell and connect to PostgreSQL:
```bash
psql -U postgres
```

Create the database:
```sql
CREATE DATABASE pediatric_health;
\q
```

### 1.2 Create `.env` File in Backend

Navigate to the backend folder and create a `.env` file:

```
# Database Configuration
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pediatric_health
DB_PORT=5432

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_key_67890
JWT_EXPIRE=15m

# CORS
CORS_ORIGIN=http://localhost:5173
```

---

## 🚀 Step 2: Backend Setup & Run

### 2.1 Install Dependencies

```bash
cd "c:\Users\ADMIN\New folder (2)\PediatricHealthTracker\backend"
npm install
```

Expected output:
```
added XXX packages, audited XXX packages in Xs
```

### 2.2 Start Backend Server

```bash
npm start
```

Expected output:
```
🚀 Server running on port 5000
✅ PostgreSQL Connected
✅ All tables synced successfully
```

**The backend is now running on:** `http://localhost:5000/api`

### 2.3 Test Backend (Optional)

In another PowerShell window:
```bash
cd "c:\Users\ADMIN\New folder (2)\PediatricHealthTracker\backend"
node test-api.js
```

---

## 💻 Step 3: Frontend Setup & Run

### 3.1 Install Dependencies

In a **new PowerShell window**:

```bash
cd "c:\Users\ADMIN\New folder (2)\PediatricHealthTracker\frontend"
npm install
```

### 3.2 Start Frontend Dev Server

```bash
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**The frontend is now running on:** `http://localhost:5173`

### 3.3 Open Application

Open your browser and go to: **http://localhost:5173**

---

## 📱 Using the Application

### Create Account & Login

1. Click **"Register"** on the login page
2. Enter:
   - Name: (your name)
   - Email: (any email address)
   - Password: (minimum 6 characters)
3. Click **"Register"**
4. You'll be logged in automatically

### Add a Child

1. Go to **"Children"** page
2. Click **"➕ Add Child"**
3. Fill in:
   - First Name
   - Last Name
   - Date of Birth
   - Gender
   - Blood Type (optional)
4. Click **"Save Child"**

### Add Health Records

1. Click on a child's card to open details
2. Click **"➕ Add Record"**
3. Select record type:
   - **Growth**: Height, weight, head circumference, BMI
   - **Vaccination**: Vaccine name
   - **Medical Visit**: Notes about the visit
   - **Medication**: Medicine information
4. Fill in data and click **"Save Record"**

### View AI Growth Prediction

1. Go to **"Analytics"** page
2. Select a child from dropdown
3. Scroll to **"AI Growth Prediction"** section
4. View:
   - Growth trends (cm/month, kg/month)
   - Next month predictions
   - Health recommendations
   - Confidence level

*Note: Need minimum 2 growth records for prediction*

### Check Vaccination Status

1. Open a child's detail page
2. Scroll to **"💉 Vaccination Status"** section
3. View:
   - Overall vaccination status
   - Due vaccines
   - Overdue vaccines
   - Upcoming vaccinations
   - Health reminders

### Export Reports

1. Open a child's detail page
2. Click **"📄 Quick Summary"** for single-page PDF
3. Or click **"📋 Full Report"** for comprehensive PDF
4. PDF will download automatically

---

## 🔐 User Roles (For Testing)

### Default Role: Parent
- Registered users are parents by default
- Can manage only their own children
- Can view their children's health data

### Doctor Role (For Testing)
To test doctor features, you would need to:
1. Access database directly and update user role:
   ```sql
   UPDATE "Users" SET role='doctor' WHERE email='doctor@example.com';
   ```
2. Doctor can view all children and add records to any child

### Admin Role
- Reserved for system administrators
- Full system access

---

## 📊 Project Structure

```
PediatricHealthTracker/
├── backend/
│   ├── models/              # Database models
│   ├── controllers/         # API logic
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, RBAC, logging
│   ├── services/            # Business logic (PDF, AI, Vaccination)
│   ├── config/              # Configuration
│   ├── server.js            # Main server file
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/           # Main pages (Dashboard, Analytics, etc.)
│   │   ├── components/      # Reusable components
│   │   ├── shared/          # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## 🛠️ Troubleshooting

### Issue: "Cannot find module" error

**Solution:** Reinstall dependencies
```bash
# Backend
cd backend
rm -r node_modules
npm install

# Frontend
cd ../frontend
rm -r node_modules
npm install
```

### Issue: PostgreSQL connection failed

**Solution:** Check database connection
```bash
# Verify PostgreSQL is running
psql -U postgres -d pediatric_health -c "SELECT version();"

# Check .env file has correct credentials
cat .env
```

### Issue: Port 5000 or 5173 already in use

**Solution:** Kill process using the port
```bash
# For port 5000 (Backend)
Get-Process -Name node | Stop-Process -Force

# For port 5173 (Frontend), restart with different port
npm run dev -- --port 5174
```

### Issue: Frontend can't connect to backend

**Solution:** Verify both are running
```bash
# Check backend is running on 5000
curl http://localhost:5000/api/auth/login

# Check frontend is running on 5173
curl http://localhost:5173
```

---

## 📈 Available Features

### Core Features
✅ User authentication with JWT tokens
✅ Child profile management
✅ Health records tracking (growth, vaccination, visits)
✅ Dashboard with statistics
✅ Analytics with charts
✅ Responsive design

### Advanced Features
✅ AI Growth Prediction (ML model)
✅ Vaccination Schedule Reminders (WHO/CDC)

Note: An AI-backed recommendation option is available. Set `OPENAI_API_KEY` in your environment to enable AI-generated, age-aware vaccine suggestions. If not set, the system uses a safe built-in schedule fallback.
✅ Multi-user Roles (Parent, Doctor, Admin)
✅ PDF Data Export (Reports & Summaries)

---

## 🧪 Testing

### Run E2E Tests

```bash
cd frontend
npm run test
```

### Test Backend API

```bash
cd backend
node test-api.js
node test-ai-with-data.js
node test-vaccination-service.js
```

---

## 📦 Build for Production

### Frontend Build

```bash
cd frontend
npm run build
```

This creates a `dist/` folder with optimized production build.

### Deploy

1. **Backend**: Deploy to Node.js hosting (Heroku, AWS, DigitalOcean)
2. **Frontend**: Deploy to static hosting (Vercel, Netlify, AWS S3)
3. **Database**: Use managed PostgreSQL (AWS RDS, Railway, Heroku)

---

## 📞 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Children
- `GET /api/children` - List children
- `POST /api/children` - Create child
- `GET /api/children/:childId` - Get child details
- `PUT /api/children/:childId` - Update child
- `DELETE /api/children/:childId` - Delete child
- `GET /api/children/:childId/vaccination-status` - Get vaccination status

### Health Records
- `GET /api/health` - List health records
- `POST /api/health` - Create health record
- `GET /api/health/:recordId` - Get record
- `PUT /api/health/:recordId` - Update record
- `DELETE /api/health/:recordId` - Delete record
- `POST /api/health/predict/growth` - Get AI prediction
- `GET /api/health/export/report/:childId` - Export full report PDF
- `GET /api/health/export/summary/:childId` - Export summary PDF

---

## 🎯 Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `pediatric_health` created
- [ ] Backend `.env` file created
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend running (`npm start`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend running (`npm run dev`)
- [ ] Access application at http://localhost:5173
- [ ] Create test account
- [ ] Add test child and health records

---

## 💡 Tips

1. **Keep two terminals open**: One for backend, one for frontend
2. **Check console logs**: Frontend (browser dev tools) and backend (terminal) for debugging
3. **Use role badge**: Check Navbar to see your current role
4. **Test different roles**: Modify user role in database to test doctor/admin features
5. **Export reports**: Add health data first, then try PDF export features

---

## 🆘 Need Help?

- Check terminal output for error messages
- Verify `.env` configuration
- Ensure all ports are available (5000, 5173)
- Confirm PostgreSQL connection with `psql` command
- Check that Node.js version is 20+

---

Happy tracking! 🏥👨‍⚕️📊
