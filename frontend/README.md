# PediatricHealthTracker — Frontend

Minimal frontend for the Pediatric Health Tracker built with React + Vite.

Quick start (Windows PowerShell):

1. Install dependencies

```powershell
cd frontend
npm install
```

2. Run development server

```powershell
npm run dev
```

3. Build for production

```powershell
npm run build
# Preview built app locally
npm run preview
```

Notes:
- The backend API is expected at `http://localhost:5000/api`. Change `src/shared/api.js` if needed.
- The project uses Vite; `@vitejs/plugin-react` is added to support fast HMR and JSX transform.
# Pediatric Health Tracker — Frontend

This is a minimal React (Vite) frontend scaffold for the Pediatric Health Tracker project.

Key features implemented:
- Login and Register pages (POST /api/auth/*)
- Children list and add child (GET/POST /api/children)
- Child detail and add health record (GET /api/health/:childId, POST /api/health)
- Axios client with Authorization header set from localStorage token
- Simple routing and protected routes (React Router v6)

How to run

1. From the `frontend` folder, install dependencies:

```powershell
npm install
```

2. Start the dev server:

```powershell
npm run dev
```

3. Make sure the backend is running (default: http://localhost:5000). The frontend expects the backend at http://localhost:5000/api.

Notes and next steps
- This is intentionally lightweight. You can swap in a UI library (Bootstrap, MUI) or add form validation.
- Error handling is minimal; add better UX on production.
- CORS must be enabled in backend (server.js already uses cors()).
