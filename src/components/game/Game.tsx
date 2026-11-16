import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { MatchDay, ReportView, Sacked, SeasonView, Title } from "./flows";
import { IntroFilm } from "./IntroFilm";
import { NewsOverlay } from "./fc/news";
import { CreateWizard } from "./fc/wizard";
import { Hub } from "./Hub";
import { Negotiate } from "./Negotiate";

function NewsGate() {
  const screen = useGame((s) => s.screen);
  if (screen === "squad" || screen === "market" || screen === "squadStats" || screen === "squadGoals") return null;
  return <NewsOverlay />;
}

export function Game() {
  const booted = useGame((s) => s.booted);
  const phase = useGame((s) => s.phase);
  /** Every page open: film → welcome → title menu (then Continue / New career). */
  const [introDone, setIntroDone] = useState(false);
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
  // Legacy saves that landed on the removed Team Talk screen jump into the match
  useEffect(() => {
    if (introDone && phase === "press") useGame.getState().toPress();
  }, [phase, introDone]);
  if (!booted) return <div className="app-bg min-h-dvh" />;
  if (!introDone) {
    return (
      <div className="app-bg min-h-dvh">
        <IntroFilm
          onDone={() => {
            useGame.setState({ phase: "title", notice: null });
            setIntroDone(true);
          }}
        />
      </div>
    );
  }
  return (
    <div className="app-bg min-h-dvh">
      {phase === "title" && <Title />}
      {phase === "create" && <CreateWizard />}
      {phase === "match" && <MatchDay />}
      {phase === "report" && <ReportView />}
      {phase === "season" && <SeasonView />}
      {phase === "sacked" && <Sacked />}
      {phase === "negotiate" && <Negotiate />}
      {(phase === "hub" || phase === "press") && <Hub />}
      {(phase === "hub" || phase === "season") && <NewsGate />}
    </div>
  );
}
