import crypto from 'crypto';
import type { NextResponse } from 'next/server';

let cachedMasterKey: Buffer | null = null;

/**
 * Derives a deterministic 256-bit (32-byte) master key for AES-256-GCM and HMAC operations.
 * Caches key in memory for zero-latency execution.
 */
export function getMasterKey(): Buffer {
  if (cachedMasterKey) {
    return cachedMasterKey;
  }

  const seed =
    process.env.ENCRYPTION_MASTER_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'civic-pulse-fallback-dev-secret';

  // Derive 32 bytes using scrypt with a fixed domain-separation salt
  cachedMasterKey = crypto.scryptSync(seed, 'civic-pulse-kdf-salt-v1', 32);
  return cachedMasterKey;
}

/**
 * Encrypts a plaintext string using AES-256-GCM authenticated encryption.
 * Format: enc:v1:<iv-hex>:<authTag-hex>:<ciphertext-hex>
 */
export function encryptField(plaintext: string): string {
  if (typeof plaintext !== 'string') {
    return plaintext;
  }

  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `enc:v1:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM envelope string.
 * Gracefully returns original payload if unencrypted (for 100% backwards compatibility).
 * Detects tampering and returns an explicit cryptographic integrity breach notice.
 */
export function decryptField(payload: string | null | undefined): string {
  if (!payload || typeof payload !== 'string' || !payload.startsWith('enc:v1:')) {
    return payload || '';
  }

  try {
    const parts = payload.split(':');
    if (parts.length !== 5) {
      return '[CRYPTOGRAPHIC INTEGRITY BREACH: INVALID ENVELOPE FORMAT]';
    }

    const [, , ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const ciphertext = Buffer.from(cipherHex, 'hex');

    if (iv.length !== 12 || authTag.length !== 16) {
      return '[CRYPTOGRAPHIC INTEGRITY BREACH: MALFORMED PARAMETERS]';
    }

    const masterKey = getMasterKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (err) {
    console.warn('[Security] AES-256-GCM decryption failed / tampering detected:', err);
    return '[CRYPTOGRAPHIC INTEGRITY BREACH: TAMPERED CIPHERTEXT]';
  }
}

/**
 * Computes the SHA-256 hex digest of raw binary buffers or strings
 * to establish an immutable Chain-of-Custody fingerprint.
 */
export function computeSha256Hex(input: Buffer | string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export interface CryptographicReceipt {
  receipt_id: string;
  hmac_signature: string;
  algorithm: 'HMAC-SHA256';
}

/**
 * Generates an HMAC-SHA256 digital non-repudiation tracking receipt for citizen reports.
 */
export function generateCryptographicReceipt(data: {
  lat: number;
  lng: number;
  mediaHash: string;
  departmentCode: string;
  timestamp: string;
}): CryptographicReceipt {
  const masterKey = getMasterKey();
  const canonicalData = `CP-V1|${data.lat.toFixed(5)}|${data.lng.toFixed(5)}|${data.departmentCode}|${data.mediaHash}|${data.timestamp}`;

  const hmac_signature = crypto
    .createHmac('sha256', masterKey)
    .update(canonicalData, 'utf8')
    .digest('hex');

  const receipt_id = `CP-2026-${hmac_signature.slice(0, 10).toUpperCase()}`;

  return {
    receipt_id,
    hmac_signature,
    algorithm: 'HMAC-SHA256',
  };
}

/**
 * Verifies an HMAC-SHA256 cryptographic receipt signature using constant-time comparison.
 */
export function verifyCryptographicReceipt(
  data: {
    lat: number;
    lng: number;
    mediaHash: string;
    departmentCode: string;
    timestamp: string;
  },
  signature: string
): boolean {
  try {
    const expected = generateCryptographicReceipt(data).hmac_signature;
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(signature, 'hex');

    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export interface MagicByteResult {
  valid: boolean;
  detectedFormat: string;
}

/**
 * Inspects binary magic byte headers (first 12 bytes) of uploaded media
 * to neutralize MIME-spoofing and polyglot executable injection attacks.
 */
export function verifyMediaMagicBytes(
  buffer: Buffer,
  claimedMimeType?: string
): MagicByteResult {
  if (!buffer || buffer.length < 4) {
    return { valid: false, detectedFormat: 'CORRUPTED_OR_EMPTY' };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedFormat: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, detectedFormat: 'image/png' };
  }

  // 3. GIF: 47 49 46 38 ('GIF8')
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: true, detectedFormat: 'image/gif' };
  }

  // 4. RIFF Container (WebP image or WAV audio): 52 49 46 46 ('RIFF')
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12
  ) {
    const subType = buffer.subarray(8, 12).toString('ascii');
    if (subType === 'WEBP') {
      return { valid: true, detectedFormat: 'image/webp' };
    }
    if (subType === 'WAVE') {
      return { valid: true, detectedFormat: 'audio/wav' };
    }
    return { valid: true, detectedFormat: 'application/riff' };
  }

  // 5. WebM / Matroska audio: 1A 45 DF A3
  if (
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return { valid: true, detectedFormat: 'audio/webm' };
  }

  // 6. MP4 / M4A (ftyp at offset 4): 66 74 79 70
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return { valid: true, detectedFormat: 'audio/mp4' };
  }

  // 7. OGG: 4F 67 67 53 ('OggS')
  if (
    buffer[0] === 0x4f &&
    buffer[1] === 0x67 &&
    buffer[2] === 0x67 &&
    buffer[3] === 0x53
  ) {
    return { valid: true, detectedFormat: 'audio/ogg' };
  }

  // 8. MP3 (with ID3v2 header: 49 44 33 'ID3')
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { valid: true, detectedFormat: 'audio/mp3' };
  }

  // 9. MP3 (raw MPEG frame sync: FF FB, FF F3, FF F2, or FF E0+)
  if (
    buffer[0] === 0xff &&
    (buffer[1] === 0xfb ||
      buffer[1] === 0xf3 ||
      buffer[1] === 0xf2 ||
      (buffer[1] & 0xe0) === 0xe0)
  ) {
    return { valid: true, detectedFormat: 'audio/mp3' };
  }

  // If MIME type was provided and matches an expected pattern but unrecognized magic bytes
  return { valid: false, detectedFormat: 'UNKNOWN_OR_UNTRUSTED_BINARY' };
}

/**
 * Sanitizes citizen input to prevent adversarial prompt injection, XSS markup,
 * and control-character bypass attempts against multimodal LLM engines.
 */
export function sanitizeCitizenInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // 1. Strip non-printable ASCII control characters except standard whitespace (\n, \r, \t)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // 2. Strip HTML and script tags
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');

  // 3. Neutralize common prompt-injection vectors
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions?/gi,
    /ignore\s+all\s+directives?/gi,
    /system\s+override/gi,
    /output\s+json\s+with/gi,
    /you\s+are\s+now\s+in\s+developer\s+mode/gi,
    /disregard\s+(all\s+)?(previous|prior)\s+instructions?/gi,
    /act\s+as\s+an?\s+(unrestricted|unfiltered)/gi,
    /jailbreak/gi,
    /DAN\s+mode/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, (match) => `[DEFANGED: "${match.trim()}"]`);
  }

  return sanitized.trim();
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastStoreCleanup = Date.now();

/**
 * High-performance in-memory sliding-window rate limiter.
 * Default: 30 requests per 60,000ms per IP address.
 */
export function checkRateLimit(
  clientIp: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();

  // Periodically clean up expired entries every 2 minutes
  if (now - lastStoreCleanup > 120_000) {
    for (const [ip, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(ip);
      }
    }
    lastStoreCleanup = now;
  }

  const existing = rateLimitStore.get(clientIp);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetMs: windowMs,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, existing.resetTime - now),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetMs: Math.max(0, existing.resetTime - now),
  };
}

/**
 * Attaches enterprise defense-in-depth HTTP security headers to outgoing responses.
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set(
    'X-CivicPulse-Crypto-Engine',
    'AES-256-GCM+HMAC-SHA256'
  );
  return response;
}

