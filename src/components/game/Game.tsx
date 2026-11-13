import { useEffect } from "react";
import { useGame } from "@/game/store";
import { Create, MatchDay, Press, ReportView, Sacked, SeasonView, Title } from "./flows";
import { Hub } from "./Hub";

export function Game() {
  const booted = useGame((s) => s.booted);
  const phase = useGame((s) => s.phase);
  useEffect(() => {
    useGame.getState().boot();
    const flush = () => {
      if (document.visibilityState === "hidden") useGame.getState().saveNow();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, []);
  if (!booted) return <div className="app-bg min-h-dvh" />;
  return (
    <div className="app-bg min-h-dvh">
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
