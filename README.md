# CivicPulse

**Public Infrastructure & Grievance Tracker** — A real-time civic triage platform that uses AI-powered severity assessment, geospatial duplicate detection, and transparent municipal accountability to streamline how citizens report and track public infrastructure issues.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Database Setup (Supabase)](#database-setup-supabase)
- [API Reference](#api-reference)
- [Architecture Deep Dive](#architecture-deep-dive)
- [Security Model](#security-model)
- [License](#license)

---

## Overview

CivicPulse is a Next.js 16 web application that allows citizens to submit infrastructure grievance reports (potholes, water leaks, electrical hazards, pollution, etc.) using photos, voice recordings, or text descriptions. Every submission is automatically triaged by Google Gemini's multimodal AI, enriched with live weather and reverse-geocoded addresses, deduplicated using hybrid geospatial + semantic vector matching, and persisted to a Supabase (PostgreSQL) backend with full cryptographic audit trails.

The frontend features a 3D interactive globe built with Three.js (React Three Fiber) that visualises all active grievances as pins on the Earth, plus a Leaflet satellite map view for drill-down inspection. Real-time updates are pushed via Supabase Realtime (WebSocket).

---

## Key Features

| Feature | Description |
|---|---|
| **Multimodal AI Triage** | Google Gemini analyses photos/audio + text to classify, score severity (1–10), and auto-draft work orders |
| **Weather-Calibrated Severity** | Live atmospheric data from Open-Meteo adjusts severity scores (e.g. rain amplifies pothole danger) |
| **Hybrid Deduplication** | Combines PostGIS spatial proximity (100 m radius) with pgvector cosine similarity (≥0.82) to merge duplicate reports |
| **3D Globe Visualisation** | Three.js globe with severity-proportional pin heights, pulsing critical alerts, and zoom-to-satellite transition |
| **Leaflet Satellite Map** | High-resolution satellite tile view for street-level inspection of incident locations |
| **Cryptographic Audit Trail** | AES-256-GCM encryption at rest, HMAC-SHA256 non-repudiation receipts, SHA-256 media fingerprinting |
| **Real-time Updates** | Supabase Realtime (Postgres Changes) pushes live updates to all connected clients |
| **Voice Reports** | Browser MediaRecorder integration for recording voice-note reports directly |
| **Citizen PII Encryption** | Optional reporter contact info is AES-256-GCM encrypted before storage |
| **Rate Limiting** | In-memory sliding-window rate limiter (30 req/min per IP) |
| **SLA Tracking** | Per-department SLA deadlines with countdown timers |
| **Prompt Injection Defence** | Input sanitisation neutralises adversarial LLM prompt injection attempts |
| **Magic Byte Verification** | Binary header inspection prevents MIME-spoofing and polyglot file injection |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, React 19) |
| **Language** | TypeScript 7 |
| **Styling** | Tailwind CSS 4 |
| **3D Rendering** | Three.js + React Three Fiber + Drei |
| **2D Mapping** | Leaflet + MapLibre GL |
| **AI / LLM** | Google Gemini API (`@google/genai`) — gemini-2.5-flash / gemini-3-flash-preview / gemini-3.8-flash |
| **Embeddings** | text-embedding-004 / gemini-embedding-001 (768-dim vectors) |
| **Database** | Supabase (PostgreSQL) with PostGIS + pgvector extensions |
| **Storage** | Supabase Storage (media uploads) |
| **Real-time** | Supabase Realtime (WebSocket, Postgres Changes) |
| **Encryption** | Node.js `crypto` — AES-256-GCM, HMAC-SHA256, scrypt KDF |
| **Icons** | Lucide React |
| **Weather API** | [Open-Meteo](https://open-meteo.com/) (free, no key required) |
| **Geocoding** | [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) |

---

## Project Structure

```
civicpulse/
├── public/
│   └── textures/               # 3D globe texture assets (earth.jpg, clouds.png)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── triage/
│   │   │       └── route.ts    # Core API — POST (submit), GET (list), PATCH (upvote/dispatch/resolve)
│   │   ├── globals.css         # Global styles + Tailwind + Leaflet overrides
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Main single-page application (Submit / Feed / Inspect tabs)
│   ├── components/
│   │   └── ThreeSpatialCanvas.tsx  # 3D globe + Leaflet satellite map dual-view component
│   ├── lib/
│   │   ├── env-enrichment.ts   # Reverse geocoding (Nominatim) + live weather (Open-Meteo)
│   │   ├── security.ts         # AES-256-GCM encryption, HMAC receipts, rate limiting, input sanitisation
│   │   └── supabase.ts         # Supabase client setup (browser + admin service role)
│   └── types/
│       └── grievance.ts        # TypeScript type definitions for the entire domain model
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── .gitignore
```

---

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **npm** ≥ 10
- A **Supabase** project (free tier works)
- A **Google Gemini API key** (from [Google AI Studio](https://aistudio.google.com/))

---

## Environment Variables

Create a `.env.local` file in the project root with the following:

```env
# ── Supabase ──
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# ── Google Gemini AI ──
GEMINI_API_KEY=your-gemini-api-key

# ── Encryption (optional — falls back to service role key, then dev default) ──
ENCRYPTION_MASTER_KEY=your-random-secret-string
```

| Variable | Required | Client/Server | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Both | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Both | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only | Supabase admin key for privileged DB operations |
| `GEMINI_API_KEY` | ✅ | Server only | Google Gemini API key for AI triage |
| `ENCRYPTION_MASTER_KEY` | ❌ | Server only | Custom master key for AES-256-GCM encryption (optional) |

> ⚠️ **Never** commit `.env.local` to version control. The `.gitignore` already excludes it.

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd civicpulse

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local   # then fill in your values

# 4. Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

---

## Database Setup (Supabase)

The application expects the following to be configured in your Supabase project:

### Required PostgreSQL Extensions

Enable these via the Supabase Dashboard → Database → Extensions:

- **PostGIS** — Geospatial queries (`ST_DWithin`, `geography` type)
- **pgvector** — Semantic vector similarity search (`vector(768)`, cosine distance `<=>`)

### Tables

#### `departments`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK) | Department unique ID |
| `code` | `text` (unique) | Department code: `PWD-ROADS`, `WATER-SAN`, `ENV-POLL`, `ELEC-GRID` |
| `name` | `text` | Human-readable department name |
| `sla_hours` | `integer` | SLA deadline in hours |
| `escalation_email` | `text` | Escalation contact email |

#### `grievances`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` (PK, default gen) | Grievance unique ID |
| `title` | `text` | AI-generated incident title |
| `description` | `text` | Citizen description or AI synthesis |
| `category` | `text` | Classification category |
| `department_code` | `text` (FK → departments.code) | Assigned department |
| `severity_score` | `float` | Weather-calibrated severity (1.0–10.0) |
| `urgency_level` | `text` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | `text` | `TRIAGED`, `CLUSTERED`, `DISPATCHED`, `RESOLVED` |
| `upvotes` | `integer` | Community confirmation count |
| `media_url` | `text` (nullable) | Public URL of uploaded media |
| `media_type` | `text` (nullable) | MIME type of media |
| `lat` | `float` | WGS-84 latitude |
| `lng` | `float` | WGS-84 longitude |
| `location` | `geography(POINT, 4326)` | PostGIS geography for spatial queries |
| `address` | `text` (nullable) | AES-256-GCM encrypted civic address |
| `weather_context` | `jsonb` (nullable) | Live weather snapshot at time of report |
| `ai_reasoning_log` | `jsonb` | Full AI triage output, audit trail, merge history |
| `embedding` | `vector(768)` | Semantic embedding for deduplication |
| `sla_deadline` | `timestamptz` | SLA deadline timestamp |
| `created_at` | `timestamptz` | Creation timestamp |

### Required RPC Function

Create this PostgreSQL function for hybrid deduplication:

```sql
CREATE OR REPLACE FUNCTION find_duplicate_grievance(
  query_lat DOUBLE PRECISION,
  query_lng DOUBLE PRECISION,
  query_embedding VECTOR(768),
  radius_meters DOUBLE PRECISION DEFAULT 100.0,
  similarity_threshold DOUBLE PRECISION DEFAULT 0.82
)
RETURNS TABLE (
  matched_id UUID,
  distance_meters DOUBLE PRECISION,
  cosine_similarity DOUBLE PRECISION,
  current_upvotes INTEGER,
  current_severity DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id AS matched_id,
    ST_Distance(g.location, ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography) AS distance_meters,
    1 - (g.embedding <=> query_embedding) AS cosine_similarity,
    g.upvotes AS current_upvotes,
    g.severity_score AS current_severity
  FROM grievances g
  WHERE
    g.status != 'RESOLVED'
    AND ST_DWithin(g.location, ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography, radius_meters)
    AND (1 - (g.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY cosine_similarity DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

### Supabase Storage

Create a **public** storage bucket named `grievance-media` for incident photo/audio uploads.

### Seed Data — Departments

```sql
INSERT INTO departments (id, code, name, sla_hours, escalation_email) VALUES
  (gen_random_uuid(), 'PWD-ROADS', 'Public Works — Roads & Structures', 48, 'roads@municipality.gov'),
  (gen_random_uuid(), 'WATER-SAN', 'Water & Sanitation Department', 24, 'water@municipality.gov'),
  (gen_random_uuid(), 'ENV-POLL', 'Environmental & Waste Management', 72, 'environment@municipality.gov'),
  (gen_random_uuid(), 'ELEC-GRID', 'Electrical & Power Grid Division', 12, 'power@municipality.gov');
```

---

## API Reference

All endpoints are at `/api/triage`.

### `POST /api/triage` — Submit a Grievance

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| `lat` | `string` | ✅ | Latitude (-90 to 90) |
| `lng` | `string` | ✅ | Longitude (-180 to 180) |
| `description` | `string` | Conditional | Text description (min 10 chars if no media) |
| `media` | `File` | Conditional | Image or audio file (max 10 MB) |
| `reporter_contact` | `string` | ❌ | Optional PII (encrypted at rest) |

**Response Outcomes:**

| Status | Body Shape | Scenario |
|---|---|---|
| `201` | `{ action: "CREATED_NEW", grievance: {...} }` | New unique incident created |
| `200` | `{ action: "MERGED_DUPLICATE", match_metrics: {...}, grievance: {...} }` | Merged into existing nearby report |
| `422` | `{ status: "REJECTED", reason: "..." }` | AI determined submission is not a civic issue |
| `400` | `{ error: "..." }` | Validation failure |
| `429` | `{ error: "..." }` | Rate limit exceeded |
| `500` | `{ error: "...", details: "..." }` | Server/pipeline error |

**Pipeline Stages:**
1. Rate limiting + input validation + prompt injection neutralisation
2. Magic byte verification + media upload to Supabase Storage
3. Parallel: reverse geocoding + live weather enrichment
4. Gemini multimodal forensic triage (structured JSON output)
5. 768-dim semantic embedding generation
6. Cryptographic receipt + AES-256-GCM envelope encryption
7. Hybrid PostGIS + pgvector deduplication check
8. Insert new or merge into existing grievance

### `GET /api/triage` — List Grievances

| Param | Type | Required | Description |
|---|---|---|---|
| `department` | `string` | ❌ | Filter by department code |
| `status` | `string` | ❌ | Filter by status |
| `limit` | `number` | ❌ | Max records (default 100, max 200) |

**Response:** `{ grievances: GrievanceRecord[], summary: { total, critical_count, clustered_count, avg_severity } }`

### `PATCH /api/triage` — Update a Grievance

**Content-Type:** `application/json`

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Grievance UUID |
| `action` | `string` | ✅ | `UPVOTE`, `DISPATCH`, or `RESOLVE` |

- **UPVOTE** — Increments upvotes (+1) and severity (+0.2), recalculates urgency
- **DISPATCH** — Sets status to `DISPATCHED`
- **RESOLVE** — Sets status to `RESOLVED`

---

## Architecture Deep Dive

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER CLIENT                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Submit Tab   │  │  Feed Tab    │  │  Inspect Tab │  │
│  │ (Form/Voice)  │  │  (List)      │  │  (Detail)    │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│  ┌──────┴─────────────────┴──────────────────┴───────┐  │
│  │         Three.js Globe + Leaflet Satellite        │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          │                              │
│  Supabase Realtime ◄─────┤ (WebSocket)                  │
└──────────────────────────┼──────────────────────────────┘
                           │  HTTP
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTE                       │
│                  /api/triage                              │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Rate    │→ │ Input    │→ │ Magic    │→ │ Storage  │  │
│  │ Limiter │  │ Sanitize │  │ Byte     │  │ Upload   │  │
│  └─────────┘  └──────────┘  │ Verify   │  └──────────┘  │
│                             └──────────┘                 │
│  ┌──────────────────────────────────────────┐            │
│  │  Parallel Enrichment                     │            │
│  │  ├── Nominatim Reverse Geocode           │            │
│  │  └── Open-Meteo Live Weather             │            │
│  └──────────────────────────────────────────┘            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Gemini AI   │→ │ 768-dim      │→ │ PostGIS +       │ │
│  │ Multimodal  │  │ Embedding    │  │ pgvector Dedup  │ │
│  │ Triage      │  │ Generation   │  │                 │ │
│  └─────────────┘  └──────────────┘  └────────┬────────┘ │
│                                              │          │
│  ┌────────────────────┐                      ▼          │
│  │ AES-256-GCM        │         ┌─────────────────────┐ │
│  │ Encrypt + HMAC     │────────→│ Supabase PostgreSQL │ │
│  │ Receipt            │         │ (Insert / Merge)    │ │
│  └────────────────────┘         └─────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### AI Model Fallback Chain

The triage endpoint tries Gemini models in sequence with automatic fallback:

1. `gemini-2.5-flash` (primary)
2. `gemini-3-flash-preview` (fallback)
3. `gemini-3.8-flash` (final fallback)

Similarly, embeddings try `text-embedding-004` first, then `gemini-embedding-001`.

---

## Security Model

| Layer | Mechanism |
|---|---|
| **Encryption at Rest** | AES-256-GCM with scrypt-derived 256-bit master key for addresses, work orders, and citizen PII |
| **Non-Repudiation** | HMAC-SHA256 cryptographic receipts returned in response headers (`X-CivicPulse-Receipt-Id`) |
| **Media Integrity** | SHA-256 fingerprint of every uploaded file stored in the audit trail |
| **Binary Verification** | Magic byte header inspection of uploads to prevent MIME spoofing |
| **Input Sanitisation** | HTML/script tag stripping + prompt injection pattern neutralisation |
| **Rate Limiting** | In-memory sliding-window (30 req/60s per IP) with periodic cleanup |
| **HTTP Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (HSTS preload) |
| **Service Role Guard** | `getSupabaseServiceAdmin()` throws if called from browser context |

---

## License

This project is private. Please contact the repository owner for licensing information.
