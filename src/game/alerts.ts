import { previewPathPrefix } from "@/lib/preview-path-prefix";

export type AlertTone = "goal" | "info" | "warn";
export type AlertResult = "push" | "local" | "denied" | "unsupported";

export type Toast = {
  id: string;
  title: string;
  body: string;
  tone: AlertTone;
  leaving: boolean;
};

const KEY = "tyrone-futbol-alerts";
const SUB_KEY = "tyrone-futbol-push";
const VAPID_KEY = "tyrone-futbol-vapid-pub";
let items: Toast[] = [];
const listeners = new Set<(next: Toast[]) => void>();
const timers = new Map<string, number>();

function emit() {
  const next = items.slice();
  listeners.forEach((fn) => fn(next));
}

export function subscribeToasts(fn: (next: Toast[]) => void) {
  listeners.add(fn);
  fn(items.slice());
  return () => {
    listeners.delete(fn);
  };
}

function rootPrefix() {
  if (typeof window === "undefined") return "";
  return previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
}

export function alertsEnabled() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function alertPermission(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export function pushSubscribed() {
  return Boolean(loadSub());
}

function loadSub(): PushSubscriptionJSON | null {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PushSubscriptionJSON;
    if (!parsed.endpoint || !parsed.keys?.p256dh || !parsed.keys.auth) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSub(sub: PushSubscriptionJSON | null) {
  try {
    if (!sub) localStorage.removeItem(SUB_KEY);
    else localStorage.setItem(SUB_KEY, JSON.stringify(sub));
  } catch {
    /* ignore */
  }
}

function urlBase64ToUint8Array(value: string) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function acceptVapidKey(value: string) {
  const raw = urlBase64ToUint8Array(value);
  if (raw.length !== 65 || raw[0] !== 4) return false;
  if (!globalThis.crypto?.subtle) return true;
  try {
    await crypto.subtle.importKey("raw", raw, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]);
    return true;
  } catch {
    return false;
  }
}

let watching = false;

function onWorkerMessage(event: MessageEvent) {
  const data = event.data as { type?: string; subscription?: PushSubscriptionJSON } | null;
  if (!data || data.type !== "push-subscription" || !data.subscription?.endpoint || !data.subscription.keys?.p256dh) return;
  saveSub(data.subscription);
}

function watchLifecycle(reg: ServiceWorkerRegistration) {
  if (watching) return;
  watching = true;
  navigator.serviceWorker.addEventListener("message", onWorkerMessage);
  reg.addEventListener("updatefound", () => {
    const next = reg.installing;
    next?.addEventListener("statechange", () => {
      if (next.state === "installed" && navigator.serviceWorker.controller) next.postMessage({ type: "skip-waiting" });
    });
  });
}

function rememberSubscription(reg: ServiceWorkerRegistration, subscription: PushSubscriptionJSON, applicationServerKey: string) {
  const worker = reg.active || reg.waiting || reg.installing;
  worker?.postMessage({ type: "remember-subscription", subscription, applicationServerKey });
}

async function ensureWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const prefix = rootPrefix();
    const shell = import.meta.env.PROD ? "?shell=1" : "";
    const reg = await navigator.serviceWorker.register(`${prefix}/sw.js${shell}`, {
      scope: `${prefix}/`,
      updateViaCache: "none",
    });
    watchLifecycle(reg);
    return reg;
  } catch {
    return null;
  }
}

export async function bootWorker() {
  const reg = await ensureWorker();
  if (!reg) return false;
  try {
    await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "sync-subscription" });
    await loadPublicKey();
    const names = await caches.keys();
    const media = names.find((name) => name.startsWith("tyrone-media-"));
    if (!media) return false;
    const cache = await caches.open(media);
    const keys = await cache.keys();
    return keys.some((request) => request.url.includes("/favicon.svg"));
  } catch {
    return false;
  }
}

async function loadPublicKey() {
  const url = `${rootPrefix()}/api/push/vapid`;
  try {
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { publicKey?: string };
      if (data.publicKey) return data.publicKey;
    }
  } catch {
    /* the cached key is the fallback */
  }
  try {
    const hit = await caches.match(url);
    if (!hit) return null;
    const data = (await hit.json()) as { publicKey?: string };
    return data.publicKey ?? null;
  } catch {
    return null;
  }
}

async function subscribePush(reg: ServiceWorkerRegistration) {
  if (!("pushManager" in reg)) return null;
  const publicKey = await loadPublicKey();
  if (!publicKey || !(await acceptVapidKey(publicKey))) return null;
  let existing = await reg.pushManager.getSubscription();
  let savedKey = "";
  try {
    savedKey = localStorage.getItem(VAPID_KEY) ?? "";
  } catch {
    savedKey = "";
  }
  if (existing && publicKey && savedKey !== publicKey) {
    await existing.unsubscribe();
    existing = null;
    saveSub(null);
  }
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));
  const json = sub.toJSON();
  if (!json.endpoint) return null;
  saveSub(json);
  try {
    localStorage.setItem(VAPID_KEY, publicKey);
  } catch {
    /* the subscription is still stored */
  }
  rememberSubscription(reg, json, publicKey);
  return json;
}

