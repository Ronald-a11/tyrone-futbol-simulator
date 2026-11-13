import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

import shipped from "./vapid.json" with { type: "json" };

const require = createRequire(import.meta.url);
// @ts-ignore web-push has no bundled types
const webpush = require("web-push");

const runtimeFile = join(process.cwd(), ".data", "vapid.json");

/** @param {string} value */
function decodeBase64Url(value) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

/** @param {{ publicKey?: string, privateKey?: string } | null | undefined} keys */
export function isVapidPair(keys) {
  if (!keys?.publicKey || !keys.privateKey) return false;
  try {
    const pub = decodeBase64Url(keys.publicKey);
    const priv = decodeBase64Url(keys.privateKey);
    return pub.length === 65 && pub[0] === 0x04 && priv.length === 32;
  } catch {
    return false;
  }
}

/** @param {Uint8Array | Buffer} bytes */
function encodeBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

/**
 * Mint a P-256 VAPID pair with Web Crypto, then prove it can sign and verify
 * an ES256 JWT the way a push service checks the Authorization header.
 */
export async function generateVapidWithWebCrypto() {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const rawPub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
  const privateKey = typeof jwk.d === "string" ? jwk.d : "";
  const keys = { publicKey: encodeBase64Url(rawPub), privateKey };
  if (!isVapidPair(keys)) throw new Error("VAPID key generation failed");
  const header = encodeBase64Url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const payload = encodeBase64Url(
    Buffer.from(
      JSON.stringify({
        aud: "https://fcm.googleapis.com",
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: "mailto:desk@tyrone.local",
      }),
    ),
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, pair.privateKey, data);
  const signed = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pair.publicKey, sig, data);
  const imported = await crypto.subtle.importKey("raw", rawPub, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
  const roundTrip = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, imported, sig, data);
  if (!signed || !roundTrip) throw new Error("VAPID signature check failed");
  return keys;
}

/** @param {{ publicKey: string, privateKey: string }} keys @param {string} previousPublicKey @param {string} [file] */
export function saveVapidPair(keys, previousPublicKey, file = runtimeFile) {
  if (!isVapidPair(keys)) return false;
  try {
    mkdirSync(dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    writeFileSync(
      tmp,
      JSON.stringify({
        publicKey: keys.publicKey,
        privateKey: keys.privateKey,
        createdAt: Date.now(),
        previousPublicKey: previousPublicKey || "",
      }),
      { mode: 0o600 },
    );
    renameSync(tmp, file);
    return true;
  } catch {
    return false;
  }
}
export function generateVapidPair() {
  const made = webpush.generateVAPIDKeys();
  if (!isVapidPair(made)) throw new Error("VAPID key generation failed");
  return { publicKey: String(made.publicKey), privateKey: String(made.privateKey) };
}

/** @param {{ publicKey: string, privateKey: string }} keys */
function persist(keys) {
  try {
    mkdirSync(dirname(runtimeFile), { recursive: true });
    const tmp = `${runtimeFile}.tmp`;
    writeFileSync(tmp, JSON.stringify({ publicKey: keys.publicKey, privateKey: keys.privateKey }), { mode: 0o600 });
    renameSync(tmp, runtimeFile);
    return true;
  } catch {
    return false;
  }
}

function readRuntime() {
  try {
    const saved = JSON.parse(readFileSync(runtimeFile, "utf8"));
    if (isVapidPair(saved)) return { publicKey: saved.publicKey, privateKey: saved.privateKey };
  } catch {
    /* no saved pair yet */
  }
  return null;
}

export function resolveVapid() {
  const fromEnv = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  if (isVapidPair(fromEnv)) {
    return { publicKey: String(fromEnv.publicKey), privateKey: String(fromEnv.privateKey), source: "env" };
  }
  const saved = readRuntime();
  if (saved) return { ...saved, source: "file" };
  if (isVapidPair(shipped)) {
    persist(shipped);
    return { publicKey: shipped.publicKey, privateKey: shipped.privateKey, source: "shipped" };
  }
  const made = generateVapidPair();
  const wrote = persist(made);
  return { ...made, source: wrote ? "generated" : "memory" };
}
