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

## 🛡️ Production Hardening Included

- **Node 20 LTS Alignment**: `.node-version` locks Render to modern Node.js v20.18.0.
- **Network Interface Binding**: `HOSTNAME=0.0.0.0` and `next start -H 0.0.0.0 -p ${PORT:-3000}` ensures Render's port detection never times out.
- **Dedicated Health Endpoint**: `GET /api/health` responds instantly with `{ status: "healthy" }` so Render zero-downtime health probes pass immediately.
- **DNS Dual-Stack Fix**: Built-in IPv4 precedence (`dns.setDefaultResultOrder('ipv4first')`) protects Supabase, Gemini, and Brevo API calls from IPv6 DNS timeouts in cloud Linux containers.

