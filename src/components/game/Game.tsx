import { useEffect } from "react";
import { bootWorker, pushAlert } from "@/game/alerts";
import { useGame } from "@/game/store";
import { money } from "@/game/util";
import { ToastStack } from "./Toasts";
import { Create, MatchDay, Press, ReportView, Sacked, SeasonView, Title } from "./flows";
import { Hub } from "./Hub";

export function Game() {
  const booted = useGame((s) => s.booted);
  const phase = useGame((s) => s.phase);
  useEffect(() => {
    useGame.getState().boot();
    void bootWorker();
    let prev = useGame.getState();
    const unsub = useGame.subscribe((state) => {
      if (state.notice && state.notice !== prev.notice) {
        pushAlert("Desk", state.notice, "info");
      }
      const live = state.live;
      const before = prev.live;
      if (live && before && live.fixtureId === before.fixtureId) {
        const scored = live.homeScore !== before.homeScore || live.awayScore !== before.awayScore;
        if (scored) {
          const line = [...live.log].reverse().find((entry) => entry.kind === "goal");
          pushAlert("Goal", line?.text ?? `${live.homeScore}–${live.awayScore}`, "goal");
        }
      }
      if (state.phase === "report" && prev.phase !== "report" && state.report) {
        const r = state.report;
        pushAlert("Full time", `${r.homeScore}–${r.awayScore}. ${r.motm} was the pick.`, "info");
      }
      const bid = state.offer?.playerId ?? "";
      const oldBid = prev.offer?.playerId ?? "";
      if (bid && bid !== oldBid && state.offer) {
        pushAlert("Bid", `${state.offer.from} table ${money(state.offer.fee)}.`, "warn");
      }
      const top = state.inbox[0];
      const oldTop = prev.inbox[0];
      if (top && top.id !== oldTop?.id && state.booted && prev.booted) {
        pushAlert(top.tag, top.title, "info");
      }
      prev = state;
    });
    const flush = () => {
      if (document.visibilityState === "hidden") useGame.getState().saveNow();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      unsub();
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  if (!booted) return <div className="app-bg min-h-dvh" />;
  return (
    <div className="app-bg min-h-dvh">
      <ToastStack />
      {phase === "title" && <Title />}
      {phase === "create" && <Create />}
      {phase === "press" && <Press />}
      {phase === "match" && <MatchDay />}
      {phase === "report" && <ReportView />}
      {phase === "season" && <SeasonView />}
      {phase === "sacked" && <Sacked />}
      {phase === "hub" && <Hub />}
    </div>
  );
}
