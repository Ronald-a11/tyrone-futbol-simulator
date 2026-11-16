import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AvatarPortrait } from "@/components/game/AvatarPortrait";
import { ADVANCED, CLASSIC, KIT_COLORS, PHILOSOPHIES, SHAPES, TIER_META } from "@/game/data";
import { CHAIRMAN_AVATARS } from "@/game/fc";
import { ovr } from "@/game/players";
import { seasonLeaders } from "@/game/scout";
import { useGame } from "@/game/store";
import type { FormationId, LiveMatch, Philosophy } from "@/game/types";
import { APP_BRAND, APP_TAGLINE } from "@/game/brand";
import { money, shortName } from "@/game/util";
import { USER, leagueTable, userClub } from "@/game/world";
import { FcBtn, FcShell } from "./fc/chrome";
import { Btn, Crest, Field, Kicker, Panel, Seg } from "./ui";

function faceId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % CHAIRMAN_AVATARS.length;
  return CHAIRMAN_AVATARS[h] ?? 0;
}

export function Title() {
  const active = useGame((s) => s.active);
  const goCreate = useGame((s) => s.goCreate);
  const phaseHub = useGame((s) => s.setScreen);
  const club = useGame((s) => userClub(s));
  const resume = () => {
    phaseHub("dash");
    useGame.setState({ phase: "hub" });
  };
  return (
    <FcShell
      footer={
        <div className="grid gap-2 px-1">
          {active && club ? (
            <FcBtn kind="lime" className="w-full min-h-12 text-base" onClick={resume}>
              Continue {club.short}
            </FcBtn>
          ) : null}
          <FcBtn kind={active ? "white" : "lime"} className="w-full min-h-12 text-base" onClick={goCreate}>
            New career
          </FcBtn>
        </div>
      }
    >
      <div className="fc-header safe-top px-3 pb-2 pt-2 text-center">
        <div className="font-display text-[1.25rem] leading-none text-white uppercase">{APP_BRAND}</div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-4">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#9fc44a] bg-[var(--color-fc-lime)]"
          aria-hidden
        >
          <div className="font-display text-4xl leading-none text-[#142016]">TF</div>
        </div>
        <p className="mt-5 font-display text-sm tracking-[0.3em] text-[var(--color-fc-lime)] uppercase">Welcome</p>
        <h1 className="mt-2 text-center font-display text-[2.4rem] leading-[0.9] text-white uppercase">
          Tyrone
          <br />
          Football Simulator
        </h1>
        <p className="mt-3 max-w-xs text-center font-sans text-sm font-bold leading-snug text-white/85">{APP_TAGLINE}</p>
      </div>
    </FcShell>
  );
}

