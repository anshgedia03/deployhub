import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
// Use the ENCRYPTION_KEY from env, falling back to a raw key conversion if it's not a valid 32-byte hex string
let key: Buffer;
try {
  key = Buffer.from(env.ENCRYPTION_KEY, 'hex');
  if (key.length !== 32) {
    key = crypto.scryptSync(env.ENCRYPTION_KEY, 'salt', 32);
  }
} catch {
  key = crypto.scryptSync(env.ENCRYPTION_KEY || 'default-salt-key', 'salt', 32);
}

const IV_LENGTH = 16;

export function encrypt(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return '';
  const textParts = text.split(':');
  const ivHex = textParts.shift();
  if (!ivHex) throw new Error('Invalid encrypted format');
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
