import dns from 'dns';

// Ensure IPv4 resolution preference for external API reliability in Node.js
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignored in non-Node or restricted environments
}

export interface BrevoEmailParams {
  toEmail: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface BrevoEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends a transactional email using the Brevo (Sendinblue) API v3.
 */
export async function sendBrevoEmail(params: BrevoEmailParams): Promise<BrevoEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[Brevo] Missing BREVO_API_KEY environment variable.');
    return {
      success: false,
      error: 'BREVO_API_KEY is not configured in environment variables.',
    };
  }

  const senderEmail =
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    'rachit4yadav14@gmail.com';
  const senderName = 'CivicPulse Portal';

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail,
    },
    to: [
      {
        email: params.toEmail.trim(),
        name: params.toName?.trim() || 'Citizen',
      },
    ],
    subject: params.subject,
    htmlContent: params.htmlContent,
    ...(params.textContent ? { textContent: params.textContent } : {}),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg =
        data?.message ||
        data?.error ||
        `Brevo API returned HTTP status ${res.status}`;
      console.error('[Brevo Error]', errorMsg, data);
      return { success: false, error: errorMsg };
    }

    return {
      success: true,
      messageId: data?.messageId,
    };
  } catch (err: any) {
    console.error('[Brevo Exception]', err);
    return {
      success: false,
      error: err?.message || 'Network exception connecting to Brevo SMTP service.',
    };
  }
}

/**
 * Generates and dispatches a high-polish CivicPulse OTP verification email.
 */
export async function sendOtpEmail(options: {
  toEmail: string;
  otp: string;
  recipientName?: string;
}): Promise<BrevoEmailResult> {
  const { toEmail, otp, recipientName } = options;
  const greeting = recipientName?.trim() ? `Hello ${recipientName.trim()},` : 'Hello Citizen,';

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your CivicPulse Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #171717;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8F9FA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 10px 25px rgba(0,0,0,0.04); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: left; border-bottom: 1px solid #F3F4F6;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #0A0A0A; color: #FFFFFF; font-weight: 800; font-size: 14px; letter-spacing: -0.5px; width: 36px; height: 36px; text-align: center; border-radius: 10px; vertical-align: middle;">
                    CP
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle;">
                    <span style="font-weight: 700; font-size: 18px; color: #0A0A0A; letter-spacing: -0.3px;">CivicPulse</span>
                    <span style="display: block; font-size: 11px; color: #737373;">Public Infrastructure &amp; Grievance Network</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #171717; font-weight: 500;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; color: #525252; line-height: 1.6;">
                Use the verification code below to complete your sign-in to the CivicPulse portal. This code will expire in <strong>10 minutes</strong>.
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #F8F9FA; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px 16px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; color: #737373; display: block; margin-bottom: 8px;">Your Verification Code</span>
                    <span style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0A0A0A; display: inline-block; padding-left: 8px;">${otp}</span>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0; font-size: 12px; color: #737373; line-height: 1.5;">
                <strong>Security Notice:</strong> Never share this code with anyone. Municipal officers will never ask for your verification code. If you did not request this login code, you can safely disregard this message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FAFAFA; border-top: 1px solid #F3F4F6; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #A3A3A3; line-height: 1.4;">
                CivicPulse Autonomous Infrastructure Grievance Network<br>
                Secured with HMAC-SHA256 &amp; Brevo Transactional Relays
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const textContent = `
CivicPulse - Public Infrastructure & Grievance Network

${greeting}

Your one-time verification code is: ${otp}

This code will expire in 10 minutes.
If you did not request this code, you can safely ignore this email.
  `.trim();

  return sendBrevoEmail({
    toEmail,
    toName: recipientName,
    subject: `${otp} is your CivicPulse verification code`,
    htmlContent,
    textContent,
  });
}
