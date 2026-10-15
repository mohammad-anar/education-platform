import crypto from "crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encodes a buffer into an RFC 4648 Base32 string (uppercase, no padding).
 *
 * @param {Buffer} buffer - The buffer to encode.
 * @returns {string} Base32 encoded string.
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes an RFC 4648 Base32 string back into a Buffer.
 *
 * @param {string} str - The Base32 encoded string.
 * @returns {Buffer} Decoded binary buffer.
 */
export function base32Decode(str: string): Buffer {
  const cleaned = str.toUpperCase().replace(/=+$/, "").replace(/[\s-]/g, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) {
      continue;
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Computes an RFC 4226 HOTP dynamic truncation code for a counter value.
 *
 * @param {Buffer} secretBuffer - Binary secret key.
 * @param {number} counter - Counter step (integer).
 * @param {number} digits - Code length (default 6).
 * @returns {string} Formatted 6-digit zero-padded OTP.
 */
export function generateHotp(secretBuffer: Buffer, counter: number, digits = 6): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac("sha1", secretBuffer).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;

  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const modulus = Math.pow(10, digits);
  return (code % modulus).toString().padStart(digits, "0");
}

export interface ITotpSecretResult {
  secret: string;
  otpauthUrl: string;
}

/**
 * Generates a cryptographically secure 20-byte Base32 secret and an otpauth URI.
 *
 * @param {string} email - The user's email address or identifier.
 * @param {string} [issuer="EduPlatform"] - The name of the organization/issuer.
 * @returns {ITotpSecretResult} Base32 secret and otpauth URI.
 */
export function generateTotpSecret(email: string, issuer = "EduPlatform"): ITotpSecretResult {
  const randomBuffer = crypto.randomBytes(20);
  const secret = base32Encode(randomBuffer);
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);

  const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

  return {
    secret,
    otpauthUrl,
  };
}

/**
 * Verifies a 6-digit TOTP token against a Base32 secret.
 * Supports a window parameter (default 1 = +/- 30 seconds drift).
 *
 * @param {string} token - The 6-digit token to verify.
 * @param {string} secret - The Base32 encoded secret.
 * @param {number} [window=1] - Counter step drift window.
 * @param {number} [timestamp=Date.now()] - Timestamp to evaluate against.
 * @returns {boolean} True if token is valid within the time window.
 */
export function verifyTotp(
  token: string,
  secret: string,
  window = 1,
  timestamp = Date.now(),
): boolean {
  if (!token || !secret) return false;
  const sanitizedToken = token.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(sanitizedToken)) return false;

  const secretBuffer = base32Decode(secret);
  if (secretBuffer.length === 0) return false;

  const stepSeconds = 30;
  const currentStep = Math.floor(timestamp / 1000 / stepSeconds);

  for (let delta = -window; delta <= window; delta++) {
    const candidateCounter = currentStep + delta;
    const generated = generateHotp(secretBuffer, candidateCounter, 6);
    if (generated === sanitizedToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an array of secure random backup codes (format: xxxx-xxxx).
 *
 * @param {number} [count=8] - Number of backup codes to generate.
 * @returns {string[]} List of backup codes.
 */
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = crypto.randomBytes(4).toString("hex");
    const code = `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`.toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hashes a backup code using SHA-256 for secure storage.
 *
 * @param {string} code - Plaintext backup code.
 * @returns {string} SHA-256 hex string.
 */
export function hashBackupCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[\s-]/g, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export default {
  base32Encode,
  base32Decode,
  generateHotp,
  generateTotpSecret,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
};
