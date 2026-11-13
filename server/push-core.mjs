import { createRequire } from "node:module";
import { resolveVapid, generateVapidWithWebCrypto, saveVapidPair } from "./vapid.mjs";

const require = createRequire(import.meta.url);
// @ts-ignore web-push has no bundled types
const webpush = require("web-push");
// @ts-ignore web-push encryption helper has no bundled types
const encryptionHelper = require("web-push/src/encryption-helper");

const resolved = resolveVapid();
const active = { publicKey: resolved.publicKey, privateKey: resolved.privateKey, source: resolved.source };
let lastRotate = 0;

/** @param {{ publicKey: string, privateKey: string }} next */
function useKeys(next) {
  active.publicKey = next.publicKey;
  active.privateKey = next.privateKey;
  webpush.setVapidDetails("mailto:desk@tyrone.local", active.publicKey, active.privateKey);
}

useKeys(active);

const ALLOWED_HOSTS = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
  "wns.windows.com",
];

const lastSent = new Map();

// RFC 8030 TTL, Urgency, and Topic. Topic is URL-safe and at most 32 characters.
// A newer message with the same topic replaces one the push service has not delivered yet.
// The body is encrypted with RFC 8291 aes128gcm. The private VAPID key never leaves the server.
const PUSH = {
  goal: { ttl: 600, urgency: "high", topic: "tyrone-score" },
  warn: { ttl: 86400, urgency: "high", topic: "tyrone-bid" },
  info: { ttl: 3600, urgency: "normal", topic: "tyrone-desk" },
};

/** @param {string | undefined} tone */
export function pushPolicy(tone) {
  if (tone === "goal" || tone === "warn") return PUSH[tone];
  return PUSH.info;
}

/** @param {string} endpoint */
function hostAllowed(endpoint) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return ALLOWED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

export function vapidPublic() {
  return active.publicKey;
}

export async function rotateVapid() {
  if (active.source === "env") return { ok: false, status: 409, error: "locked" };
  const now = Date.now();
  if (now - lastRotate < 20000) return { ok: false, status: 429, error: "retry" };
  lastRotate = now;
  const previousPublicKey = active.publicKey;
  try {
    const made = await generateVapidWithWebCrypto();
    const persisted = saveVapidPair(made, previousPublicKey);
    useKeys(made);
    active.source = persisted ? "file" : "memory";
    return { ok: true, status: 200, publicKey: made.publicKey, previousPublicKey, persisted };
  } catch {
    lastRotate = 0;
    return { ok: false, status: 500, error: "rotate failed" };
  }
}

/** RFC 8188 header: 16-byte salt, record size, id length, then the sender's uncompressed P-256 key. */
/** @param {Buffer | Uint8Array} bytes */
export function inspectAes128gcm(bytes) {
  const body = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  if (body.length < 16 + 4 + 1 + 65 + 16) return null;
  const rs = body.readUInt32BE(16);
  const idlen = body[20];
  if (rs <= 17 || idlen !== 65 || body[21] !== 0x04) return null;
  if (body.length < 21 + idlen + 16) return null;
  return { encoding: "aes128gcm", saltBytes: 16, rs, idlen };
}

/** @param {string} p256dh @param {string} auth @param {string} payload */
export function sealPush(p256dh, auth, payload) {
  const sealed = encryptionHelper.encrypt(p256dh, auth, payload, "aes128gcm");
  const info = inspectAes128gcm(sealed.cipherText);
  if (!info) throw new Error("aes128gcm framing failed");
  return info;
}

/** @param {{ title?: string, body?: string, tone?: string, subscription?: { endpoint?: string, keys?: { p256dh?: string, auth?: string } } }} raw */
export async function deliver(raw) {
  const title = String(raw?.title ?? "").trim().slice(0, 80);
  const body = String(raw?.body ?? "").trim().slice(0, 180);
  const policy = pushPolicy(raw?.tone);
  const endpoint = raw?.subscription?.endpoint;
  const p256dh = raw?.subscription?.keys?.p256dh;
  const auth = raw?.subscription?.keys?.auth;
  if (!title || !body) return { ok: false, status: 400, error: "missing copy" };
  if (!endpoint || !p256dh || !auth || !hostAllowed(endpoint)) {
    return { ok: false, status: 400, error: "bad endpoint" };
  }
  const now = Date.now();
  const bucket = `${endpoint}|${policy.topic}`;
  const prev = lastSent.get(bucket) ?? 0;
  if (now - prev < 1200) {
    return { ok: true, status: 202, skipped: true, ...policy, encoding: "aes128gcm" };
  }
  lastSent.set(bucket, now);
  const payload = JSON.stringify({ title, body, tag: policy.topic, urgency: policy.urgency, ts: now });
  let sealed;
  try {
    sealed = sealPush(p256dh, auth, payload);
  } catch {
    lastSent.delete(bucket);
    return { ok: false, status: 400, error: "bad key" };
  }
  try {
    await webpush.sendNotification(
      { endpoint, keys: { p256dh, auth } },
      payload,
      { TTL: policy.ttl, urgency: policy.urgency, topic: policy.topic, contentEncoding: "aes128gcm" },
    );
    return { ok: true, status: 201, ...policy, encoding: sealed.encoding, rs: sealed.rs, idlen: sealed.idlen };
  } catch (err) {
    const status = Number(err && typeof err === "object" && "statusCode" in err ? err.statusCode : 0) || 502;
    if (status === 404 || status === 410 || status === 429) lastSent.delete(bucket);
    const error = status === 404 || status === 410 ? "gone" : status === 429 ? "retry" : "push failed";
    return { ok: false, status, error };
  }
}
