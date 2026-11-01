/**
 * Next.js Server Lifecycle Instrumentation Hook
 * Automatically runs once upon server startup.
 * Keeps the Render Web Service active by pinging /api/health every 12 minutes (preventing the 15-minute idle sleep).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const targetUrl =
      process.env.RENDER_EXTERNAL_URL ||
      process.env.KEEP_ALIVE_URL ||
      process.env.NEXT_PUBLIC_APP_URL;

    if (!targetUrl) {
      console.log(
        '[Keep-Alive] Standby mode: RENDER_EXTERNAL_URL not set in this environment. Self-ping idle.'
      );
      return;
    }

    const cleanUrl = targetUrl.replace(/\/+$/, '');
    const pingEndpoint = `${cleanUrl}/api/health`;

    console.log(
      `[Keep-Alive] Initialized heartbeat worker for ${pingEndpoint}. Pinging every 12 minutes to prevent Render idle sleep.`
    );

    // 12-minute interval (Render spins down after 15 minutes of inactivity)
    const INTERVAL_MS = 12 * 60 * 1000;

    // Initial warm-up ping after 30 seconds
    setTimeout(() => {
      pingServer(pingEndpoint);
    }, 30_000);

    // Recurring keep-alive heartbeat
    setInterval(() => {
      pingServer(pingEndpoint);
    }, INTERVAL_MS);
  }
}

async function pingServer(endpoint: string) {
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'User-Agent': 'CivicPulse-KeepAlive-Heartbeat/1.0',
        'Cache-Control': 'no-cache',
      },
    });

    if (res.ok) {
      console.log(
        `[Keep-Alive] Heartbeat ping successful -> ${endpoint} (status 200). Render 15-minute sleep timer reset.`
      );
    } else {
      console.warn(`[Keep-Alive] Heartbeat warning: ${endpoint} returned HTTP ${res.status}`);
    }
  } catch (err: any) {
    console.warn(`[Keep-Alive] Heartbeat ping encountered an exception:`, err?.message || err);
  }
}
