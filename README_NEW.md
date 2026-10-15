# 🏥 Pediatric Health Tracker

A comprehensive full-stack child health management application with AI-powered growth prediction, vaccination scheduling, and role-based access control.

## ⚡ Quick Start

```bash
# 1. Setup database (PostgreSQL)
psql -U postgres
CREATE DATABASE pediatric_health;
\q

# 2. Start backend
cd backend
npm install
npm start          # Runs on http://localhost:5000/api

# 3. Start frontend (in new terminal)
cd frontend
npm install
npm run dev        # Runs on http://localhost:5173
```

Then open **http://localhost:5173** in your browser!

## 📋 Full Setup Guide

See [SETUP_AND_RUN_GUIDE.md](./SETUP_AND_RUN_GUIDE.md) for detailed instructions.

## 🚀 Features

### Core Features
- ✅ User authentication (JWT tokens, refresh tokens)
- ✅ Child profile management with CRUD operations
- ✅ Health records tracking (growth, vaccination, visits, medication)
- ✅ Dashboard with statistics and quick stats cards
- ✅ Analytics page with interactive charts (Recharts)
- ✅ Responsive design for all devices

### Advanced Features
- ✅ **AI Growth Prediction**: Linear regression model analyzing growth trends and predicting next month's measurements
- ✅ **Vaccination Reminders**: WHO/CDC vaccination schedule with due/overdue tracking and smart reminders
- ✅ **Multi-user Roles**: Parent, Doctor, and Admin roles with role-based access control (RBAC)
- ✅ **PDF Reports**: Export comprehensive health reports and quick summaries as PDF documents

## 🏗️ Tech Stack

### Backend
- **Node.js** 22.20.0
- **Express** 5.1.0 - Web framework
- **Sequelize** 6.37.7 - ORM for PostgreSQL
- **PostgreSQL** 16 - Database
- **JWT** - Authentication
- **pdfkit** - PDF generation
- **bcryptjs** - Password hashing

### Frontend
- **React** 18.2.0 - UI library
- **Vite** 5.0.0 - Build tool
- **React Router** v6 - Navigation
- **Recharts** 2.x - Charts and visualizations
- **Fetch API** - HTTP client

### Testing
- **Playwright** - E2E testing
- **Node.js test scripts** - API testing

## 📂 Project Structure

```
PediatricHealthTracker/
├── backend/
│   ├── models/                 # Database models (User, Child, HealthRecord)
│   ├── controllers/            # Route handlers
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Auth, RBAC, logging
│   ├── services/               # Business logic
│   │   ├── pdfExportService.js      # PDF generation
│   │   └── vaccinationScheduleService.js  # Vaccination logic
│   ├── models/
│   │   └── growthPredictionModel.js  # AI/ML model
│   ├── server.js               # Express setup
│   ├── package.json
│   └── .env                    # Configuration (create this)
│
├── frontend/
│   ├── src/
│   │   ├── pages/              # React pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ChildrenList.jsx
│   │   │   ├── ChildDetail.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── VaccinationStatus.jsx
│   │   │   └── NotificationCenter.jsx
│   │   ├── shared/
│   │   │   └── api.js          # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── package.json
│   └── playwright.config.cjs
│
├── SETUP_AND_RUN_GUIDE.md      # Detailed setup instructions
├── QUICK_START.js              # Quick reference guide
└── README.md                   # This file
```

## 🔐 Authentication & Roles

### User Roles
- **Parent** (default): Manage own children, view own data
- **Doctor**: View all children, add records to any child
- **Admin**: Full system access

### How Authentication Works
1. User registers with email/password
2. Password hashed with bcryptjs
3. JWT token issued (15-minute expiry)
4. Refresh token for extended sessions (7-day expiry)
5. Role embedded in token for authorization checks

## 🎯 Key Features Explained

### 1. AI Growth Prediction
- Analyzes minimum 2 growth records
- Uses linear regression to identify trends
- Predicts height/weight for next month
- Provides confidence level (low/medium/high/very_high)
- Generates personalized health recommendations

### 2. Vaccination Scheduling
- WHO/CDC recommended schedule
- Tracks 14+ vaccine types across 11 age groups
- Identifies due, overdue, and upcoming vaccines
- Generates smart reminders with 4 severity levels
- Displays vaccination timeline

