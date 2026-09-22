# Deployment Guide

This app deploys as three pieces:

- **Database** — Neon (managed Postgres)
- **Backend API** — Render (Node/Express web service)
- **Frontend** — Vercel (Angular static site)

Deploy in that order, because the backend needs the database URL, and the
frontend needs the backend URL.

---

## 1. Database — Neon

1. In the [Neon console](https://console.neon.tech), create a project (any name).
2. Open **Connection Details** and copy the **connection string**. It looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DBNAME?sslmode=require
   ```
3. Keep this handy — it becomes `DATABASE_URL` on Render.

You do **not** need to create any tables. The backend creates them
automatically on first boot and seeds demo users + records.

---

## 2. Backend — Render

You can deploy either from the included `render.yaml` blueprint or manually.

### Option A — Blueprint (recommended)
1. In Render: **New → Blueprint**, connect this GitHub repo, and select it.
2. Render reads `render.yaml` and proposes the `mploycheck-backend` service.
3. When prompted for the env vars marked "sync: false", set:
   - **`DATABASE_URL`** → the Neon connection string from step 1.
   - **`CORS_ORIGINS`** → leave blank for now; you will set it after the
     frontend is deployed (step 4).
   - `JWT_SECRET` is auto-generated; `DATABASE_SSL`, `JWT_EXPIRES_IN`,
     `API_DELAY`, `NODE_VERSION` are pre-filled.
4. Create the service and wait for the first deploy to finish.

### Option B — Manual Web Service
- **Root Directory:** `backend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/api/health`
- **Environment variables:**
  | Key | Value |
  |-----|-------|
  | `DATABASE_URL` | your Neon connection string |
  | `DATABASE_SSL` | `true` |
  | `JWT_SECRET` | any long random string |
  | `JWT_EXPIRES_IN` | `24h` |
  | `CORS_ORIGINS` | (set after step 3, your Vercel URL) |
  | `API_DELAY` | `1500` |

When it's live, note the backend URL, e.g.
`https://mploycheck-backend.onrender.com`. Verify it works by opening
`https://mploycheck-backend.onrender.com/api/health` — you should get a JSON
`{ "success": true, ... }`.

> **Note (free plan):** Render free services sleep after inactivity, so the
> first request after idle can take ~30–60s to wake. Neon may also pause an
> idle database; the first query wakes it.

---

## 3. Frontend — Vercel

1. In Vercel: **Add New → Project**, import this GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Vercel picks up `frontend/vercel.json` (build command, output dir, SPA
   rewrites) automatically.
4. Add an **Environment Variable**:
   - **`API_URL`** → your Render backend URL **with `/api` appended**, e.g.
     ```
     https://mploycheck-backend.onrender.com/api
     ```
   This is baked into the Angular build (Angular can't read env vars at runtime).
5. Deploy. Note the resulting URL, e.g. `https://your-app.vercel.app`.

---

## 4. Connect the two (CORS)

Back on **Render**, set the backend's `CORS_ORIGINS` env var to your Vercel URL:
```
CORS_ORIGINS=https://your-app.vercel.app
```
Save — Render redeploys. Without this, the browser blocks the frontend's API
calls with a CORS error.

If you later add a custom domain or a Vercel preview URL, add it too
(comma-separated): `https://your-app.vercel.app,https://www.yourdomain.com`.

---

## 5. Verify it works

1. Open your Vercel URL.
2. Log in with a seeded account:
   - Admin: `admin@mploycheck.com` / `Admin@123`
   - User: `user@mploycheck.com` / `User@123`
3. Admin should land on the dashboard with live records; a general user should
   be able to upload documents and see progress persist across refreshes.

---

## Local development

**Backend:**
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL (a Neon URL works fine locally)
npm install
npm run dev               # http://localhost:3000/api
```

**Frontend:**
```bash
cd frontend
npm install
npx ng serve --port 4200  # http://localhost:4200  (uses environment.ts → localhost:3000/api)
```

---

## Notes

- **Data persistence:** the app now stores everything in Postgres, so users and
  uploaded-document records survive restarts and redeploys.
- **Uploads are simulated:** the "upload" endpoint records document metadata
  (name, type, size) in the database; it does not store actual files. Adding
  real file storage (e.g. S3, Supabase Storage) would be a future enhancement.
- **CI:** `.github/workflows/ci.yml` builds both apps on every push/PR, which is
  the canonical check that the code compiles.
