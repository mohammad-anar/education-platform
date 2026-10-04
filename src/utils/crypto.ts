import bcrypt from "bcryptjs";
import crypto from "crypto";
import slugifyPkg from "slugify";
import env from "../config/env.js";

// Safe slugify helper
const slugify = (slugifyPkg as any).default || slugifyPkg;

export const cryptoHelper = {
  /**
   * Hash password using bcrypt
   */
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = env.bcrypt_salt_round || 10;
    return bcrypt.hash(password, saltRounds);
  },

  /**
   * Compare plaintext password with hashed password
   */
  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate cryptographically secure random token (hex string)
   */
  generateRandomToken: (byteLength = 32): string => {
    return crypto.randomBytes(byteLength).toString("hex");
  },

  /**
   * Generate cryptographically secure numeric OTP
   */
  generateOTP: (length = 6): string => {
    const digits = "0123456789";
    let otp = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      otp += digits[randomBytes[i] % 10];
    }
    return otp;
  },

  /**
   * Generate UUID v4
   */
  generateUUID: (): string => {
    return crypto.randomUUID();
  },

  /**
   * Generate URL friendly slug from string
   */
  generateSlug: (text: string): string => {
    return slugify(text, {
      lower: true,
      strict: true,
      trim: true,
    });
  },

  /**
   * Hash data with HMAC SHA-256 (useful for webhooks, signatures)
   */
  generateHmacSha256: (data: string, secret: string): string => {
    return crypto.createHmac("sha256", secret).update(data).digest("hex");
  },

  /**
   * Mask email for privacy (e.g., a***n@example.com)
   */
  maskEmail: (email: string): string => {
    const [name, domain] = email.split("@");
    if (!domain) return email;
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  },

  /**
   * Mask phone number (e.g., +88017*****89)
   */
  maskPhone: (phone: string): string => {
    if (phone.length <= 4) return phone;
    const start = phone.slice(0, 3);
    const end = phone.slice(-2);
    return `${start}*****${end}`;
  },
};

export default cryptoHelper;
