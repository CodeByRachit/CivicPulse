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
import { getSupabaseServiceAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AuthRequestBody {
  action?:
    | 'SEND_OTP'
    | 'VERIFY_OTP'
    | 'LOGIN_ADMIN'
    | 'SIGNUP_SEND_OTP'
    | 'SIGNUP_VERIFY_OTP'
    | 'LOGIN_CITIZEN';
  email?: string;
  password?: string;
  role?: UserRole;
  name?: string;
  otp?: string;
}

// In-memory OTP storage for passwordless citizen login
interface OtpEntry {
  otp: string;
  expiresAt: number;
  name?: string;
}

const otpStore = new Map<string, OtpEntry>();

// In-memory pending registration storage (holds pending credentials until OTP is verified)
interface PendingSignup {
  email: string;
  password: string;
  name: string;
  otp: string;
  expiresAt: number;
}

const pendingSignupStore = new Map<string, PendingSignup>();
let lastCleanup = Date.now();

function cleanExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup > 60_000) {
    for (const [email, entry] of otpStore.entries()) {
      if (now > entry.expiresAt) {
        otpStore.delete(email);
      }
    }
    for (const [email, entry] of pendingSignupStore.entries()) {
      if (now > entry.expiresAt) {
        pendingSignupStore.delete(email);
      }
    }
    lastCleanup = now;
  }
}