### 3. Multi-User Roles (RBAC)
- Role-based access control on all endpoints
- Parents: Filtered to own children
- Doctors: Full visibility across children
- Admin: System-wide management
- Role included in JWT for stateless authorization

### 4. PDF Reports
- **Comprehensive Report** (multi-page):
  - Child demographics
  - Health records summary
  - Growth analysis with AI predictions
  - Vaccination status
  - Recommendations
- **Quick Summary** (single page):
  - Latest measurements
  - Next month prediction
  - Vaccination overview

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Children
- `GET /api/children` - List children (role-filtered)
- `POST /api/children` - Create child
- `GET /api/children/:childId` - Get child (role-filtered)
- `PUT /api/children/:childId` - Update child
- `DELETE /api/children/:childId` - Delete child
- `GET /api/children/:childId/vaccination-status` - Vaccination status

### Health Records
- `GET /api/health` - List records (with filtering)
- `POST /api/health` - Create record
- `GET /api/health/:recordId` - Get record
- `PUT /api/health/:recordId` - Update record
- `DELETE /api/health/:recordId` - Delete record
- `POST /api/health/predict/growth` - AI growth prediction
- `GET /api/health/export/report/:childId` - Export full PDF
- `GET /api/health/export/summary/:childId` - Export summary PDF

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
node test-vaccination-service.js
node test-ai-with-data.js
```

## 📦 Build for Production

### Frontend
```bash
cd frontend
npm run build
# Creates optimized production build in dist/
```

### Backend
Set `NODE_ENV=production` and deploy to Node.js hosting:
- Heroku
- AWS EC2/Elastic Beanstalk
- DigitalOcean
- Railway

### Database
Use managed PostgreSQL:
- AWS RDS
- Railway
- Heroku Postgres

## 🛠️ Environment Configuration

Create `backend/.env`:
```env
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pediatric_health
DB_PORT=5432

PORT=5000
NODE_ENV=development

JWT_SECRET=your_super_secret_jwt_key_12345
JWT_REFRESH_SECRET=your_super_secret_refresh_key_67890
JWT_EXPIRE=15m

CORS_ORIGIN=http://localhost:5173
```

## 🆘 Troubleshooting

**Backend won't start?**
- Verify PostgreSQL is running
- Check `.env` file with correct credentials
- Run `npm install` to reinstall dependencies

**Frontend can't connect to backend?**
- Ensure backend runs on port 5000
- Check browser console for CORS errors
- Verify `CORS_ORIGIN` in backend `.env`

**Port already in use?**
```bash
Get-Process -Name node | Stop-Process -Force
npm run dev -- --port 5174  # Use different port
```

**Need to reset database?**
```bash
psql -U postgres
DROP DATABASE pediatric_health;
CREATE DATABASE pediatric_health;
\q
# Restart backend to sync tables
```

## 📖 Documentation

- [Setup & Run Guide](./SETUP_AND_RUN_GUIDE.md) - Detailed instructions
- [API Specification](./backend/API_SPEC.md) - All endpoints
- [Advanced Features](./backend/ADVANCED_FEATURES_COMPLETE.js) - Feature details

## 🎓 Learning Resources

This project demonstrates:
- Full-stack MERN architecture (Node/Express/React)
- RESTful API design
- JWT authentication & RBAC
- Database normalization with Sequelize
- Machine learning (linear regression)
- PDF generation
- E2E testing with Playwright
- Responsive React design

## 🚀 Future Enhancements

- [ ] Admin dashboard for user management
- [ ] Email notifications for vaccination reminders
- [ ] Mobile app (React Native)
- [ ] Doctor scheduling & appointments
- [ ] Parent-doctor messaging
- [ ] Advanced analytics & trends
- [ ] Multi-language support
- [ ] Dark mode

## 📝 License

This project is open source and available for educational purposes.

## 💡 Support

For issues or questions:
1. Check the [SETUP_AND_RUN_GUIDE.md](./SETUP_AND_RUN_GUIDE.md)
2. Review error messages in terminal/console
3. Verify all prerequisites are installed
4. Check database connectivity

---

**Ready to start?** Run `npm start` in backend and `npm run dev` in frontend! 🚀
