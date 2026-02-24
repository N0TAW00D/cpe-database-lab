# InvoiceDoc2 Deployment Guide (Supabase + Render + Vercel)

This guide covers full-cycle deployment: database on Supabase, backend on Render, and frontend on Vercel.

---

## Table of contents

1. [Database: Supabase](#1-database-supabase)
2. [Backend: Render (Express)](#2-backend-render-express)
3. [Frontend: Vercel (React/Vite)](#3-frontend-vercel-reactvite)
4. [Post-deploy checks](#4-post-deploy-checks)

---

## 1. Database: Supabase

Supabase provides managed PostgreSQL with an easy dashboard, suitable for small projects and learning.

### 1.1 Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in (or sign up).
2. Click **New Project**.
3. Set:
   - **Name**: e.g. `invoicedoc2`
   - **Database Password**: choose a strong password and **keep it** (you need it for the connection string).
   - **Region**: pick one near you (e.g. Singapore).
4. Click **Create new project** and wait until it’s ready (about 1–2 minutes).

### 1.2 Run SQL (schema + seed)

1. In the project, open **SQL Editor** in the left menu.
2. Click **New query**.
3. Open `database/sql/sql_run.sql` in this repo and **copy the entire file** into the SQL Editor.
4. Click **Run** (or Ctrl/Cmd + Enter).
5. Confirm success (e.g. “Success. No rows returned”) and no red errors.  
   The script drops existing tables (if any), then creates tables and inserts sample data (customers, products, invoices, etc.).

### 1.3 Get the connection string (DATABASE_URL)

**Important:** When sharing the link or using it with the backend (Render), you **must** use the **Transaction pooler** connection. The default (direct) connection does not work with externally deployed backends (e.g. Render, Vercel). Use the pooler: the host should be `....pooler.supabase.com` and the port **6543**.

You can get it in two ways (either is fine):

- **Option 1 — From the project home (recommended):** On the project dashboard, click **Connect** in the **top-left bar, next to main** (branch) → choose **URI**, then select **Transaction pooler** (not Session or direct).
- **Option 2:** Go to **Project Settings** (gear icon on the left) → **Database** → scroll to **Connection string** → open the **URI** tab and select **Transaction pooler**.

Then:

1. Copy the **URI** connection string (starts with `postgresql://`). It must be the pooler form, e.g.  
   `postgresql://postgres.xxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`
2. Replace `[YOUR-PASSWORD]` in the URL with your **Database Password** from project creation.  
   If the password contains special characters (e.g. `#`, `@`), use percent-encoding (e.g. `#` → `%23`) or change the password in Supabase to avoid them.
3. Save this URL as **DATABASE_URL** for the Backend (Render) step.

### Notes for TAs / instructors

- To simplify for students:
  - **Option A:** Create one Supabase project and share **DATABASE_URL** (mind security and avoid students overwriting each other’s data).
  - **Option B:** Use the repo’s `sql_run.sql` as a template; students create their own Supabase project and run it in the SQL Editor so they each have their own DB.

---

## 2. Backend: Render (Express)

The backend is an Express app in the `server/` folder and reads `DATABASE_URL` from the environment.

### 2.1 Prepare the Git repo

- Ensure the code is pushed to GitHub (or GitLab) so Render can pull from it.
- **Repo must be public:** On Render’s free tier only public repositories are supported. For a private repo you need a Render plan that supports private repos.

### 2.2 Create a Web Service on Render

1. Go to [https://render.com](https://render.com) and sign in (or sign up and connect GitHub).
2. Click **New +** → **Web Service**.
3. **Connect** the InvoiceDoc2 repository (connect your account and select the repo if needed).
4. Select the InvoiceDoc2 repository.

### 2.3 Build and start settings

| Setting | Value for this project |
|--------|------------------------|
| **Name** | e.g. `invoicedoc2-api` |
| **Region** | One near you (e.g. Singapore) |
| **Root Directory** | `server` |
| **Runtime** | **Docker** (recommended — the repo already has `server/Dockerfile`) |

If you choose **Runtime = Docker**:

- Do not set Build Command or Start Command. Render will build from the Dockerfile and run the container using its `CMD`.
- Ensure Root Directory = `server` (the folder that contains the Dockerfile).

If you prefer **Runtime = Node** (no Docker):

- **Build Command** = `npm install`
- **Start Command** = `npm start`

### 2.4 Environment variables

In the Web Service **Environment** section, add:

| Key | Value | Notes |
|-----|--------|--------|
| `DATABASE_URL` | (Supabase connection string with password filled in) | **Required** for the backend to connect to PostgreSQL. |
| `NODE_ENV` | `production` | Recommended so the app runs in production mode. |
| `CORS_ORIGIN` | Frontend URL on Vercel, e.g. `https://invoicedoc2-xxxx.vercel.app` | **Important:** without this, the frontend cannot call the API (if left empty the backend allows all origins — after deploying the frontend, come back and set this). |

Add any other env vars your code expects (e.g. PORT is set automatically by Render).

### 2.5 Deploy

1. Click **Create Web Service**.
2. Wait until the service is **Live** (green).
3. Note the service URL, e.g.  
   `https://invoicedoc2-api.onrender.com`

### 2.6 Verify the backend

- In a browser: `https://<service-name>.onrender.com/health`  
  You should see JSON like `{"ok":true}`.
- Or: `https://<service-name>.onrender.com/api/customers`  
  You should see customer data (or an empty array).

If something fails, check **Logs** in Render for DB or env errors.

---

## 3. Frontend: Vercel (React/Vite)

The frontend lives in the `client/` folder (Vite + React) and calls the API using `VITE_API_BASE` (see `import.meta.env.VITE_API_BASE` in `client/src/api/http.js`).

### 3.1 Create a project on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign in (or sign up and connect GitHub).
2. Click **Add New…** → **Project**.
3. **Import** the InvoiceDoc2 Git repository.

### 3.2 Root and build settings

| Setting | Value |
|--------|--------|
| **Framework Preset** | Use **Application Preset** (or whatever Vercel detects, e.g. Vite) — defaults are fine. |
| **Root Directory** | `client` ← **Important:** must be `client` because the frontend is in this folder. |
| **Build Command** | Leave default. |
| **Output Directory** | Leave default. |

### 3.3 Environment variable for the API

The app uses **VITE_API_BASE** (not `VITE_API_URL`) in `client/src/api/http.js`.

In the project **Environment Variables**, add:

| Key | Value |
|-----|--------|
| `VITE_API_BASE` | `https://invoicedoc2-api.onrender.com` |

- Replace with your **actual Backend URL** from Render (no trailing slash needed).
- Variables starting with `VITE_` are baked in at build time, so you must **redeploy** after changing them.

### 3.4 Deploy

1. Click **Deploy**.
2. Wait for the build and deploy to finish. You’ll get a URL like  
   `https://invoicedoc2-xxxx.vercel.app`

### 3.5 Verify the frontend

- Open the Vercel URL and use the main flows (e.g. customers, products, invoices) to confirm API calls work and there are no CORS errors.

### 3.6 Final step: set CORS on the backend

After the frontend (Vercel) is deployed, you **must** go back to the **Backend (Render)** and set CORS; otherwise the browser will block frontend requests.

1. In Render, open your backend Web Service.
2. Go to **Environment** and add or edit **`CORS_ORIGIN`**.
3. Set it to your **frontend URL on Vercel** (e.g. `https://invoicedoc2-xxxx.vercel.app`) — no trailing slash.
4. Save; Render will redeploy. When it’s live, try the frontend again.

For multiple origins (e.g. Vercel preview URLs), use a comma-separated list, e.g.  
`https://invoicedoc2-xxxx.vercel.app,https://invoicedoc2-git-xxx.vercel.app`

---

## 4. Post-deploy checks

Quick reference:

| Layer | Example URL | How to check |
|--------|--------------|---------------|
| DB | (accessed via backend only) | Backend returns correct data. |
| Backend | `https://invoicedoc2-api.onrender.com` | `/health` returns `{"ok":true}`; `/api/customers` returns data. |
| Frontend | `https://invoicedoc2-xxxx.vercel.app` | Open the app and use features that call the API. |

### Recommended order

1. Create the project and run SQL in Supabase → get `DATABASE_URL`.
2. Deploy the backend on Render with `DATABASE_URL` and `NODE_ENV=production` → get the API URL.
3. Deploy the frontend on Vercel with `VITE_API_BASE=<Render API URL>` → get the app URL.
4. Set `CORS_ORIGIN` on Render to the Vercel app URL.

If any step fails, check logs on the relevant platform (Supabase, Render, Vercel) to debug.