async function sendWebPush(title: string, body: string, sub: PushSubscriptionJSON, tone: AlertTone = "info") {
  try {
    const res = await fetch(`${rootPrefix()}/api/push/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subscription: sub, title, body, tone }),
    });
    if (res.status === 404 || res.status === 410) saveSub(null);
    return res.ok;
  } catch {
    return false;
  }
}

function pushTag(tone: AlertTone) {
  if (tone === "goal") return "tyrone-score";
  if (tone === "warn") return "tyrone-bid";
  return "tyrone-desk";
}

async function localNotify(title: string, body: string, tone: AlertTone) {
  const tag = pushTag(tone);
  try {
    const reg = (await navigator.serviceWorker?.getRegistration()) ?? (await ensureWorker());
    if (reg) {
      await reg.showNotification(title, { body, icon: "/favicon.svg", tag });
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, { body, icon: "/favicon.svg", tag });
  } catch {
    /* the browser refused the banner */
  }
}

async function osNotify(title: string, body: string, tone: AlertTone) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  if (document.visibilityState !== "hidden") return;
  const sub = loadSub();
  if (sub && (await sendWebPush(title, body, sub, tone))) return;
  await localNotify(title, body, tone);
}

export function dismissToast(id: string) {
  const timer = timers.get(id);
  if (timer) window.clearTimeout(timer);
  timers.delete(id);
  items = items.map((item) => (item.id === id ? { ...item, leaving: true } : item));
  emit();
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id);
    emit();
  }, 180);
}

export function pushAlert(title: string, body: string, tone: AlertTone = "info") {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  items = [{ id, title, body, tone, leaving: false }, ...items].slice(0, 3);
  emit();
  const timer = window.setTimeout(() => dismissToast(id), 5200);
  timers.set(id, timer);
  if (alertsEnabled()) void osNotify(title, body, tone);
}

export async function refreshPush() {
  if (!alertsEnabled() || alertPermission() !== "granted") return false;
  const reg = await ensureWorker();
  if (!reg) return false;
  try {
    const serverKey = await loadPublicKey();
    let saved = "";
    try {
      saved = localStorage.getItem(VAPID_KEY) ?? "";
    } catch {
      saved = "";
    }
    if (pushSubscribed() && serverKey && saved === serverKey) return false;
    return Boolean(await subscribePush(reg));
  } catch {
    return false;
  }
}

export async function rotatePushKeys(): Promise<"ok" | "locked" | "retry" | "local" | "failed"> {
  let res: Response;
  try {
    res = await fetch(`${rootPrefix()}/api/push/rotate`, { method: "POST" });
  } catch {
    return "failed";
  }
  if (res.status === 409) return "locked";
  if (res.status === 429) return "retry";
  if (!res.ok) return "failed";
  const data = (await res.json()) as { publicKey?: string };
  if (!data.publicKey || !(await acceptVapidKey(data.publicKey))) return "failed";
  const reg = await ensureWorker();
  if (!reg || !("pushManager" in reg)) return "local";
  try {
    const existing = await reg.pushManager.getSubscription();
    await existing?.unsubscribe();
    saveSub(null);
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });
    const json = sub.toJSON();
    if (!json.endpoint) return "local";
    saveSub(json);
    try {
      localStorage.setItem(VAPID_KEY, data.publicKey);
    } catch {
      /* the subscription is still stored */
    }
    rememberSubscription(reg, json, data.publicKey);
    await loadPublicKey();
    return "ok";
  } catch {
    return "local";
  }
}

export async function sendTestPush() {
  const sub = loadSub();
  pushAlert("Test", "If Web Push is on, the browser banner follows this card.", "info");
  if (!sub) return false;
  return sendWebPush("Tyrone Futbol", "Web Push is wired. This one came through the push service.", sub, "info");
}

export async function enableAlerts(): Promise<AlertResult> {
  if (typeof Notification === "undefined") return "unsupported";
  const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode still gets this session's banners via the permission */
  }
  const reg = await ensureWorker();
  if (!reg) return "local";
  try {
    const sub = await subscribePush(reg);
    return sub ? "push" : "local";
  } catch {
    return "local";
  }
}

export async function disableAlerts() {
  try {
    localStorage.setItem(KEY, "0");
  } catch {
    /* ignore */
  }
  saveSub(null);
  try {
    localStorage.removeItem(VAPID_KEY);
  } catch {
    /* ignore */
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
    const worker = reg?.active || reg?.waiting || reg?.installing;
    worker?.postMessage({ type: "forget-subscription" });
  } catch {
    /* already gone */
  }
}
