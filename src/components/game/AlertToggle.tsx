import { useEffect, useState } from "react";
import {
  alertPermission,
  alertsEnabled,
  disableAlerts,
  enableAlerts,
  bootWorker,
  pushSubscribed,
  refreshPush,
  rotatePushKeys,
  sendTestPush,
  type AlertResult,
} from "@/game/alerts";
import { Btn } from "./ui";

function startMode(): "off" | "push" | "local" {
  if (!alertsEnabled() || alertPermission() !== "granted") return "off";
  return pushSubscribed() ? "push" : "local";
}

const NOTES: Record<AlertResult, string> = {
  push: "Web Push is on. Goals, bids, and desk notes can arrive after you leave this tab.",
  local: "Alerts are on in this browser, but Web Push did not subscribe. Banners only work while the tab is open.",
  denied: "The browser blocked alerts. You can allow them in site settings.",
  unsupported: "This browser has no notification support.",
};

export function AlertToggle() {
  const [mode, setMode] = useState(startMode);
  const [note, setNote] = useState("");
  const [kept, setKept] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    void bootWorker().then((ok) => {
      if (live) setKept(ok);
    });
    void refreshPush().then((ok) => {
      if (live && ok) setMode("push");
    });
    return () => {
      live = false;
    };
  }, []);
  const turnOn = async () => {
    const result = await enableAlerts();
    setMode(result === "push" || result === "local" ? result : "off");
    setNote(NOTES[result]);
  };
  const turnOff = async () => {
    await disableAlerts();
    setMode("off");
    setNote("Alerts are off. The desk still keeps its notes.");
  };
  const test = async () => {
    const ok = await sendTestPush();
    setNote(ok ? "Test sent through the push service." : "The card showed, but the push service did not take it.");
  };
  const rotate = async () => {
    setBusy(true);
    const result = await rotatePushKeys();
    setBusy(false);
    if (result === "ok") setNote("New push keys are in place. This device is subscribed to them.");
    else if (result === "locked") setNote("These push keys are fixed outside the game, so they were not replaced.");
    else if (result === "retry") setNote("The keys were just replaced. Wait a moment before doing it again.");
    else if (result === "local") setNote("The keys changed, but this device could not subscribe again.");
    else setNote("The keys were not replaced.");
  };
  return (
    <div className="rounded-2xl border border-line bg-surface px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Match alerts</div>
          <div className="text-xs text-muted">{mode === "push" ? "Web Push" : mode === "local" ? "This tab only" : "Off"}</div>
        </div>
        {mode === "off" ? (
          <Btn kind="quiet" onClick={turnOn}>
            Allow
          </Btn>
        ) : (
          <Btn kind="ghost" onClick={turnOff}>
            Turn off
          </Btn>
        )}
      </div>
      <p className="mt-2 text-xs text-pretty text-muted">
        {note ||
          "Web Push sends a goal, a bid, or a board note through the browser push service, so it can land after you leave this tab. The match still has to be running here."}
      </p>
      {kept ? (
        <p className="mt-2 text-xs text-pretty text-muted">
          {import.meta.env.PROD
            ? "This device keeps a copy of the desk for the next open."
            : "The crest and push key are cached on this device."}
        </p>
      ) : null}
      {mode === "push" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn kind="quiet" onClick={test} disabled={busy}>
            Send a test
          </Btn>
          <Btn kind="ghost" onClick={rotate} disabled={busy}>
            New keys
          </Btn>
        </div>
      ) : null}
    </div>
  );
}
