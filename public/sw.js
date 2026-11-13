// Versioned caches. Bump VERSION to drop every tyrone-* cache on the next activate.
// shell: network-first documents. assets: cache-first hashed files.
// media: stale-while-revalidate images. push: network-first VAPID key.
const VERSION = "2";
const NAMES = {
  shell: `tyrone-shell-${VERSION}`,
  assets: `tyrone-assets-${VERSION}`,
  media: `tyrone-media-${VERSION}`,
  push: `tyrone-push-${VERSION}`,
};
const CURRENT = new Set(Object.values(NAMES));
const shellMode = new URL(self.location.href).searchParams.has("shell");

function scoped(path) {
  return new URL(path.replace(/^\//, ""), self.registration.scope).href;
}

function show(title, body, tag) {
  return self.registration.showNotification(title, {
    body,
    icon: scoped("favicon.svg"),
    badge: scoped("favicon.svg"),
    tag: tag || "tyrone-desk",
    renotify: true,
    data: { url: self.registration.scope },
  });
}

async function putIfOk(cache, request, response) {
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, name) {
  const cache = await caches.open(name);
  try {
    const fresh = await fetch(request);
    await putIfOk(cache, request, fresh.clone());
    return fresh;
  } catch (err) {
    const hit = (await cache.match(request)) || (await caches.match(request));
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const fresh = await fetch(request);
  await putIfOk(cache, request, fresh.clone());
  return fresh;
}

async function staleWhileRevalidate(event, request, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  const refresh = fetch(request)
    .then((fresh) => putIfOk(cache, request, fresh.clone()))
    .catch(() => {});
  if (hit) {
    event.waitUntil(refresh);
    return hit;
  }
  await refresh;
  const next = await cache.match(request);
  if (next) return next;
  return fetch(request);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const media = await caches.open(NAMES.media);
      await Promise.all(
        ["favicon.svg", "og.jpg", "x-banner.jpg"].map(async (file) => {
          try {
            await media.add(scoped(file));
          } catch {
            /* a missing image should not block the worker */
          }
        }),
      );
      if (shellMode) {
        try {
          const shell = await caches.open(NAMES.shell);
          const home = await fetch(new Request(self.registration.scope, { cache: "reload" }));
          await putIfOk(shell, self.registration.scope, home);
        } catch {
          /* the shell is filled on the next navigation */
        }
      }
      try {
        const push = await caches.open(NAMES.push);
        const keyUrl = new URL("api/push/vapid", self.registration.scope).href;
        const key = await fetch(keyUrl);
        await putIfOk(push, keyUrl, key);
      } catch {
        /* the page warms the push key again once the worker is active */
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("tyrone-") && !CURRENT.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/api/push/vapid")) {
    event.respondWith(networkFirst(request, NAMES.push));
    return;
  }
  if (url.pathname.includes("/api/")) return;
  if (shellMode && request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, NAMES.shell).catch(() => caches.match(self.registration.scope).then((hit) => hit || fetch(request))),
    );
    return;
  }
  if (shellMode && /\/assets\/[^/]+\.(?:js|css|woff2?)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, NAMES.assets));
    return;
  }
  if (/\.(?:svg|png|jpe?g|webp)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event, request, NAMES.media));
  }
});

self.addEventListener("push", (event) => {
  let payload = { title: "Tyrone Futbol", body: "The desk has news.", tag: "tyrone-desk" };
  try {
    const parsed = event.data?.json();
    if (parsed && typeof parsed.title === "string") payload = parsed;
  } catch {
    const text = event.data?.text();
    if (text) payload.body = text.slice(0, 180);
  }
  event.waitUntil(show(payload.title, payload.body, payload.tag));
});

const DB_NAME = "tyrone-push";
const DB_STORE = "kv";

function openDb() {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(DB_STORE);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}

async function putRecord(value) {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(value, "subscription");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function readRecord() {
  const db = await openDb();
  const value = await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const req = tx.objectStore(DB_STORE).get("subscription");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

async function deleteRecord() {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).delete("subscription");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

function bytesFromBase64Url(value) {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

async function tellClients(message) {
  const list = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of list) client.postMessage(message);
}

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    (async () => {
      const saved = await readRecord().catch(() => null);
      let next = event.newSubscription || null;
      if (!next) {
        const rawKey = saved?.applicationServerKey;
        const applicationServerKey = rawKey ? bytesFromBase64Url(rawKey) : event.oldSubscription?.options?.applicationServerKey;
        next = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          ...(applicationServerKey ? { applicationServerKey } : {}),
        });
      }
      const subscription = next.toJSON();
      await putRecord({ subscription, applicationServerKey: saved?.applicationServerKey || "" });
      await tellClients({ type: "push-subscription", subscription });
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data.type !== "string") return;
  if (data.type === "notify") {
    event.waitUntil(show(data.title, data.body, data.tag));
    return;
  }
  if (data.type === "skip-waiting") {
    self.skipWaiting();
    return;
  }
  if (data.type === "remember-subscription" && data.subscription?.endpoint) {
    event.waitUntil(putRecord({ subscription: data.subscription, applicationServerKey: data.applicationServerKey || "" }));
    return;
  }
  if (data.type === "forget-subscription") {
    event.waitUntil(deleteRecord());
    return;
  }
  if (data.type === "sync-subscription" && event.source) {
    event.waitUntil(
      readRecord()
        .then((saved) => {
          if (saved?.subscription?.endpoint) event.source.postMessage({ type: "push-subscription", subscription: saved.subscription });
        })
        .catch(() => {}),
    );
  }
});


self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || self.registration.scope;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
