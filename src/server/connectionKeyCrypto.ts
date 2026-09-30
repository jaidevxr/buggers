import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function getKey(): Buffer {
  const raw = process.env["APP_USER_CONNECTION_KEY_SECRET"];
  if (!raw) {
    throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `APP_USER_CONNECTION_KEY_SECRET must decode to exactly 32 bytes for AES-256-GCM (got ${buf.length} bytes)`,
    );
  }
  return buf;
}

export function encryptConnectionKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptConnectionKey(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  if (buf.length < 28) {
    throw new Error("Invalid ciphertext payload: data too short for AES-GCM");
  }
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/**
 * State token encryption and verification for OAuth CSRF & replay defense.
 */
export interface OAuthStatePayload {
  userId: string;
  nonce: string;
  expiresAt: number;
}

const usedNonces = new Set<string>();

export function createOAuthState(userId: string, ttlMs = 10 * 60 * 1000): string {
  const payload: OAuthStatePayload = {
    userId,
    nonce: randomBytes(16).toString("hex"),
    expiresAt: Date.now() + ttlMs,
  };
  return encryptConnectionKey(JSON.stringify(payload));
}

export function verifyOAuthState(stateStr: string, expectedUserId: string): boolean {
  try {
    const json = decryptConnectionKey(stateStr);
    const parsed: OAuthStatePayload = JSON.parse(json);
    if (!parsed.userId || !parsed.nonce || !parsed.expiresAt) return false;
    if (parsed.userId !== expectedUserId) return false;
    if (Date.now() > parsed.expiresAt) return false;
    if (usedNonces.has(parsed.nonce)) return false; // Replay attack prevented
    usedNonces.add(parsed.nonce);

    // Keep memory clean by pruning old nonces every 100 entries
    if (usedNonces.size > 1000) {
      usedNonces.clear();
    }
    return true;
  } catch {
    return false;
  }
}
