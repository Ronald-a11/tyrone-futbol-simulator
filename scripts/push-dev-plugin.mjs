import { deliver, rotateVapid, vapidPublic } from "../server/push-core.mjs";

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

/** Dev-server Web Push routes. Production uses server/routes/api/push/[action].mjs. */
export function pushDevPlugin() {
  return {
    name: "app-builder:web-push",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathOnly = (req.url ?? "").split("?", 1)[0] ?? "";
        if (pathOnly !== "/api/push/vapid" && pathOnly !== "/api/push/send" && pathOnly !== "/api/push/rotate") {
          next();
          return;
        }
        try {
          if (pathOnly === "/api/push/vapid" && req.method === "GET") {
            sendJson(res, 200, { publicKey: vapidPublic() });
            return;
          }
          if (pathOnly === "/api/push/rotate" && req.method === "POST") {
            const result = await rotateVapid();
            sendJson(
              res,
              result.ok ? 200 : result.status,
              result.ok
                ? { publicKey: result.publicKey, previousPublicKey: result.previousPublicKey, persisted: result.persisted }
                : { error: result.error },
            );
            return;
          }
          if (pathOnly === "/api/push/send" && req.method === "POST") {
            const raw = JSON.parse((await readBody(req)) || "{}");
            const result = await deliver(raw);
            sendJson(
              res,
              result.ok ? 200 : result.status,
              result.ok
                ? {
                    ok: true,
                    skipped: Boolean(result.skipped),
                    ttl: result.ttl,
                    urgency: result.urgency,
                    topic: result.topic,
                    encoding: result.encoding,
                    rs: result.rs,
                    idlen: result.idlen,
                  }
                : { error: result.error },
            );
            return;
          }
          res.statusCode = 405;
          res.end("Method Not Allowed");
        } catch (err) {
          console.error("[web-push]", err);
          if (!res.headersSent) sendJson(res, 500, { error: "push failed" });
        }
      });
    },
  };
}
