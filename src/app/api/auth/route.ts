import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  signSessionToken,
  verifySessionToken,
  withSecurityHeaders,
  type UserRole,
} from '@/lib/security';
import { sendOtpEmail } from '@/lib/brevo';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AuthRequestBody {
  action?: 'SEND_OTP' | 'VERIFY_OTP' | 'LOGIN_ADMIN';
  email?: string;
  password?: string;
  role?: UserRole;
  name?: string;
  otp?: string;
}

// In-memory OTP storage for citizen verification
interface OtpEntry {
  otp: string;
  expiresAt: number;
  name?: string;
}

const otpStore = new Map<string, OtpEntry>();
let lastOtpCleanup = Date.now();

function cleanExpiredOtps() {
  const now = Date.now();
  if (now - lastOtpCleanup > 60_000) {
    for (const [email, entry] of otpStore.entries()) {
      if (now > entry.expiresAt) {
        otpStore.delete(email);
      }
    }
    lastOtpCleanup = now;
  }
}

/**
 * POST /api/auth
 * Split Authentication Handler:
 * 1. LOGIN_ADMIN: Direct 1-step login (Email + Password) verified against environment variables.
 * 2. SEND_OTP: Step 1 for Citizens, generates and stores a 6-digit verification code.
 * 3. VERIFY_OTP: Step 2 for Citizens, verifies code (or 123456 demo fallback) and issues session.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Sliding-Window Rate Limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = checkRateLimit(clientIp, 40, 60_000);
  if (!rateLimit.allowed) {
    return withSecurityHeaders(
      NextResponse.json(
        { error: 'Too Many Requests: Rate limit exceeded. Please wait before retrying.' },
        { status: 429 }
      )
    );
  }

  let body: AuthRequestBody;
  try {
    body = await req.json();
  } catch {
    return withSecurityHeaders(
      NextResponse.json(
        { error: 'Invalid Request: Expected JSON body with authentication parameters.' },
        { status: 400 }
      )
    );
  }

  // Determine intended action with backwards-compatible defaults
  let action = body.action;
  if (!action) {
    if (body.role === 'ADMIN' || (body.password && body.password.length > 0)) {
      action = 'LOGIN_ADMIN';
    } else if (body.otp && body.otp.length > 0) {
      action = 'VERIFY_OTP';
    }
  }

  // -------------------------------------------------------------
  // BRANCH 1: Municipal Admin Direct 1-Step Login
  // -------------------------------------------------------------
  if (action === 'LOGIN_ADMIN') {
    const email = body.email?.trim() || '';
    const password = body.password?.trim() || '';

    if (!email || !password) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Both email and password are required for Municipal Admin access.' },
          { status: 400 }
        )
      );
    }

    const expectedEmail = process.env.ADMIN_EMAIL || 'admin@civicpulse.gov.in';
    const expectedPassword =
      process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSKEY || 'ADMIN-2026';

    const providedPassBuf = Buffer.from(password);
    const expectedPassBuf = Buffer.from(expectedPassword);

    const isPasswordValid =
      providedPassBuf.length === expectedPassBuf.length &&
      crypto.timingSafeEqual(providedPassBuf, expectedPassBuf);

    // Accept expected email or accept any email if the exact admin passkey is provided (demo-friendly)
    const isEmailValid =
      email.toLowerCase() === expectedEmail.toLowerCase() || isPasswordValid;

    if (!isPasswordValid || !isEmailValid) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Invalid Municipal Admin credentials.' },
          { status: 401 }
        )
      );
    }

    const adminName = body.name?.trim() || 'Municipal Commissioner';
    const token = signSessionToken({
      sub: email,
      name: adminName,
      role: 'ADMIN',
    });

    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          email,
          name: adminName,
          role: 'ADMIN' as const,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'civic_session',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 3600, // 24 hours
    });

    return withSecurityHeaders(response);
  }

  // -------------------------------------------------------------
  // BRANCH 2: Citizen Step 1 (Send OTP via Brevo Transactional Email)
  // -------------------------------------------------------------
  if (action === 'SEND_OTP') {
    cleanExpiredOtps();
    const email = body.email?.trim().toLowerCase() || '';
    const name = body.name?.trim() || '';

    if (!email) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Email address is required to receive verification code.' },
          { status: 400 }
        )
      );
    }

    // Generate cryptographically random 6-digit numeric OTP
    const generatedOtp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60_000, // 10 minutes validity
      name,
    });

    // Send transactional email via Brevo
    const emailResult = await sendOtpEmail({
      toEmail: email,
      otp: generatedOtp,
      recipientName: name,
    });

    if (emailResult.success) {
      console.log(`[Brevo] OTP dispatched successfully to ${email} (messageId: ${emailResult.messageId})`);
      return withSecurityHeaders(
        NextResponse.json(
          {
            success: true,
            message: `Verification code sent to ${email}. Please check your inbox.`,
            emailSent: true,
          },
          { status: 200 }
        )
      );
    } else {
      console.warn(`[Brevo] Failed to send email to ${email}:`, emailResult.error);
      return withSecurityHeaders(
        NextResponse.json(
          {
            success: true,
            message: `Could not send email (${emailResult.error || 'delivery error'}). Demo fallback active.`,
            demoOtp: '123456',
            emailSent: false,
          },
          { status: 200 }
        )
      );
    }
  }

  // -------------------------------------------------------------
  // BRANCH 3: Citizen Step 2 (Verify OTP)
  // -------------------------------------------------------------
  if (action === 'VERIFY_OTP') {
    cleanExpiredOtps();
    const email = body.email?.trim().toLowerCase() || '';
    const otp = body.otp?.trim() || '';

    if (!email || !otp) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Both email and verification code are required.' },
          { status: 400 }
        )
      );
    }

    const stored = otpStore.get(email);
    const isStoredOtpValid =
      stored && stored.otp === otp && Date.now() <= stored.expiresAt;
    const isDemoOtp = otp === '123456';

    if (!isStoredOtpValid && !isDemoOtp) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Invalid or expired OTP code. (Hint: Use demo code 123456)' },
          { status: 400 }
        )
      );
    }

    if (stored) {
      otpStore.delete(email);
    }

    const citizenName =
      body.name?.trim() ||
      stored?.name ||
      (email.includes('@') ? email.split('@')[0] : 'Verified Citizen');

    const token = signSessionToken({
      sub: email,
      name: citizenName,
      role: 'CITIZEN',
    });

    const response = NextResponse.json(
      {
        authenticated: true,
        user: {
          email,
          name: citizenName,
          role: 'CITIZEN' as const,
        },
        token,
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'civic_session',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 3600, // 24 hours
    });

    return withSecurityHeaders(response);
  }

  // -------------------------------------------------------------
  // BRANCH 4: Legacy Direct Citizen Fallback
  // -------------------------------------------------------------
  const citizenEmail = body.email?.trim() || 'citizen@local';
  const citizenName =
    body.name?.trim() || citizenEmail.split('@')[0] || 'Verified Citizen';

  const token = signSessionToken({
    sub: citizenEmail,
    name: citizenName,
    role: 'CITIZEN',
  });

  const response = NextResponse.json(
    {
      authenticated: true,
      user: {
        email: citizenEmail,
        name: citizenName,
        role: 'CITIZEN' as const,
      },
      token,
    },
    { status: 200 }
  );

  response.cookies.set({
    name: 'civic_session',
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 3600,
  });

  return withSecurityHeaders(response);
}

/**
 * GET /api/auth
 * Inspects active session credentials from either HttpOnly cookie or Authorization Bearer header.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const cookieToken = req.cookies.get('civic_session')?.value;
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const sessionTokenHeader = req.headers.get('x-session-token')?.trim();
  const token = cookieToken || authHeader || sessionTokenHeader;

  const session = verifySessionToken(token);

  if (session) {
    return withSecurityHeaders(
      NextResponse.json(
        {
          authenticated: true,
          user: {
            email: session.sub,
            name: session.name,
            role: session.role,
          },
          expires_at: new Date(session.exp).toISOString(),
        },
        { status: 200 }
      )
    );
  }

  return withSecurityHeaders(
    NextResponse.json(
      {
        authenticated: false,
        user: null,
      },
      { status: 200 }
    )
  );
}

/**
 * DELETE /api/auth
 * Terminates active session and invalidates the HttpOnly session cookie.
 */
export async function DELETE(): Promise<NextResponse> {
  const response = NextResponse.json(
    {
      authenticated: false,
      message: 'Session terminated.',
    },
    { status: 200 }
  );

  response.cookies.set({
    name: 'civic_session',
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return withSecurityHeaders(response);
}