function Swatches({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {KIT_COLORS.map((c) => (
        <button
          key={c.hex}
          type="button"
          aria-label={c.name}
          onClick={() => onChange(c.hex)}
          className={`press h-11 w-11 rounded-full border-2 ${value === c.hex ? "border-fg" : "border-transparent"}`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

export function ReportView() {
  const report = useGame((s) => s.report);
  const clubs = useGame((s) => s.clubs);
  const leave = useGame((s) => s.leaveReport);
  const review = useGame((s) => s.review);
  const [showAll, setShowAll] = useState(false);
  if (!report) {
    return (
      <div className="p-6">
        <Btn onClick={leave}>Continue</Btn>
      </div>
    );
  }
  const home = clubs.find((c) => c.id === report.homeId);
  const away = clubs.find((c) => c.id === report.awayId);
  const name = (id: string) => clubs.find((c) => c.id === id)?.short ?? id;
  const crowdNote = report.notes.find((n) => n.startsWith("Gate:"));
  const crowdMatch = crowdNote?.match(/Gate:\s*([\d,]+)/);
  const crowd = crowdMatch?.[1] ?? "—";
  const timeline = [
    { minute: 90, icon: "⏱", text: `Full time: ${report.homeScore}-${report.awayScore}`, italic: true },
    ...[...report.scorers]
      .sort((a, b) => b.minute - a.minute)
      .map((s) => ({
        minute: s.minute,
        icon: s.side === "home" ? "🟢" : "🟡",
        text: `Goal ${s.side === "home" ? home?.name ?? "Home" : away?.name ?? "Away"}${s.side === "home" ? ` (${s.name})` : ""}`,
        italic: false,
      })),
    { minute: 45, icon: "⏱", text: "Half time", italic: true },
    { minute: 0, icon: "⏱", text: "Kick off", italic: true },
    ...report.notes
      .filter((n) => !n.startsWith("Gate:"))
      .slice(0, 3)
      .map((n) => ({ minute: -1, icon: "💬", text: n, italic: true })),
  ];
  return (
    <div className="mobile-frame mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <div className="fc-shell flex min-h-dvh flex-1 flex-col">
      <div className="fc-header safe-top px-4 pb-2 pt-2 text-center text-xs tracking-wide text-white/70 uppercase">
        <div className="font-sans text-[0.7rem] font-extrabold text-white/60 uppercase">{APP_BRAND}</div>
        {report.label}
      </div>
      <div className="fc-rays flex flex-1 flex-col px-3 pb-4">
        <div className="rounded-lg bg-black px-3 py-3 text-white shadow-lg">
          <div className="flex items-center justify-between gap-2 font-display text-xl font-bold uppercase">
            <span className="min-w-0 flex-1 truncate">{home?.name ?? "Home"}</span>
            <span className="tabular-nums">{report.homeScore}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 font-display text-xl font-bold uppercase">
            <span className="min-w-0 flex-1 truncate">{away?.name ?? "Away"}</span>
            <span className="tabular-nums">{report.awayScore}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs text-white/70">
            <span>90 mins</span>
            <span>Crowd: {crowd}</span>
          </div>
        </div>
        <ul className="mt-3 overflow-hidden rounded-xl bg-white/90 text-sm shadow">
          {timeline.map((row, i) => (
            <li
              key={`${row.minute}-${i}`}
              className={`flex items-start gap-2 px-3 py-2 ${i % 2 ? "bg-black/5" : ""}`}
            >
              <span className="w-8 shrink-0 tabular-nums text-black/50">{row.minute >= 0 ? `${row.minute}'` : ""}</span>
              <span className="w-5 shrink-0" aria-hidden>
                {row.icon}
              </span>
              <span className={`min-w-0 flex-1 ${row.italic ? "italic text-black/70" : "font-medium"}`}>{row.text}</span>
            </li>
          ))}
        </ul>
        {showAll ? (
          <div className="mt-3 space-y-2">
            <div className="rounded-xl bg-white/90 p-3 text-sm shadow">
              <div className="font-semibold uppercase">Ratings · MOTM {report.motm}</div>
              <ul className="mt-2">
                {report.ratings.slice(0, 12).map((r) => (
                  <li key={r.id} className="flex items-center gap-2 border-t border-black/10 py-1.5">
                    <span className="flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-black/10 bg-black/5">
                      <AvatarPortrait id={faceId(r.id)} size={32} className="rounded-full" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {r.name} <span className="text-black/50">{r.pos}</span>
                    </span>
                    <span className="tabular-nums font-semibold">{r.rating.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            </div>
            {report.other.length ? (
              <div className="rounded-xl bg-white/90 p-3 text-sm shadow">
                <div className="font-semibold uppercase">Elsewhere</div>
                <ul className="mt-2">
                  {report.other.map((o) => {
                    const homeClub = clubs.find((c) => c.id === o.homeId);
                    const awayClub = clubs.find((c) => c.id === o.awayId);
                    return (
                      <li key={`${o.homeId}-${o.awayId}`} className="flex items-center gap-2 border-t border-black/10 py-1.5">
                        <div className="flex min-w-0 flex-1 items-center gap-1.5">
                          {homeClub ? (
                            <Crest primary={homeClub.primary} secondary={homeClub.secondary} short={homeClub.short} size={22} />
                          ) : null}
                          <span className="truncate font-medium">{name(o.homeId)}</span>
                          <span className="text-black/40">vs</span>
                          {awayClub ? (
                            <Crest primary={awayClub.primary} secondary={awayClub.secondary} short={awayClub.short} size={22} />
                          ) : null}
                          <span className="truncate font-medium">{name(o.awayId)}</span>
                        </div>
                        <span className="shrink-0 tabular-nums font-semibold">
                          {o.hs}–{o.as}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            <p className="px-1 text-xs text-white/80 tabular-nums">
              Gate {money(report.gate)} · TV {money(report.broadcast ?? 0)} · shirt {money(report.sponsor)} · costs{" "}
              {money(report.wages)}
            </p>
          </div>
        ) : null}
        <div className="mt-auto grid gap-2 pt-4">
          {!showAll ? (
            <Btn kind="primary" onClick={() => setShowAll(true)}>
              All results
            </Btn>
          ) : (
            <Btn kind="primary" onClick={leave}>
              {review ? "Season review" : "Back to the desk"}
            </Btn>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export function SeasonView() {
  const review = useGame((s) => s.review);
  const clubs = useGame((s) => s.clubs);
  const nextSeason = useGame((s) => s.nextSeason);
  const tier = useGame((s) => s.tier);
  const state = useGame();
  const leaders = seasonLeaders(state, "league");
  if (!review) return null;
  const move =
    review.move === "up"
      ? `Promoted into the ${TIER_META[Math.max(1, tier - 1) as 1 | 2 | 3 | 4 | 5]?.name ?? "next league"}${
          review.pos > (tier === 5 ? 1 : tier === 4 ? 3 : 2) ? " through the play-offs" : ""
        }.`
      : review.move === "down"
        ? "Relegated."
        : "You stay in the division.";
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Kicker tone="primary">Season closed</Kicker>
      <h1 className="mt-2 font-display text-6xl leading-none uppercase">
        {review.pos}
        {review.pos === 1 ? "st" : review.pos === 2 ? "nd" : review.pos === 3 ? "rd" : "th"}
      </h1>
      <p className="mt-3 text-pretty">
        {review.objectiveHit ? "The objective was met." : "The objective was missed."} {move} {review.cup}. Prize money {money(review.prize)} is in the account.
      </p>
      {review.awards ? <p className="mt-2 text-sm text-muted">{review.awards}</p> : null}
      <Panel className="mt-5">
        <TableLite rows={review.table} clubs={clubs} />
      </Panel>
      <Panel className="mt-4">
        <Kicker>Top scorers</Kicker>
        <ul className="mt-3 grid gap-1 text-sm">
          {leaders.scorers.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex justify-between gap-2">
              <span className="truncate">
                {i + 1}. {row.name}
              </span>
              <span className="tabular-nums">{row.goals}G · {row.assists}A</span>
            </li>
          ))}
          {!leaders.scorers.length ? <li className="text-muted">No goals recorded.</li> : null}
        </ul>
      </Panel>
      <Panel className="mt-4">
        <Kicker>Top assists</Kicker>
        <ul className="mt-3 grid gap-1 text-sm">
          {leaders.assists.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex justify-between gap-2">
              <span className="truncate">
                {i + 1}. {row.name}
              </span>
              <span className="tabular-nums">{row.assists}A · {row.goals}G</span>
            </li>
          ))}
          {!leaders.assists.length ? <li className="text-muted">No assists recorded.</li> : null}
        </ul>
      </Panel>
      <Btn className="mt-6 w-full" onClick={nextSeason}>
        Open next season
      </Btn>
    </div>
  );
}

function TableLite({
  rows,
  clubs,
}: {
  rows: ReturnType<typeof leagueTable>;
  clubs: { id: string; name: string }[];
}) {
  return (
    <ul>
      {rows.map((row, i) => (
        <li key={row.id} className={`flex justify-between py-1.5 text-sm ${row.id === USER ? "text-primary" : ""}`}>
          <span>
            {i + 1} {clubs.find((c) => c.id === row.id)?.name}
          </span>
          <span className="tabular-nums">{row.pts}</span>
        </li>
      ))}
    </ul>
  );
}

export function Sacked() {
  const history = useGame((s) => s.history);
  const board = useGame((s) => s.board);
  const abandon = useGame((s) => s.abandon);
  const last = history[history.length - 1];
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5">
      <Kicker tone="primary">Board</Kicker>
      <h1 className="mt-2 font-display text-6xl leading-none uppercase">Sacked</h1>
      <p className="mt-4 text-pretty text-muted">
        Confidence fell to {board}. The keys are on the desk.
        {last ? ` Last season you finished ${last.pos} in tier ${last.tier} with ${last.pts} points.` : ""}
      </p>
      <Btn className="mt-6 w-full" onClick={abandon}>
        Found another club
      </Btn>
    </div>
  );
}

type Dot = { x: number; y: number };
const shown: { dots: Record<string, Dot>; ball: Dot; id: string } = {
  dots: {},
  ball: { x: 50, y: 50 },
  id: "",
};

export function MatchDay() {
  const live = useGame((s) => s.live);
  const clubs = useGame((s) => s.clubs);
  const toggle = useGame((s) => s.togglePause);
  const setSpeed = useGame((s) => s.setSpeed);
  const toReport = useGame((s) => s.toReport);
  const advanceMatchStage = useGame((s) => s.advanceMatchStage);
  const manager = useGame((s) => s.manager);
  const notice = useGame((s) => s.notice);
  const shape = useGame((s) => s.shape);
  const formation = useGame((s) => s.formation);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [off, setOff] = useState<string | null>(null);
  const [onId, setOnId] = useState<string | null>(null);
  const [subsOpen, setSubsOpen] = useState(false);
  const [heldForSub, setHeldForSub] = useState(false);
  const [tacticsOpen, setTacticsOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [wash, setWash] = useState(false);
  const makeSub = useGame((s) => s.makeSub);
  const players = useGame((s) => s.players);
  const tempo = useGame((s) => s.tempo);
  const pressing = useGame((s) => s.pressing);
  const width = useGame((s) => s.width);
  const line = useGame((s) => s.line);
  const buildUp = useGame((s) => s.build);
  const scoreKey = live ? `${live.fixtureId}:${live.homeScore}-${live.awayScore}-${live.penHome}-${live.penAway}` : "";
  const seenScore = useRef(scoreKey);

  useEffect(() => {
    if (!scoreKey || seenScore.current === scoreKey) return;
    seenScore.current = scoreKey;
    setWash(true);
    const timer = window.setTimeout(() => setWash(false), 720);
    return () => window.clearTimeout(timer);
  }, [scoreKey]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let hold = 0;
    let heldMinute = -1;
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = useGame.getState().live;
      if (current?.scene?.freeze && current.minute !== heldMinute) {
        heldMinute = current.minute;
        const kind = current.scene.kind;
        const longSet =
          kind === "goal" ||
          kind === "freekick" ||
          kind === "corner" ||
          kind === "throwin" ||
          kind === "kickoff" ||
          kind === "penalty" ||
          current.scene.via === "penalty";
        hold = longSet ? 1.35 : 1.15;
      }
      if (hold > 0) hold = Math.max(0, hold - dt);
      if (current && !current.finished && !current.paused && hold <= 0) {
        const every = current.speed === 1 ? 0.46 : current.speed === 2 ? 0.18 : 0.07;
        acc += dt;
        if (acc >= every) {
          acc = 0;
          useGame.getState().stepMinute();
        }
      }
      paint(canvasRef.current, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!live) return <div className="min-h-dvh bg-bg" />;
  const home = clubs.find((c) => c.id === live.homeId);
  const away = clubs.find((c) => c.id === live.awayId);
  const side = live.userSide;
  const xi = side === "home" ? live.homeXi : live.awayXi;
  const bench = side === "home" ? live.homeBench : live.awayBench;
  const subs = side === "home" ? live.subsH : live.subsA;
  const lines = [...live.log].reverse().slice(0, 6);
  const stage = live.stage ?? "live";
  const ceremony = stage !== "live" && !live.finished;
  const clock = (() => {
    if (live.finished) return live.period === "pens" ? "Pens" : "FT";
    if (ceremony) {
      if (stage === "tunnel") return "Tunnel";
      if (stage === "lineups") return "XI";
      if (stage === "tactics") return "Tactics";
      if (stage === "ht-talk" || stage === "ht-changes") return "HT";
    }
    if (live.period === "pens") return "Pens";
    if (live.period === "et") return `${live.minute}' ET`;
    if (live.minute > 90 && (live.addedTime ?? 0) > 0) return `90+${live.minute - 90}`;
    if (live.minute === 45 && stage === "live") return "45'";
    return `${live.minute}'`;
  })();
  const breakPause =
    live.paused &&
    !live.finished &&
    stage === "live" &&
    (live.minute === 90 || live.minute === 105);

  const mentality = side === "home" ? live.homeMentality : live.awayMentality;
  const liveForm = side === "home" ? live.homeForm : live.awayForm;
  const openSheet = (which: "subs" | "tactics") => {
    const now = useGame.getState().live;
    if (now && !now.paused && !now.finished) {
      toggle();
      setHeldForSub(true);
    }
    setSubsOpen(which === "subs");
    setTacticsOpen(which === "tactics");
    setShapesOpen(false);
  };
  const closeSheet = () => {
    setSubsOpen(false);
    setTacticsOpen(false);
    setOff(null);
    setOnId(null);
    if (heldForSub) {
      toggle();
      setHeldForSub(false);
    }
  };
  const offPlayer = players.find((p) => p.id === off);
  const benchSorted = [...bench].sort((a, b) => {
    const pa = players.find((p) => p.id === a);
    const pb = players.find((p) => p.id === b);
    const fa = offPlayer && pa?.pos === offPlayer.pos ? 1 : 0;
    const fb = offPlayer && pb?.pos === offPlayer.pos ? 1 : 0;
    return fb - fa;
  });

  return (
    <div className="mobile-frame relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden">
      <div className="fc-shell flex h-dvh flex-1 flex-col overflow-hidden">
      <header className="fc-header safe-top flex shrink-0 items-end justify-between gap-3 px-4 pb-3">
        <div className="min-w-0">
          <div className="font-sans text-[0.7rem] font-extrabold text-white/60 uppercase">{APP_BRAND}</div>
          <div className="font-sans text-[0.72rem] font-bold text-white/70 uppercase">{live.weekLabel}{live.period === "et" ? " · Extra time" : live.period === "pens" ? " · Penalties" : ""}</div>
          <div className="mt-1 flex items-center gap-1.5 truncate font-display text-[1.85rem] leading-none text-white uppercase">
            {home ? <Crest primary={home.primary} secondary={home.secondary} short={home.short} size={28} /> : null}
            <span className="truncate">{home?.short}</span>
            <span key={`h-${live.homeScore}`} className="score-pop inline-block text-[var(--color-fc-lime)]">
              {live.homeScore}
            </span>
            <span className="text-white/40">–</span>
            <span key={`a-${live.awayScore}`} className="score-pop inline-block text-[var(--color-fc-lime)]">
              {live.awayScore}
            </span>
            <span className="truncate">{away?.short}</span>
            {away ? <Crest primary={away.primary} secondary={away.secondary} short={away.short} size={28} /> : null}
          </div>
          {live.period === "pens" ? (
            <div className="mt-1 text-sm text-[var(--color-fc-lime)] tabular-nums">
              Pens {live.penHome}–{live.penAway}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-[var(--color-fc-lime)] px-3 py-2 font-display text-3xl leading-none text-black tabular-nums">
            {clock}
          </div>
        </div>
      </header>
      <div className="mx-4 mt-2">
        <div className="flex items-center justify-between text-[0.65rem] font-semibold tracking-wide text-white/55 uppercase">
          <span>{home?.short} {Math.round(live.possH)}%</span>
          <span className="text-[var(--color-fc-lime)]">
            {live.attackSide === "home" ? `${home?.short ?? "Home"} attack` : `${away?.short ?? "Away"} attack`}
          </span>
          <span>{away?.short} {100 - Math.round(live.possH)}%</span>
        </div>
        <div className="relative mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-[var(--color-fc-lime)] transition-[width] duration-500" style={{ width: `${Math.round(live.possH)}%` }} />
          <div
            className="attack-pulse pointer-events-none absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[var(--color-fc-lime)] shadow-[0_0_10px_rgba(180,255,80,0.8)]"
            style={{ left: `calc(${live.attackSide === "home" ? Math.min(92, live.possH + 8) : Math.max(8, live.possH - 8)}% - 6px)` }}
          />
        </div>
      </div>
      <div className="relative min-h-[42vh] flex-1 px-3 pb-1">
        <canvas ref={canvasRef} className="h-full min-h-[220px] w-full rounded-2xl border border-line bg-pitch" />
        {live.scene ? (
          <div
            className={`pointer-events-none absolute top-2 right-5 left-5 rounded-lg px-3 py-1.5 text-center text-xs font-bold tracking-wide ${
              live.scene.freeze ? "bg-black/80 text-[var(--color-fc-lime)]" : "bg-black/55 text-white"
            }`}
          >
            {live.scene.text}
          </div>
        ) : null}
        {wash ? <div className="goal-wash pointer-events-none absolute inset-x-4 inset-y-0 rounded-2xl" /> : null}
      </div>
      <div className="mt-3 grid shrink-0 gap-2 px-4">
        <div className="flex items-center gap-2">
          <button type="button" aria-label={live.paused ? "Play" : "Pause"} onClick={toggle} className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface">
            {live.paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <div className="flex flex-1 rounded-xl bg-surface p-1">
            {([1, 2, 3] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSpeed(n)}
                className={`press min-h-11 flex-1 rounded-lg text-sm tabular-nums ${live.speed === n && !live.paused ? "bg-primary text-bg" : "text-muted"}`}
              >
                {n}×
              </button>
            ))}
          </div>
        </div>
        {live.period !== "pens" ? (
          <Seg
            value={mentality}
            options={[
              { id: "defend", label: "Defend" },
              { id: "balanced", label: "Balanced" },
              { id: "attack", label: "Attack" },
            ]}
            onChange={(m) => useGame.getState().mind(m)}
          />
        ) : null}
      </div>
      {breakPause ? (
        <p className="px-4 pt-2 text-sm text-primary">
          {live.minute === 90
            ? "Extra time. Change the plan, then play on."
            : live.minute === 105
              ? "Extra-time break. Adjust, then restart."
              : "Half-time. Change the plan, then play on."}
        </p>
      ) : null}
      {notice ? <p className="px-4 pt-2 text-sm text-muted">{notice}</p> : null}
      <ul className="mt-3 min-h-16 flex-1 space-y-1 overflow-y-auto px-4 text-sm">
        {lines.map((line, i) => (
          <li key={`${line.minute}-${i}-${line.text.slice(0, 12)}`} className={line.kind === "goal" ? "text-primary" : "text-muted"}>
            <span className="mr-2 tabular-nums">{line.minute}'</span>
            {line.text}
          </li>
        ))}
      </ul>
      <div className="safe-bottom grid shrink-0 gap-2 border-t border-line px-4 pt-3">
        {live.period !== "pens" ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn kind="ghost" onClick={() => openSheet("subs")}>
              Subs {subs}/5
            </Btn>
            <Btn kind="ghost" onClick={() => openSheet("tactics")}>
              Tactics · {liveForm}
            </Btn>
            {breakPause ? (
              <Btn kind="quiet" className="col-span-2" onClick={() => setShapesOpen((v) => !v)}>
                Shape · {liveForm}
              </Btn>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted">Spot kicks are automatic. Watch the log.</p>
        )}
        {shapesOpen && breakPause ? (
          <Panel className="max-h-40 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              {[...CLASSIC, ...ADVANCED].map((id) => (
                <Btn
                  key={id}
                  kind={formation === id || liveForm === id ? "primary" : "ghost"}
                  onClick={() => {
                    shape(id);
                    setShapesOpen(false);
                  }}
                >
                  {id}
                </Btn>
              ))}
            </div>
          </Panel>
        ) : null}
        {subsOpen && live.period !== "pens" ? (
          <div className="absolute inset-x-2 bottom-2 z-40 max-h-[75%] overflow-y-auto rounded-2xl bg-white p-3 text-black shadow-2xl">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted">Clock stopped. Pick who comes off, then who comes on. {5 - subs} changes left.</div>
              <button type="button" className="text-xs font-bold" onClick={closeSheet}>
                Close
              </button>
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <Kicker>On the pitch</Kicker>
                {xi.map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p || live.off.includes(id)) return null;
                  const stam = Math.round(live.stamina[id] ?? p.fitness);
                  const tired = p.pos !== "GK" && stam < 68;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setOff(id);
                        setOnId(null);
                      }}
                      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-2 text-left text-sm ${off === id ? "bg-primary text-bg" : ""}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <AvatarPortrait id={faceId(id)} size={28} className="rounded-full" />
                        <span className="min-w-0">
                          <span className="block truncate">{p.name}</span>
                          <span className={`text-[0.65rem] ${off === id ? "text-bg/70" : "text-muted"}`}>
                            {p.pos}
                            {tired ? " · tired" : ""}
                          </span>
                        </span>
                      </span>
                      <span className="text-right text-xs tabular-nums">
                        <span className="block">{(live.ratings[id] ?? 6).toFixed(1)}</span>
                        <span className={off === id ? "text-bg/70" : "text-muted"}>{stam}%</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div>
                <Kicker>Bench</Kicker>
                {benchSorted.map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p) return null;
                  const gkSlot = offPlayer?.pos === "GK";
                  const blocked = offPlayer ? (gkSlot ? p.pos !== "GK" : p.pos === "GK") : true;
                  const fit = offPlayer && p.pos === offPlayer.pos;
                  return (
                    <button
                      key={id}
                      type="button"
                      disabled={blocked}
                      className={`flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm disabled:opacity-40 ${onId === id ? "bg-[var(--color-fc-navy)] text-white" : ""}`}
                      onClick={() => setOnId(id)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <AvatarPortrait id={faceId(id)} size={28} className="rounded-full" />
                        <span className="truncate">
                          {p.name} <span className="text-xs">{p.pos}</span>
                          {fit ? <span className="ml-1 text-[0.65rem]">fits</span> : null}
                        </span>
                      </span>
                      <span className="tabular-nums">{ovr(p)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Btn
              className="mt-3 w-full"
              kind="primary"
              disabled={!off || !onId}
              onClick={() => {
                if (!off || !onId) return;
                makeSub(off, onId);
                setOff(null);
                setOnId(null);
              }}
            >
              {off && onId ? "Make the change" : "Choose both players"}
            </Btn>
          </div>
        ) : null}
        {tacticsOpen && live.period !== "pens" ? (
          <div className="absolute inset-x-2 bottom-2 z-40 max-h-[75%] overflow-y-auto rounded-2xl bg-white p-3 text-black shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted">The manager's plan. It takes effect from the next minute.</div>
              <button type="button" className="text-xs font-bold" onClick={closeSheet}>
                Close
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {[...CLASSIC, ...ADVANCED].slice(0, 8).map((id) => (
                <Btn key={id} kind={liveForm === id ? "primary" : "ghost"} onClick={() => shape(id)}>
                  {id}
                </Btn>
              ))}
            </div>
            <div className="mt-2 text-[0.65rem] font-bold tracking-wide uppercase text-muted">Tempo {tempo}</div>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Btn key={n} kind={tempo === n ? "primary" : "ghost"} onClick={() => useGame.getState().tune("tempo", n)}>
                  {n}
                </Btn>
              ))}
            </div>
            <div className="mt-2 text-[0.65rem] font-bold tracking-wide uppercase text-muted">Press {pressing} · Width {width}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Btn key={`p${n}`} kind={pressing === n ? "primary" : "ghost"} onClick={() => useGame.getState().tune("pressing", n)}>
                  P{n}
                </Btn>
              ))}
              {[1, 2, 3, 4, 5].map((n) => (
                <Btn key={`w${n}`} kind={width === n ? "primary" : "ghost"} onClick={() => useGame.getState().tune("width", n)}>
                  W{n}
                </Btn>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(["deep", "standard", "high"] as const).map((id) => (
                <Btn key={id} kind={line === id ? "primary" : "ghost"} onClick={() => useGame.getState().setLine(id)}>
                  {id} line
                </Btn>
              ))}
              {(["short", "mixed", "direct"] as const).map((id) => (
                <Btn key={id} kind={buildUp === id ? "primary" : "ghost"} onClick={() => useGame.getState().setBuild(id)}>
                  {id}
                </Btn>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      </div>
      {ceremony ? (
        <MatchCeremony
          live={live}
          home={home}
          away={away}
          players={players}
          managerName={manager.name}
          formation={formation}
          onAdvance={advanceMatchStage}
        />
      ) : null}
      {live.finished ? (
        <EndMatchPanel live={live} home={home} away={away} players={players} onEnd={toReport} />
      ) : null}
    </div>
  );
}

function EndMatchPanel({
  live,
  home,
  away,
  onEnd,
}: {
  live: LiveMatch;
  home: { name: string; short: string; primary: string; secondary: string } | undefined;
  away: { name: string; short: string; primary: string; secondary: string } | undefined;
  players: { id: string; name: string }[];
  onEnd: () => void;
}) {
  const userWon =
    (live.userSide === "home" && live.homeScore > live.awayScore) ||
    (live.userSide === "away" && live.awayScore > live.homeScore);
  const draw = live.homeScore === live.awayScore;
  const resultLabel = draw ? "Draw" : userWon ? "Victory" : "Defeat";
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/55 px-3 pb-6 pt-10 backdrop-blur-[2px] sm:items-center">
      <div className="w-full max-w-[360px] overflow-hidden rounded-2xl bg-[#0c1a12] text-white shadow-2xl ring-1 ring-white/10">
        <div className="bg-[var(--color-fc-lime)] px-4 py-2 text-center font-display text-sm tracking-wide text-black uppercase">
          Full time · {resultLabel}
        </div>
        <div className="px-4 py-5 text-center">
          <div className="flex items-center justify-center gap-3">
            {home ? <Crest primary={home.primary} secondary={home.secondary} short={home.short} size={40} /> : null}
            <div className="font-display text-4xl tabular-nums text-[var(--color-fc-lime)]">
              {live.homeScore}
              <span className="mx-1 text-white/35">–</span>
              {live.awayScore}
            </div>
            {away ? <Crest primary={away.primary} secondary={away.secondary} short={away.short} size={40} /> : null}
          </div>
          <div className="mt-2 flex justify-between px-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            <span className="truncate">{home?.short ?? "HOME"}</span>
            <span className="truncate">{away?.short ?? "AWAY"}</span>
          </div>
          {live.period === "pens" ? (
            <div className="mt-2 text-sm text-[var(--color-fc-lime)]">
              Pens {live.penHome}–{live.penAway}
            </div>
          ) : null}
        </div>
        <div className="px-4 pb-4">
          <button
            type="button"
            onClick={onEnd}
            className="press w-full rounded-xl bg-[var(--color-fc-lime)] px-4 py-3.5 font-display text-lg text-black uppercase"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchCeremony({
  live,
  home,
  away,
  players,
  managerName,
  formation,
  onAdvance,
}: {
  live: NonNullable<ReturnType<typeof useGame.getState>["live"]>;
  home: { name: string; short: string; primary: string; secondary: string; stadium: string } | undefined;
  away: { name: string; short: string; primary: string; secondary: string } | undefined;
  players: ReturnType<typeof useGame.getState>["players"];
  managerName: string;
  formation: string;
  onAdvance: () => void;
}) {
  const stage = live.stage ?? "live";
  const homeXi = live.homeXi.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const awayXi = live.awayXi.map((id) => players.find((p) => p.id === id)).filter(Boolean);
  const cta =
    stage === "tunnel"
      ? "Enter the pitch"
      : stage === "lineups"
        ? "Confirm line-ups"
        : stage === "tactics"
          ? "Kick off"
          : stage === "ht-talk"
            ? "Hear the changes"
            : "Apply & second half";

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[rgba(8,20,12,0.94)] px-4 py-6 text-white">
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col overflow-hidden">
        <div className="text-center font-sans text-[0.7rem] font-bold tracking-widest text-white/50 uppercase">
          {live.weekLabel} · Manager in control
        </div>
        {stage === "tunnel" ? (
          <div className="mt-6 flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex items-center gap-4">
              {home ? <Crest primary={home.primary} secondary={home.secondary} short={home.short} size={64} /> : null}
              <span className="font-display text-2xl text-white/40">VS</span>
              {away ? <Crest primary={away.primary} secondary={away.secondary} short={away.short} size={64} /> : null}
            </div>
            <h2 className="mt-6 font-display text-3xl uppercase">Players enter the ground</h2>
            <p className="mt-3 max-w-sm text-sm text-white/70">
              The tunnel opens at {home?.stadium ?? "the ground"}. Both sides walk out for {home?.name ?? "Home"} vs{" "}
              {away?.name ?? "Away"}.
            </p>
          </div>
        ) : null}
        {stage === "lineups" ? (
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
            <h2 className="font-display text-2xl uppercase">Team sheets</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  {home ? <Crest primary={home.primary} secondary={home.secondary} short={home.short} size={22} /> : null}
                  {home?.short ?? "Home"} · {live.homeForm}
                </div>
                <ul className="space-y-1 text-sm">
                  {homeXi.map((p) =>
                    p ? (
                      <li key={p.id} className="flex items-center gap-2">
                        <AvatarPortrait id={faceId(p.id)} size={24} className="rounded-full" />
                        <span className="truncate">
                          {p.name} <span className="text-white/45">{p.pos}</span>
                        </span>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  {away ? <Crest primary={away.primary} secondary={away.secondary} short={away.short} size={22} /> : null}
                  {away?.short ?? "Away"} · {live.awayForm}
                </div>
                <ul className="space-y-1 text-sm">
                  {awayXi.map((p) =>
                    p ? (
                      <li key={p.id} className="flex items-center gap-2">
                        <AvatarPortrait id={faceId(p.id)} size={24} className="rounded-full" />
                        <span className="truncate">
                          {p.name} <span className="text-white/45">{p.pos}</span>
                        </span>
                      </li>
                    ) : null,
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
        {stage === "tactics" ? (
          <div className="mt-6 flex flex-1 flex-col justify-center">
            <h2 className="font-display text-2xl uppercase">{managerName}&apos;s plan</h2>
            <p className="mt-3 text-sm text-white/75">
              Shape {formation} · {live.homeMentality} mentality from the home dugout. Your manager takes the touchline —
              you watch the full ninety.
            </p>
            <dl className="mt-4 grid gap-2 rounded-xl bg-white/10 p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-white/55">Home shape</dt>
                <dd className="font-semibold">{live.homeForm}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Away shape</dt>
                <dd className="font-semibold">{live.awayForm}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/55">Kick-off</dt>
                <dd className="font-semibold">{home?.stadium ?? "Pitch"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
        {stage === "ht-talk" ? (
          <div className="mt-6 flex flex-1 flex-col justify-center">
            <div className="text-sm text-[var(--color-fc-lime)] tabular-nums">
              HT {live.homeScore}–{live.awayScore}
            </div>
            <h2 className="mt-2 font-display text-2xl uppercase">Dressing room</h2>
            <p className="mt-4 rounded-xl bg-white/10 p-4 text-sm leading-relaxed text-white/90">{live.htTalk}</p>
            <p className="mt-3 text-xs text-white/50">{managerName} is preparing changes for the second half.</p>
          </div>
        ) : null}
        {stage === "ht-changes" ? (
          <div className="mt-6 flex flex-1 flex-col">
            <h2 className="font-display text-2xl uppercase">Manager changes</h2>
            <ul className="mt-4 space-y-2">
              {(live.htPlan ?? []).length ? (
                (live.htPlan ?? []).map((c) => {
                  const offP = players.find((p) => p.id === c.offId);
                  const onP = players.find((p) => p.id === c.onId);
                  return (
                    <li key={`${c.offId}-${c.onId}`} className="flex items-center gap-3 rounded-xl bg-white/10 p-3 text-sm">
                      <AvatarPortrait id={faceId(c.offId)} size={36} className="rounded-full" />
                      <span className="text-white/40">→</span>
                      <AvatarPortrait id={faceId(c.onId)} size={36} className="rounded-full" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold">
                          {onP?.name ?? "Sub"} on for {offP?.name ?? "starter"}
                        </span>
                        <span className="text-xs text-white/55">{c.reason}</span>
                      </span>
                    </li>
                  );
                })
              ) : (
                <li className="rounded-xl bg-white/10 p-3 text-sm text-white/70">No changes — same eleven for the restart.</li>
              )}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onAdvance}
          className="press mt-4 w-full rounded-xl bg-[var(--color-fc-lime)] px-4 py-3.5 font-display text-lg text-black uppercase"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

const shownExtras: {
  prev: Record<string, { x: number; y: number }>;
  facing: Record<string, number>;
  trail: { x: number; y: number }[];
  t: number;
  kickT: number;
  kickId: string | null;
  ballSpin: number;
  lastScene: string;
  flight: {
    from: { x: number; y: number };
    to: { x: number; y: number };
    t: number;
    dur: number;
    loft: number;
  } | null;
  netPulse: number;
  pose: "kick" | "throw" | "dive" | "celebrate" | "none";
  dust: { x: number; y: number; vx: number; vy: number; life: number; max: number }[];
  bounce: number;
} = {
  prev: {},
  facing: {},
  trail: [],
  t: 0,
  kickT: 0,
  kickId: null,
  ballSpin: 0,
  lastScene: "",
  flight: null,
  netPulse: 0,
  pose: "none",
  dust: [],
  bounce: 0,
};

function paint(canvas: HTMLCanvasElement | null, dt: number) {
  if (!canvas) return;
  const state = useGame.getState();
  const live = state.live;
  if (!live) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (shown.id !== live.fixtureId) {
    shown.id = live.fixtureId;
    shown.dots = { ...live.dots };
    shown.ball = { ...live.ball };
    shownExtras.prev = {};
    shownExtras.facing = {};
    shownExtras.trail = [];
    shownExtras.t = 0;
    shownExtras.kickT = 0;
    shownExtras.kickId = null;
    shownExtras.ballSpin = 0;
    shownExtras.lastScene = "";
    shownExtras.flight = null;
    shownExtras.netPulse = 0;
    shownExtras.pose = "none";
    shownExtras.dust = [];
    shownExtras.bounce = 0;
  }
  shownExtras.t += dt;
  if (shownExtras.kickT > 0) shownExtras.kickT = Math.max(0, shownExtras.kickT - dt);
  if (shownExtras.netPulse > 0) shownExtras.netPulse = Math.max(0, shownExtras.netPulse - dt);
  if (shownExtras.bounce > 0) shownExtras.bounce = Math.max(0, shownExtras.bounce - dt);
  for (const p of shownExtras.dust) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 18 * dt;
  }
  shownExtras.dust = shownExtras.dust.filter((p) => p.life > 0).slice(-40);

  const sceneKey = live.scene
    ? `${live.minute}:${live.scene.kind}:${live.scene.actorId}:${live.scene.via ?? ""}:${live.scene.text}`
    : "";
  if (sceneKey && sceneKey !== shownExtras.lastScene) {
    shownExtras.lastScene = sceneKey;
    const sc = live.scene;
    const setPieceKinds = new Set([
      "goal",
      "miss",
      "save",
      "penalty",
      "corner",
      "freekick",
      "throwin",
      "kickoff",
      "goalkick",
      "shot",
      "cross",
      "build",
      "tackle",
      "foul",
      "card",
    ]);
    if (sc && setPieceKinds.has(sc.kind)) {
      const long =
        sc.kind === "goal" ||
        sc.kind === "penalty" ||
        sc.via === "penalty" ||
        sc.kind === "freekick" ||
        sc.kind === "kickoff" ||
        sc.kind === "goalkick" ||
        sc.kind === "corner" ||
        sc.kind === "throwin" ||
        sc.kind === "save";
      shownExtras.kickT = long ? 1.25 : sc.freeze ? 0.9 : 0.5;
      shownExtras.kickId = sc.actorId;
      shownExtras.pose =
        sc.kind === "throwin" ? "throw" : sc.kind === "save" ? "dive" : "kick";
      const from = sc.ballFrom ?? { ...shown.ball };
      const to = { ...live.ball };
      const loft =
        sc.kind === "goal" || sc.via === "penalty"
          ? 18
          : sc.kind === "corner" || sc.kind === "freekick"
            ? 15
            : sc.kind === "throwin"
              ? 12
              : sc.kind === "kickoff"
                ? 7
                : sc.kind === "save"
                  ? 5
                  : 9;
      shown.ball = { ...from };
      shownExtras.flight = { from, to, t: 0, dur: long ? 1.05 : 0.58, loft };
      shownExtras.trail = [];
      for (let i = 0; i < 6; i++) {
        shownExtras.dust.push({
          x: from.x,
          y: from.y,
          vx: (Math.random() - 0.5) * 14,
          vy: -4 - Math.random() * 8,
          life: 0.35 + Math.random() * 0.35,
          max: 0.7,
        });
      }
    } else {
      shownExtras.pose = "none";
      shownExtras.flight = null;
    }
  }

  const k = Math.min(1, dt * 6.5);
  for (const [id, target] of Object.entries(live.dots)) {
    const cur = shown.dots[id] ?? { ...target };
    shownExtras.prev[id] = { ...(shown.dots[id] ?? target) };
    /* soft chase + micro jog so the pitch always feels alive */
    const jigX = Math.sin(shownExtras.t * 3.1 + id.length * 2.2) * 0.35;
    const jigY = Math.cos(shownExtras.t * 2.7 + id.length * 1.7) * 0.28;
    cur.x += (target.x + jigX - cur.x) * k;
    cur.y += (target.y + jigY - cur.y) * k;
    shown.dots[id] = cur;
    const dx = target.x - (shownExtras.prev[id]?.x ?? target.x);
    const dy = target.y - (shownExtras.prev[id]?.y ?? target.y);
    if (Math.hypot(dx, dy) > 0.02) {
      const face = Math.atan2(dy, dx);
      const prevFace = shownExtras.facing[id] ?? face;
      let diff = face - prevFace;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      shownExtras.facing[id] = prevFace + diff * Math.min(1, dt * 8);
    }
  }

  if (live.scene && shownExtras.kickId) {
    const d = shown.dots[shownExtras.kickId];
    if (d) {
      const aim = live.ball;
      shownExtras.facing[shownExtras.kickId] = Math.atan2(aim.y - d.y, aim.x - d.x);
    }
  }

  let loftY = 0;
  if (shownExtras.flight) {
    const fl = shownExtras.flight;
    fl.t += dt;
    const u = Math.min(1, fl.t / fl.dur);
    const hold = live.scene?.kind === "throwin" ? 0.22 : 0.18;
    const launchU = Math.max(0, (u - hold) / Math.max(0.001, 1 - hold));
    const e = launchU * launchU * (3 - 2 * launchU);
    shown.ball.x = fl.from.x + (fl.to.x - fl.from.x) * e;
    shown.ball.y = fl.from.y + (fl.to.y - fl.from.y) * e;
    loftY = Math.sin(launchU * Math.PI) * fl.loft;
    shownExtras.ballSpin += dt * (10 + e * 28);
    if (u >= 1) {
      shown.ball = { ...fl.to };
      shownExtras.flight = null;
      shownExtras.bounce = 0.45;
      if (live.scene?.kind === "goal") {
        shownExtras.netPulse = 1.2;
        shownExtras.pose = "celebrate";
        shownExtras.kickT = Math.max(shownExtras.kickT, 1.4);
      }
      loftY = 0;
      for (let i = 0; i < 4; i++) {
        shownExtras.dust.push({
          x: fl.to.x,
          y: fl.to.y,
          vx: (Math.random() - 0.5) * 10,
          vy: -2 - Math.random() * 6,
          life: 0.25 + Math.random() * 0.25,
          max: 0.5,
        });
      }
    }
  } else {
    const ballK = live.scene?.freeze ? Math.min(1, dt * 3.2) : Math.min(1, dt * 7.5);
    shown.ball.x += (live.ball.x - shown.ball.x) * ballK;
    shown.ball.y += (live.ball.y - shown.ball.y) * ballK;
    shownExtras.ballSpin += dt * (8 + Math.hypot(live.ball.x - shown.ball.x, live.ball.y - shown.ball.y) * 40);
    const bounceLift = shownExtras.bounce > 0 ? Math.abs(Math.sin((1 - shownExtras.bounce / 0.45) * Math.PI * 2)) * 5 : 0;
    loftY = bounceLift + Math.abs(Math.sin(shownExtras.t * 10)) * 0.8;
  }
  shownExtras.trail.push({ x: shown.ball.x, y: shown.ball.y });
  if (shownExtras.trail.length > 18) shownExtras.trail.shift();

  /* —— pitch —— */
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#1a5c34");
  g.addColorStop(0.5, "#14703a");
  g.addColorStop(1, "#0f4d28");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.06)";
    ctx.fillRect((i * w) / 12, 0, w / 12 + 1, h);
  }
  /* stands / crowd rim */
  ctx.fillStyle = "rgba(28, 22, 18, 0.72)";
  ctx.fillRect(0, 0, w, 12);
  ctx.fillRect(0, h - 12, w, 12);
  ctx.fillRect(0, 0, 10, h);
  ctx.fillRect(w - 10, 0, 10, h);
  ctx.fillStyle = "rgba(180, 60, 50, 0.15)";
  ctx.fillRect(2, 2, w - 4, 8);
  /* crowd shimmer */
  for (let i = 0; i < 28; i++) {
    const cx = 4 + ((i * 47 + shownExtras.t * 40) % (w - 8));
    const cy = 3 + (i % 3) * 2.2;
    const pulse = 0.25 + 0.55 * Math.abs(Math.sin(shownExtras.t * 3 + i));
    ctx.fillStyle = `rgba(255,${140 + (i % 5) * 20},${100 + (i % 4) * 20},${0.12 + pulse * 0.2})`;
    ctx.fillRect(cx, cy, 2.2, 2.2);
  }

  const m = 18;
  ctx.strokeStyle = "rgba(245,248,242,0.92)";
  ctx.lineWidth = 1.8;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  ctx.beginPath();
  ctx.moveTo(w / 2, m);
  ctx.lineTo(w / 2, h - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 2.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(245,248,242,0.95)";
  ctx.fill();
  const boxW = (w - m * 2) * 0.16;
  const boxH = (h - m * 2) * 0.52;
  const sixW = boxW * 0.42;
  const sixH = boxH * 0.48;
  ctx.strokeRect(m, h / 2 - boxH / 2, boxW, boxH);
  ctx.strokeRect(w - m - boxW, h / 2 - boxH / 2, boxW, boxH);
  ctx.strokeRect(m, h / 2 - sixH / 2, sixW, sixH);
  ctx.strokeRect(w - m - sixW, h / 2 - sixH / 2, sixW, sixH);
  const netBulge = shownExtras.netPulse > 0 ? Math.sin((1 - shownExtras.netPulse / 1.1) * Math.PI) * 10 : 0;
  const drawGoal = (left: boolean) => {
    const gx = left ? m - 9 : w - m;
    const gy = h / 2 - 20;
    ctx.fillStyle = "rgba(20,20,20,0.55)";
    ctx.fillRect(gx, gy, 9, 40);
    ctx.strokeStyle = "#e8e8e8";
    ctx.lineWidth = 2;
    ctx.strokeRect(gx, gy, 9, 40);
    /* net mesh */
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx, gy, 9, 40);
    ctx.clip();
    ctx.strokeStyle = "rgba(220,230,220,0.45)";
    ctx.lineWidth = 0.8;
    const pull = left ? -netBulge : netBulge;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + 1, gy + 4 + i * 8);
      ctx.quadraticCurveTo(gx + 4.5 + pull, gy + 8 + i * 8, gx + 8, gy + 4 + i * 8);
      ctx.stroke();
    }
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + 2 + i * 2.5, gy + 2);
      ctx.lineTo(gx + 2 + i * 2.5 + pull * 0.4, gy + 38);
      ctx.stroke();
    }
    ctx.restore();
  };
  drawGoal(true);
  drawGoal(false);

  const home = state.clubs.find((c) => c.id === live.homeId);
  const away = state.clubs.find((c) => c.id === live.awayId);
  const px = (x: number) => m + (x / 100) * (w - m * 2);
  const py = (y: number) => m + (y / 100) * (h - m * 2);

  /* Find who is on the ball */
  let carrierId: string | null = live.scene?.actorId ?? null;
  if (!carrierId || live.off.includes(carrierId)) {
    let best = 1e9;
    for (const id of [...live.homeXi, ...live.awayXi]) {
      if (live.off.includes(id)) continue;
      const d = shown.dots[id];
      if (!d) continue;
      const dist = Math.hypot(d.x - shown.ball.x, d.y - shown.ball.y);
      if (dist < best) {
        best = dist;
        carrierId = id;
      }
    }
    if (best > 9) carrierId = null;
  }

  const scale = Math.max(0.85, Math.min(1.25, Math.min(w, h) / 320));

  /* ball flight trail */
  for (let i = 0; i < shownExtras.trail.length; i++) {
    const p = shownExtras.trail[i]!;
    const a = (i + 1) / shownExtras.trail.length;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${0.05 + a * 0.28})`;
    ctx.arc(px(p.x), py(p.y), 1.2 + a * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  /* turf dust / kick spray */
  for (const p of shownExtras.dust) {
    const a = Math.max(0, p.life / p.max);
    ctx.beginPath();
    ctx.fillStyle = `rgba(210,190,140,${0.15 + a * 0.45})`;
    ctx.arc(px(p.x), py(p.y), (1.2 + (1 - a) * 3) * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  const drawFootballer = (
    id: string,
    club: { primary: string; secondary: string } | undefined,
    isHome: boolean,
  ) => {
    if (live.off.includes(id)) return;
    const d = shown.dots[id];
    if (!d) return;
    const prev = shownExtras.prev[id] ?? d;
    const speed = Math.hypot(d.x - prev.x, d.y - prev.y);
    const facing = shownExtras.facing[id] ?? (isHome ? 0 : Math.PI);
    const active = shownExtras.kickId === id && shownExtras.kickT > 0;
    const kicking = active && shownExtras.pose === "kick";
    const throwing = active && shownExtras.pose === "throw";
    const diving = active && shownExtras.pose === "dive";
    const celebrating = active && shownExtras.pose === "celebrate";
    const kickDur =
      live.scene?.kind === "goal" || live.scene?.kind === "kickoff" || live.scene?.via === "penalty" || live.scene?.kind === "save"
        ? 1.25
        : 0.9;
    const kickPhase = active ? 1 - shownExtras.kickT / kickDur : 0;
    const run = shownExtras.t * (9 + speed * 48) + id.length * 1.7;
    const strideAmp = kicking || throwing || diving ? 0.08 : 0.58 + Math.min(0.85, speed * 7);
    const stride = Math.sin(run) * strideAmp;
    const bob = Math.abs(Math.sin(run)) * Math.min(1.8, 0.4 + speed * 10);
    const idle = Math.sin(shownExtras.t * 2.4 + id.length) * 0.6;
    const lean = Math.min(0.35, speed * 4.5);
    const x = px(d.x);
    const y = py(d.y) - bob;
    const kit = club?.primary ?? (isHome ? "#f0f4f0" : "#1a2030");
    const trim = club?.secondary ?? "#ffffff";
    const skin = "#e8c4a0";
    const shorts = isHome ? darkenHex(kit, 0.35) : darkenHex(kit, 0.25);
    const s = 11 * scale;

    ctx.save();
    ctx.translate(x, y);
    const flip = Math.cos(facing) < 0 ? -1 : 1;
    ctx.scale(flip, 1);
    if (diving) {
      ctx.rotate((-0.9 + kickPhase * 0.35) * flip);
    } else if (celebrating) {
      ctx.rotate(Math.sin(kickPhase * Math.PI * 4) * 0.12);
    } else {
      ctx.rotate(lean * 0.25);
    }

    /* shadow */
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.32)";
    ctx.ellipse(diving ? s * 0.4 : 0, s * 0.95 + bob, s * (diving ? 0.9 : 0.55), s * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    if (diving) {
      /* keeper stretch */
      ctx.strokeStyle = kit;
      ctx.lineWidth = 2.4 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-s * 0.35, 0);
      ctx.lineTo(s * 0.85, -s * 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.1, s * 0.1);
      ctx.lineTo(s * 0.55, s * 0.45);
      ctx.stroke();
      ctx.fillStyle = kit;
      ctx.fillRect(-s * 0.25, -s * 0.28, s * 0.7, s * 0.4);
      ctx.beginPath();
      ctx.fillStyle = skin;
      ctx.arc(s * 0.55, -s * 0.2, s * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    /* legs */
    ctx.strokeStyle = shorts;
    ctx.lineWidth = 2.4 * scale;
    ctx.lineCap = "round";
    const backLegX = -s * 0.22 - stride * s * 0.4;
    const backLegY = s * 0.72 + Math.max(0, -stride) * s * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.12 + idle * 0.05);
    ctx.lineTo(backLegX, backLegY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, s * 0.12);
    if (kicking) {
      const swing = -0.45 + kickPhase * 1.85;
      ctx.lineTo(s * (0.1 + Math.cos(swing) * 0.7), s * (0.12 + Math.sin(swing) * 0.7));
    } else if (celebrating) {
      ctx.lineTo(s * 0.15, s * 0.55);
      ctx.moveTo(0, s * 0.12);
      ctx.lineTo(-s * 0.2, s * 0.55);
    } else {
      ctx.lineTo(s * 0.2 + stride * s * 0.4, s * 0.76 + Math.max(0, stride) * s * 0.08);
    }
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.ellipse(backLegX, backLegY + s * 0.08, s * 0.18, s * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    if (kicking) {
      const swing = -0.45 + kickPhase * 1.85;
      ctx.ellipse(
        s * (0.1 + Math.cos(swing) * 0.7),
        s * (0.12 + Math.sin(swing) * 0.7) + 2,
        s * 0.2,
        s * 0.1,
        0,
        0,
        Math.PI * 2,
      );
    } else if (!celebrating) {
      ctx.ellipse(s * 0.2 + stride * s * 0.4, s * 0.84, s * 0.18, s * 0.1, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    /* torso */
    ctx.fillStyle = kit;
    ctx.beginPath();
    const tw = s * 0.64;
    const th = s * 0.55;
    const tx = -s * 0.32;
    const ty = -s * 0.35 + idle * 0.08;
    ctx.moveTo(tx + 3, ty);
    ctx.lineTo(tx + tw - 3, ty);
    ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + 3);
    ctx.lineTo(tx + tw, ty + th - 3);
    ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - 3, ty + th);
    ctx.lineTo(tx + 3, ty + th);
    ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - 3);
    ctx.lineTo(tx, ty + 3);
    ctx.quadraticCurveTo(tx, ty, tx + 3, ty);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(-s * 0.12, -s * 0.15, s * 0.24, s * 0.28);
    ctx.globalAlpha = 1;

    /* arms */
    ctx.strokeStyle = kit;
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    if (throwing) {
      const up = Math.min(1, kickPhase * 1.4);
      const release = kickPhase > 0.45 ? (kickPhase - 0.45) * 1.2 : 0;
      ctx.moveTo(-s * 0.22, -s * 0.22);
      ctx.lineTo(-s * (0.18 - release * 0.35), -s * (0.75 * up - release * 0.2));
      ctx.moveTo(s * 0.22, -s * 0.22);
      ctx.lineTo(s * (0.18 - release * 0.35), -s * (0.75 * up - release * 0.2));
    } else if (celebrating) {
      const wave = Math.sin(kickPhase * Math.PI * 6) * 0.15;
      ctx.moveTo(-s * 0.25, -s * 0.2);
      ctx.lineTo(-s * 0.35, -s * (0.85 + wave));
      ctx.moveTo(s * 0.25, -s * 0.2);
      ctx.lineTo(s * 0.35, -s * (0.85 - wave));
    } else {
      ctx.moveTo(-s * 0.3, -s * 0.2);
      ctx.lineTo(-s * 0.55, s * (0.05 + stride * 0.25));
      ctx.moveTo(s * 0.3, -s * 0.2);
      ctx.lineTo(s * 0.52, s * (0.05 - stride * 0.25));
    }
    ctx.stroke();

    /* head */
    ctx.beginPath();
    ctx.fillStyle = skin;
    ctx.arc(0, -s * 0.55 + idle * 0.05, s * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (kicking && kickPhase > 0.28 && kickPhase < 0.72) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,255,200,${0.6 - Math.abs(kickPhase - 0.5)})`;
      ctx.lineWidth = 2;
      ctx.arc(s * 0.5, s * 0.3, s * 0.65, -0.5, 1.3);
      ctx.stroke();
    }

    ctx.restore();

    /* name tag (screen space, not flipped) */
    const p = state.players.find((pl) => pl.id === id);
    const label = p?.name?.split(" ").pop()?.slice(0, 7) ?? "";
    if (label) {
      ctx.font = `600 ${Math.round(9 * scale)}px Barlow Condensed, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillText(label, x + 0.7, y + s * 1.15 + 0.7);
      ctx.fillStyle = carrierId === id ? "#b4ff50" : "rgba(245,248,242,0.95)";
      ctx.fillText(label, x, y + s * 1.15);
    }
  };

  /* Draw far players first (rough depth by y) */
  const order = [...live.homeXi, ...live.awayXi]
    .filter((id) => shown.dots[id] && !live.off.includes(id))
    .sort((a, b) => (shown.dots[a]!.y - shown.dots[b]!.y));
  for (const id of order) {
    const isHome = live.homeXi.includes(id);
    drawFootballer(id, isHome ? home : away, isHome);
  }

  /* football */
  const bx = px(shown.ball.x);
  const by = py(shown.ball.y) - loftY * scale;
  ctx.beginPath();
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.ellipse(bx, py(shown.ball.y) + 4 * scale, 4.2 * scale, 1.7 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(shownExtras.ballSpin);
  ctx.beginPath();
  ctx.fillStyle = "#f5f5f0";
  ctx.arc(0, 0, 4.6 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a1a";
  ctx.lineWidth = 1.1 * scale;
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "rgba(20,20,20,0.55)";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * 2.4 * scale;
    const y = Math.sin(a) * 2.4 * scale;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  /* set-piece caption */
  if (live.scene && shownExtras.kickT > 0.15) {
    const sc = live.scene;
    let label = "";
    if (sc.kind === "goal") label = sc.via === "penalty" ? "PENALTY — GOAL" : "GOAL";
    else if (sc.kind === "freekick") label = "FREE KICK";
    else if (sc.kind === "corner") label = "CORNER";
    else if (sc.kind === "throwin") label = "THROW-IN";
    else if (sc.kind === "goalkick") label = "GOAL KICK";
    else if (sc.kind === "kickoff") label = live.minute >= 45 ? "2ND HALF KICK-OFF" : "KICK-OFF";
    else if (sc.kind === "penalty") label = "PENALTY";
    else if (sc.kind === "save" && sc.via === "penalty") label = "PENALTY SAVED";
    else if (sc.via === "penalty") label = "PENALTY";
    else if (sc.kind === "shot") label = "SHOT";
    if (label) {
      ctx.font = `700 ${Math.round(13 * scale)}px Barlow Condensed, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillText(label, w / 2 + 1, m + 16 + 1);
      ctx.fillStyle = sc.kind === "goal" ? "#b4ff50" : "rgba(245,248,242,0.95)";
      ctx.fillText(label, w / 2, m + 16);
    }
  }

  if (carrierId && shownExtras.kickT <= 0 && !shownExtras.flight) {
    const d = shown.dots[carrierId];
    if (d && Math.hypot(d.x - shown.ball.x, d.y - shown.ball.y) < 5) {
      shown.ball.x += (d.x + 1.8 - shown.ball.x) * Math.min(1, dt * 4);
      shown.ball.y += (d.y + 1.2 - shown.ball.y) * Math.min(1, dt * 4);
    }
  }
}

function darkenHex(hex: string, amount: number) {
  const raw = hex.replace("#", "");
  if (raw.length < 6) return "#222";
  const n = Number.parseInt(raw.slice(0, 6), 16);
  if (!Number.isFinite(n)) return "#222";
  const r = Math.max(0, ((n >> 16) & 255) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 255) * (1 - amount));
  const b = Math.max(0, (n & 255) * (1 - amount));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
