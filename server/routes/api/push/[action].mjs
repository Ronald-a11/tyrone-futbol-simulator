import { deliver, rotateVapid, vapidPublic } from "../../../push-core.mjs";

/** @param {{ req: { method: string, json: () => Promise<unknown> }, context?: { params?: { action?: string } } }} event */
export default async function pushRoute(event) {
  const action = event.context?.params?.action;
  const method = event.req.method;
  if (action === "vapid" && method === "GET") {
    return { publicKey: vapidPublic() };
  }
  if (action === "rotate" && method === "POST") {
    const result = await rotateVapid();
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { "content-type": "application/json" },
      });
    }
    return { publicKey: result.publicKey, previousPublicKey: result.previousPublicKey, persisted: result.persisted };
  }
  if (action === "send" && method === "POST") {
    const raw = /** @type {Parameters<typeof deliver>[0]} */ (await event.req.json());
    const result = await deliver(raw);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { "content-type": "application/json" },
      });
    }
    const sent = /** @type {{ skipped?: boolean, ttl: number, urgency: string, topic: string, encoding: string, rs?: number, idlen?: number }} */ (result);
    return {
      ok: true,
      skipped: Boolean(sent.skipped),
      ttl: sent.ttl,
      urgency: sent.urgency,
      topic: sent.topic,
      encoding: sent.encoding,
      rs: sent.rs,
      idlen: sent.idlen,
    };
  }
  return new Response("Not found", { status: 404 });
}