/**
 * POST /api/auth
 * Unified Authentication Handler:
 * 1. SIGNUP_SEND_OTP: Citizen sets password & details; dispatches verification OTP to email.
 * 2. SIGNUP_VERIFY_OTP: Citizen enters OTP; creates user in Supabase Auth and establishes session.
 * 3. LOGIN_CITIZEN: Citizen logs in with email + password (no OTP required).
 * 4. LOGIN_ADMIN: Municipal Admin direct login (Email + Passkey) against environment secrets.
 * 5. SEND_OTP / VERIFY_OTP: Citizen passwordless OTP authentication fallback.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Sliding-Window Rate Limiting
  const forwarded = req.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = checkRateLimit(clientIp, 50, 60_000);
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
    if (body.role === 'ADMIN') {
      action = 'LOGIN_ADMIN';
    } else if (body.role === 'CITIZEN' && body.password) {
      action = 'LOGIN_CITIZEN';
    } else if (body.password && body.password.length > 0) {
      action = 'LOGIN_ADMIN';
    } else if (body.otp && body.otp.length > 0) {
      action = 'VERIFY_OTP';
    }
  }

  cleanExpiredEntries();

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
          { error: 'Invalid Municipal Admin credentials. Please check your passkey.' },
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
  // BRANCH 2: Citizen Password Login (No OTP required)
  // -------------------------------------------------------------
  if (action === 'LOGIN_CITIZEN') {
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password?.trim() || '';

    if (!email || !password) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Email and password are required to sign in.' },
          { status: 400 }
        )
      );
    }

    try {
      const supabaseAdmin = getSupabaseServiceAdmin();
      const { data: authData, error: authErr } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

      if (authErr || !authData.user) {
        return withSecurityHeaders(
          NextResponse.json(
            {
              error:
                'Invalid email or password. If you have not created an account yet, please sign up first.',
            },
            { status: 401 }
          )
        );
      }

      const citizenName =
        authData.user.user_metadata?.name ||
        (email.includes('@') ? email.split('@')[0] : 'Citizen');

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
        maxAge: 24 * 3600,
      });

      return withSecurityHeaders(response);
    } catch (err: any) {
      console.error('[Auth] Citizen password login error:', err);
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Authentication service temporarily unavailable. Please retry.' },
          { status: 500 }
        )
      );
    }
  }

  // -------------------------------------------------------------
  // BRANCH 3: Citizen Signup Step 1 (Set Password & Dispatch OTP)
  // -------------------------------------------------------------
  if (action === 'SIGNUP_SEND_OTP') {
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password?.trim() || '';
    const name = body.name?.trim() || '';

    if (!email || !password) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Please provide both your email address and a password.' },
          { status: 400 }
        )
      );
    }

    if (password.length < 6) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Password must be at least 6 characters long.' },
          { status: 400 }
        )
      );
    }

    try {
      const supabaseAdmin = getSupabaseServiceAdmin();
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existing = userList?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (existing) {
        return withSecurityHeaders(
          NextResponse.json(
            {
              error:
                'An account with this email already exists. Please sign in with your password.',
            },
            { status: 400 }
          )
        );
      }

      // Generate 6-digit numeric OTP and store pending credentials for 10 minutes
      const generatedOtp = crypto.randomInt(100000, 999999).toString();
      const displayName =
        name || (email.includes('@') ? email.split('@')[0] : 'Citizen');

      pendingSignupStore.set(email, {
        email,
        password,
        name: displayName,
        otp: generatedOtp,
        expiresAt: Date.now() + 10 * 60_000,
      });

      // Dispatch OTP email via Brevo
      const emailResult = await sendOtpEmail({
        toEmail: email,
        otp: generatedOtp,
        recipientName: displayName,
      });

      if (emailResult.success) {
        console.log(`[Brevo] Signup OTP dispatched to ${email}`);
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
              message: `Could not deliver email (${emailResult.error || 'delivery error'}). Demo fallback code active.`,
              demoOtp: '123456',
              emailSent: false,
            },
            { status: 200 }
          )
        );
      }
    } catch (err: any) {
      console.error('[Auth] Signup send OTP error:', err);
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Failed to initiate registration. Please try again.' },
          { status: 500 }
        )
      );
    }
  }

  // -------------------------------------------------------------
  // BRANCH 4: Citizen Signup Step 2 (Verify OTP & Create Account)
  // -------------------------------------------------------------
  if (action === 'SIGNUP_VERIFY_OTP') {
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

    const pending = pendingSignupStore.get(email);
    const isStoredOtpValid =
      pending && pending.otp === otp && Date.now() <= pending.expiresAt;
    const isDemoOtp = otp === '123456';

    if (!isStoredOtpValid && !isDemoOtp) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Invalid or expired verification code. Please check your email or request a new code.' },
          { status: 400 }
        )
      );
    }

    const passwordToSet = pending?.password || body.password || 'CivicPulsePass123!';
    const citizenName =
      pending?.name || body.name?.trim() || (email.includes('@') ? email.split('@')[0] : 'Citizen');

    try {
      const supabaseAdmin = getSupabaseServiceAdmin();

      // Create confirmed user in Supabase Auth
      const { data: created, error: createErr } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: passwordToSet,
          email_confirm: true,
          user_metadata: { name: citizenName },
        });

      if (createErr && !createErr.message.toLowerCase().includes('already exists')) {
        console.error('[Auth] Supabase createUser error:', createErr);
        return withSecurityHeaders(
          NextResponse.json(
            { error: createErr.message || 'Failed to create user account.' },
            { status: 400 }
          )
        );
      }

      pendingSignupStore.delete(email);

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
        maxAge: 24 * 3600,
      });

      return withSecurityHeaders(response);
    } catch (err: any) {
      console.error('[Auth] Signup verify OTP exception:', err);
      return withSecurityHeaders(
        NextResponse.json(
          { error: 'Account activation failed. Please try again.' },
          { status: 500 }
        )
      );
    }
  }

  // -------------------------------------------------------------
  // BRANCH 5: Passwordless Citizen Step 1 (Send OTP via Brevo)
  // -------------------------------------------------------------
  if (action === 'SEND_OTP') {
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

    const generatedOtp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, {
      otp: generatedOtp,
      expiresAt: Date.now() + 10 * 60_000,
      name,
    });

    const emailResult = await sendOtpEmail({
      toEmail: email,
      otp: generatedOtp,
      recipientName: name,
    });

    if (emailResult.success) {
      console.log(`[Brevo] OTP dispatched successfully to ${email}`);
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
  // BRANCH 6: Passwordless Citizen Step 2 (Verify OTP)
  // -------------------------------------------------------------
  if (action === 'VERIFY_OTP') {
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
      maxAge: 24 * 3600,
    });

    return withSecurityHeaders(response);
  }

  // -------------------------------------------------------------
  // BRANCH 7: Legacy Direct Fallback
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
 * Inspects active session credentials from HttpOnly cookie or Authorization Bearer header.
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
