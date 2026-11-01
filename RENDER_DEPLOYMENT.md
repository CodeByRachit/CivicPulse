# 🚀 CivicPulse Render Deployment Guide

This project is fully configured for a seamless, zero-downtime deployment on [Render](https://render.com).

---

## ⚡ Option 1: Automatic Blueprint Deployment (Recommended)

1. Open your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top right and select **Blueprint**.
3. Select your repository: **`CodeByRachit/CivicPulse`**.
4. Render will automatically detect [`render.yaml`](./render.yaml).
5. Paste your environment secrets when prompted (values from your `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `BREVO_API_KEY`
   - `BREVO_SENDER_EMAIL` (`rachit4yadav14@gmail.com`)
   - `ADMIN_EMAIL` (`admin@civicpulse.gov.in`)
   - `ADMIN_PASSWORD` (`ADMIN-2026`)
6. Click **Apply**. Render will install, build, and deploy your live URL in ~2 minutes!

---

## 🛠️ Option 2: Manual Web Service Deployment

If you prefer to configure the Web Service manually:

1. Click **New +** -> **Web Service**.
2. Connect repository **`CodeByRachit/CivicPulse`**.
3. Configure settings:
   - **Name**: `civicpulse`
   - **Region**: Any (e.g. `Oregon (US West)` or `Frankfurt (EU Central)`)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
4. Under **Advanced**:
   - **Health Check Path**: `/api/health`
5. Under **Environment Variables**, add:
   | Key | Value / Source |
   |---|---|
   | `NODE_VERSION` | `20.18.0` |
   | `HOSTNAME` | `0.0.0.0` |
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
   | `GEMINI_API_KEY` | Your Google Gemini API Key |
   | `BREVO_API_KEY` | Your Brevo SMTP API Key |
   | `BREVO_SENDER_EMAIL` | `rachit4yadav14@gmail.com` |
   | `ADMIN_EMAIL` | `admin@civicpulse.gov.in` |
   | `ADMIN_PASSWORD` | `ADMIN-2026` |
6. Click **Create Web Service**.

---

## 🛑 How to Prevent Render from Sleeping After 15 Minutes (Zero Cold Starts)

Render Free Tier instances spin down (sleep) after 15 minutes without requests, causing a 30-50s cold start when someone visits. **We have built in two complementary mechanisms to keep your app awake 24/7**:

### 1. Built-in Internal Heartbeat (`src/instrumentation.ts`)
- On startup, the server automatically reads `RENDER_EXTERNAL_URL` (injected automatically by Render on deployment, e.g. `https://civicpulse.onrender.com`).
- The internal worker executes a lightweight `GET /api/health` every **12 minutes**.
- Because this request traverses Render's public router, Render counts it as an active inbound visit, resetting the 15-minute countdown indefinitely!

### 2. Free 24/7 External Ping (1-Minute Setup - Recommended Safety Net)
To ensure the app stays awake even after reboots or fresh deploys before the first visitor lands:
1. Go to [UptimeRobot.com](https://uptimerobot.com) (100% free, 50 monitors).
2. Click **Add New Monitor**:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `CivicPulse Production`
   - **URL (or IP)**: `https://your-app-name.onrender.com/api/health`
   - **Monitoring Interval**: `Every 5 minutes` (or 10 minutes)
3. Click **Create Monitor**.
4. Done! UptimeRobot will ping your `/api/health` endpoint around the clock. Your Render instance will **never sleep or experience cold starts**.

---

## 🛡️ Production Hardening Included

- **Node 20 LTS Alignment**: `.node-version` locks Render to modern Node.js v20.18.0.
- **Network Interface Binding**: `HOSTNAME=0.0.0.0` and `next start -H 0.0.0.0 -p ${PORT:-3000}` ensures Render's port detection never times out.
- **Dedicated Health Endpoint**: `GET /api/health` responds instantly with `{ status: "healthy" }` so Render zero-downtime health probes pass immediately.
- **DNS Dual-Stack Fix**: Built-in IPv4 precedence (`dns.setDefaultResultOrder('ipv4first')`) protects Supabase, Gemini, and Brevo API calls from IPv6 DNS timeouts in cloud Linux containers.
