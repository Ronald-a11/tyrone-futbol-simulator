import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { ADVANCED, CLASSIC, KIT_COLORS, PHILOSOPHIES, SHAPES, TIER_META } from "@/game/data";
import { ovr } from "@/game/players";
import { listSlots } from "@/game/saves";
import { seasonLeaders } from "@/game/scout";
import { useGame } from "@/game/store";
import type { FormationId, Philosophy } from "@/game/types";
import { inkFor, money, shortName } from "@/game/util";
import { USER, leagueTable, userClub } from "@/game/world";
import { Btn, Crest, Field, Kicker, Panel, Seg } from "./ui";

export function Title() {
  const active = useGame((s) => s.active);
  const goCreate = useGame((s) => s.goCreate);
  const phaseHub = useGame((s) => s.setScreen);
  const resumeSlot = useGame((s) => s.resumeSlot);
  const importCareer = useGame((s) => s.importCareer);
  const club = useGame((s) => userClub(s));
  const [slots, setSlots] = useState(() => listSlots());
  useEffect(() => {
    setSlots(listSlots());
  }, [active]);
  const resume = () => {
    phaseHub("dash");
    useGame.setState({ phase: "hub" });
  };
  return (
    <div className="fc-shell mx-auto flex min-h-dvh max-w-md flex-col px-5">
      <div className="fc-rays safe-top flex flex-1 flex-col justify-end pb-8">
        <div className="rise">
          <Kicker tone="primary">Chairman</Kicker>
        </div>
        <h1 className="rise rise-2 mt-4 font-display text-6xl leading-none tracking-wide text-white uppercase sm:text-7xl">
          Tyrone
          <span className="block text-[var(--color-fc-lime)]">Futbol</span>
        </h1>
        <p className="rise rise-3 mt-3 font-display text-2xl leading-none tracking-wide text-white/70 uppercase">Chairman</p>
        <p className="rise rise-4 mt-6 max-w-sm text-pretty text-white/80">
          Own the club. Hire the manager. Set the budget. Build the ground. Win the Tyrone pyramid.
        </p>
        <div className="rise rise-5 mt-8 flex items-center gap-3">
          <span className="mark seq-mark" aria-hidden />
          <span className="text-xs tracking-widest text-muted uppercase">Three divisions · one chair</span>
        </div>
      </div>
      <div className="rise rise-5 safe-bottom grid gap-2 py-4">
        {active && club ? (
          <Btn onClick={resume}>Continue {club.short}</Btn>
        ) : null}
        <Btn kind={active ? "ghost" : "primary"} onClick={goCreate}>
          Found a club
        </Btn>
        {slots.length ? (
          <div className="mt-2 grid gap-2">
            <div className="text-xs tracking-widest text-muted uppercase">Saved chairs</div>
            {slots.map((s) => (
              <Btn key={s.id} kind="quiet" onClick={() => resumeSlot(s.id)}>
                Slot {s.id}: {s.label}
              </Btn>
            ))}
          </div>
        ) : null}
        <label className="press mt-1 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-line bg-transparent px-4 py-2 text-sm font-medium">
          Import career
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              importCareer(await file.text());
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}

export function Create() {
  const backTitle = useGame((s) => s.backTitle);
  const startClub = useGame((s) => s.startClub);
  const [managerName, setManager] = useState("Tyrone");
  const [clubName, setClub] = useState("Quay Athletic");
  const [city, setCity] = useState("Quay");
  const [primary, setPrimary] = useState(KIT_COLORS[1]?.hex ?? "#d6b25e");
  const [secondary, setSecondary] = useState(KIT_COLORS[0]?.hex ?? "#14261f");
  const [philosophy, setPhil] = useState<Philosophy>("possession");
  const [formation, setForm] = useState<FormationId>("4-3-3");
  const short = shortName(clubName);
  const ready = clubName.trim().length >= 3 && city.trim().length >= 2 && managerName.trim().length >= 2;
  return (
    <div className="fc-shell mx-auto min-h-dvh max-w-md">
      <div className="fc-header safe-top px-4 pb-3 pt-2">
        <button type="button" onClick={backTitle} className="text-sm text-white/80">
          Back
        </button>
        <h1 className="mt-2 font-display text-3xl leading-none tracking-wide text-white uppercase">Take the chair</h1>
        <p className="mt-2 text-sm text-white/75">
          You are chairman. A manager is hired for you. Harbor League, £2.40m, top-four brief.
        </p>
      </div>
      <div className="fc-rays flex-1 px-4 py-4">
        <div className="fc-card mb-4 flex items-center gap-3 rounded-xl p-3 shadow-md">
          <Crest primary={primary} secondary={secondary} short={short} size={56} />
          <div className="min-w-0">
            <div className="truncate font-display text-2xl leading-none text-[var(--color-fc-navy)] uppercase">
              {clubName || "Your club"}
            </div>
            <div className="mt-1 text-sm text-black/60">{city || "City"} Park</div>
          </div>
        </div>
        <div className="fc-card grid gap-3 rounded-xl p-3 shadow-md">
          <Field label="Chairman name" value={managerName} onChange={setManager} />
          <Field label="Club name" value={clubName} onChange={setClub} />
          <Field label="City" value={city} onChange={setCity} />
          <div>
            <div className="mb-1 text-xs tracking-wide text-black/50 uppercase">Short</div>
            <div className="font-display text-2xl text-[var(--color-fc-navy)]">{short}</div>
          </div>
        </div>
        <div className="fc-card mt-3 rounded-xl p-3 shadow-md">
          <div className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">Shirt</div>
          <Swatches value={primary} onChange={setPrimary} />
          <div className="mt-3 mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">Trim</div>
          <Swatches value={secondary} onChange={setSecondary} />
        </div>
        <div className="mt-3 grid gap-2">
          {PHILOSOPHIES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPhil(p.id)}
              className={`rounded-lg border px-3 py-3 text-left ${philosophy === p.id ? "border-transparent bg-[var(--color-fc-lime)] font-bold text-black" : "border-black/10 bg-white text-black"}`}
            >
              <div className="font-medium">{p.title}</div>
              <div className="text-sm opacity-80">{p.body}</div>
            </button>
          ))}
        </div>
        <div className="fc-card mt-3 rounded-xl p-3 shadow-md">
          <div className="mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">Opening shape</div>
          <div className="flex flex-wrap gap-2">
            {CLASSIC.map((id) => (
              <Btn key={id} kind={formation === id ? "primary" : "ghost"} onClick={() => setForm(id)}>
                {id}
              </Btn>
            ))}
          </div>
          <div className="mt-3 mb-2 text-xs font-bold tracking-wide text-black/50 uppercase">Advanced</div>
          <div className="flex flex-wrap gap-2">
            {ADVANCED.map((id) => (
              <Btn key={id} kind={formation === id ? "primary" : "ghost"} onClick={() => setForm(id)}>
                {id}
              </Btn>
            ))}
          </div>
          <p className="mt-2 text-sm text-black/60">
            {formation} · {SHAPES[formation].name}. {SHAPES[formation].idea}
          </p>
        </div>
        <Btn
          className="mt-4 mb-6 w-full"
          disabled={!ready}
          onClick={() =>
            startClub({
              managerName,
              clubName,
              short,
              city,
              primary,
              secondary,
              philosophy,
              formation,
            })
          }
        >
          Open the season
        </Btn>
      </div>
    </div>
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

const QUESTIONS = [
  "The local sheet wants a prediction. What do you give them?",
  "A reporter asks if the squad is good enough. Your line?",
  "They bring up the board's patience. How do you answer?",
];

export function Press() {
  const week = useGame((s) => s.weekIndex);
  const label = useGame((s) => s.weeks[s.weekIndex]?.label ?? "Matchday");
  const pickPress = useGame((s) => s.pickPress);
  const quickSim = useGame((s) => s.quickSim);
  const back = useGame((s) => s.setScreen);
  const q = QUESTIONS[week % QUESTIONS.length] ?? QUESTIONS[0];
  return (
    <div className="fc-shell mx-auto flex min-h-dvh max-w-md flex-col">
      <div className="fc-header safe-top px-4 pb-3 pt-2">
        <div className="text-xs tracking-wide text-white/70 uppercase">{label}</div>
        <h1 className="mt-1 font-display text-3xl leading-none tracking-wide text-white uppercase">Team talk</h1>
      </div>
      <div className="fc-rays flex flex-1 flex-col px-4 py-4">
        <div className="fc-card rounded-xl p-4 shadow-md">
          <p className="text-pretty text-lg leading-snug text-black">{q}</p>
        </div>
        <div className="mt-4 grid gap-2">
          <Btn onClick={() => pickPress("bold")}>We'll take the game to them.</Btn>
          <Btn kind="ghost" onClick={() => pickPress("measured")}>
            We respect them and play our football.
          </Btn>
          <Btn kind="ghost" onClick={() => pickPress("deflect")}>
            Ask me after the whistle.
          </Btn>
        </div>
        <p className="mt-4 text-sm text-white/80">A bold line lifts the side. Lose, and the board remembers.</p>
        <div className="mt-auto grid gap-2 pt-8">
          <Btn kind="primary" onClick={quickSim}>
            Let the assistant sim it
          </Btn>
          <button
            type="button"
            className="text-center text-sm text-white/75"
            onClick={() => {
              back("dash");
              useGame.setState({ phase: "hub" });
            }}
          >
            Back to the desk
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReportView() {
  const report = useGame((s) => s.report);
  const clubs = useGame((s) => s.clubs);
  const leave = useGame((s) => s.leaveReport);
  const review = useGame((s) => s.review);
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
  return (
    <div className="fc-shell mx-auto max-w-md px-0 pb-16">
      <div className="fc-header safe-top px-4 pb-3 pt-2">
        <div className="text-xs tracking-wide text-white/70 uppercase">{report.label}</div>
        <h1 className="mt-1 font-display text-3xl leading-none tracking-wide text-white uppercase">Match report</h1>
      </div>
      <div className="fc-rays px-4 py-4">
      <div className="fc-card rounded-xl p-4 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-2xl text-[var(--color-fc-navy)] uppercase">{home?.short}</div>
            <div className="truncate text-sm text-black/60">{home?.name}</div>
          </div>
          <div className="font-display text-5xl leading-none tabular-nums text-[var(--color-fc-navy)]">
            {report.homeScore}
            <span className="text-black/40">–</span>
            {report.awayScore}
          </div>
          <div className="min-w-0 flex-1 text-right">
            <div className="truncate font-display text-2xl text-[var(--color-fc-navy)] uppercase">{away?.short}</div>
            <div className="truncate text-sm text-black/60">{away?.name}</div>
          </div>
        </div>
        <p className="mt-3 text-sm text-black/60">
          xG {report.xgH.toFixed(2)}–{report.xgA.toFixed(2)} · {report.motm}
        </p>
      </div>
      <ul className="mt-3 text-sm">
        {report.scorers.map((s, i) => (
          <li key={`${s.playerId}-${i}`}>
            {s.minute}' {s.name} ({s.side === "home" ? home?.short : away?.short})
          </li>
        ))}
      </ul>
      <div className="mt-4 grid gap-1 text-sm">
        {report.notes.map((n) => (
          <p key={n} className="text-pretty text-muted">
            {n}
          </p>
        ))}
        <p className="tabular-nums">
          Gate {money(report.gate)} · TV {money(report.broadcast ?? 0)} · shirt {money(report.sponsor)} · costs {money(report.wages)} · board {report.boardDelta >= 0 ? "+" : ""}
          {report.boardDelta}
        </p>
      </div>
      <Panel className="mt-4">
        <Kicker>Ratings</Kicker>
        <ul className="mt-2">
          {report.ratings.slice(0, 12).map((r) => (
            <li key={r.id} className="flex justify-between gap-3 border-t border-line py-2 text-sm">
              <span>
                {r.name} <span className="text-muted">{r.pos}</span>
              </span>
              <span className="tabular-nums">{r.rating.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </Panel>
      {report.other.length ? (
        <Panel className="mt-4">
          <Kicker>Elsewhere</Kicker>
          <ul className="mt-2 text-sm">
            {report.other.map((o) => (
              <li key={`${o.homeId}-${o.awayId}`} className="flex justify-between py-1">
                <span>
                  {name(o.homeId)} vs {name(o.awayId)}
                </span>
                <span className="tabular-nums">
                  {o.hs}–{o.as}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <Btn className="mt-6 w-full" onClick={leave}>
        {review ? "Season review" : "Back to the desk"}
      </Btn>
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
  const leaders = seasonLeaders(state);
  if (!review) return null;
  const move =
    review.move === "up" ? `Promoted toward ${TIER_META[(tier - 1) as 1 | 2 | 3]?.name ?? "the next league"}.` : review.move === "down" ? "Relegated." : "You stay in the division.";
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
      <Panel className="mt-5">
        <TableLite rows={review.table} clubs={clubs} />
      </Panel>
      <Panel className="mt-4">
        <Kicker>Season board</Kicker>
        <ul className="mt-3 grid gap-1 text-sm">
          {leaders.scorers.slice(0, 5).map((row, i) => (
            <li key={row.id} className="flex justify-between gap-2">
              <span className="truncate">
                {i + 1}. {row.name}
              </span>
              <span className="tabular-nums">{row.goals}G · {row.assists}A</span>
            </li>
          ))}
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
  const yell = useGame((s) => s.yell);
  const toReport = useGame((s) => s.toReport);
  const notice = useGame((s) => s.notice);
  const muted = useGame((s) => s.muted);
  const toggleMute = useGame((s) => s.toggleMute);
  const shape = useGame((s) => s.shape);
  const formation = useGame((s) => s.formation);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [off, setOff] = useState<string | null>(null);
  const [subsOpen, setSubsOpen] = useState(false);
  const [shapesOpen, setShapesOpen] = useState(false);
  const [wash, setWash] = useState(false);
  const makeSub = useGame((s) => s.makeSub);
  const players = useGame((s) => s.players);
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
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const current = useGame.getState().live;
      if (current && !current.finished && !current.paused) {
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
  const clock =
    live.finished
      ? live.period === "pens"
        ? "Pens"
        : "FT"
      : live.period === "pens"
        ? "Pens"
        : live.period === "et"
          ? `${live.minute}' ET`
          : `${live.minute}'`;
  const breakPause =
    live.paused &&
    !live.finished &&
    (live.minute === 45 || live.minute === 90 || live.minute === 105);

  const mentality = side === "home" ? live.homeMentality : live.awayMentality;
  const liveForm = side === "home" ? live.homeForm : live.awayForm;

  return (
    <div className="fc-shell mx-auto flex h-dvh max-w-md flex-col overflow-hidden">
      <header className="fc-header safe-top flex shrink-0 items-end justify-between gap-3 px-4 pb-3">
        <div className="min-w-0">
          <div className="text-xs tracking-wide text-white/70 uppercase">{live.weekLabel}{live.period === "et" ? " · Extra time" : live.period === "pens" ? " · Penalties" : ""}</div>
          <div className="mt-1 truncate font-display text-3xl leading-none text-white uppercase">
            {home?.short}
            <span key={`h-${live.homeScore}`} className="score-pop inline-block text-[var(--color-fc-lime)]">
              {" "}
              {live.homeScore}
            </span>
            <span className="text-white/50">–</span>
            <span key={`a-${live.awayScore}`} className="score-pop inline-block text-[var(--color-fc-lime)]">
              {live.awayScore}{" "}
            </span>
            {away?.short}
          </div>
          {live.period === "pens" ? (
            <div className="mt-1 text-sm text-[var(--color-fc-lime)] tabular-nums">
              Pens {live.penHome}–{live.penAway}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={toggleMute}
            className="press flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xs font-medium text-white"
          >
            {muted ? "Off" : "Snd"}
          </button>
          <div className="rounded-xl bg-[var(--color-fc-lime)] px-3 py-2 font-display text-3xl leading-none text-black tabular-nums">
            {clock}
          </div>
        </div>
      </header>
      <div className="relative min-h-36 flex-1 px-4">
        <canvas ref={canvasRef} className="h-full w-full rounded-2xl border border-line bg-pitch" />
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
            <Btn kind="quiet" onClick={() => yell("encourage")}>
              Encourage
            </Btn>
            <Btn kind="quiet" onClick={() => yell("demand")}>
              Demand
            </Btn>
            <Btn kind="ghost" onClick={() => yell("calm")}>
              Calm
            </Btn>
            <Btn kind="ghost" onClick={() => setSubsOpen((v) => !v)}>
              Subs {subs}/5
            </Btn>
            {breakPause ? (
              <Btn
                kind="quiet"
                className="col-span-2"
                onClick={() => setShapesOpen((v) => !v)}
              >
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
          <Panel className="max-h-52 overflow-y-auto">
            <div className="text-xs text-muted">Pick who comes off, then who comes on.</div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <Kicker>On</Kicker>
                {xi.map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p || live.off.includes(id)) return null;
                  return (
                    <button key={id} type="button" onClick={() => setOff(id)} className={`flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm ${off === id ? "bg-primary text-bg" : ""}`}>
                      <span>
                        {p.name} <span className="text-xs">{p.pos}</span>
                      </span>
                      <span className="tabular-nums">{(live.ratings[id] ?? 6).toFixed(1)}</span>
                    </button>
                  );
                })}
              </div>
              <div>
                <Kicker>Bench</Kicker>
                {bench.map((id) => {
                  const p = players.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <button
                      key={id}
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm"
                      onClick={() => {
                        if (off) {
                          makeSub(off, id);
                          setOff(null);
                        }
                      }}
                    >
                      <span>
                        {p.name} <span className="text-xs">{p.pos}</span>
                      </span>
                      <span className="tabular-nums">{ovr(p)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        ) : null}
        {live.finished ? (
          <Btn onClick={toReport}>See the report</Btn>
        ) : null}
      </div>
    </div>
  );
}

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
  }
  const k = Math.min(1, dt * 4.5);
  for (const [id, target] of Object.entries(live.dots)) {
    const cur = shown.dots[id] ?? { ...target };
    cur.x += (target.x - cur.x) * k;
    cur.y += (target.y - cur.y) * k;
    shown.dots[id] = cur;
  }
  shown.ball.x += (live.ball.x - shown.ball.x) * k;
  shown.ball.y += (live.ball.y - shown.ball.y) * k;

  ctx.fillStyle = "#123824";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? "#123824" : "#16462c";
    ctx.fillRect((i * w) / 8, 0, w / 8 + 1, h);
  }
  const m = 14;
  ctx.strokeStyle = "rgba(231,242,234,0.8)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  ctx.beginPath();
  ctx.moveTo(w / 2, m);
  ctx.lineTo(w / 2, h - m);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  const boxW = (w - m * 2) * 0.16;
  const boxH = (h - m * 2) * 0.52;
  ctx.strokeRect(m, h / 2 - boxH / 2, boxW, boxH);
  ctx.strokeRect(w - m - boxW, h / 2 - boxH / 2, boxW, boxH);
  ctx.strokeStyle = "#d6b25e";
  ctx.strokeRect(m - 7, h / 2 - 16, 7, 32);
  ctx.strokeRect(w - m, h / 2 - 16, 7, 32);

  const home = state.clubs.find((c) => c.id === live.homeId);
  const away = state.clubs.find((c) => c.id === live.awayId);
  const px = (x: number) => m + (x / 100) * (w - m * 2);
  const py = (y: number) => m + (y / 100) * (h - m * 2);
  const drawSide = (ids: string[], club: { primary: string; secondary: string } | undefined) => {
    for (const id of ids) {
      if (live.off.includes(id)) continue;
      const d = shown.dots[id];
      if (!d) continue;
      ctx.beginPath();
      ctx.fillStyle = club?.primary ?? "#efe6d2";
      ctx.arc(px(d.x), py(d.y), 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = club?.secondary ?? inkFor(club?.primary ?? "#142016");
      ctx.stroke();
    }
  };
  drawSide(live.homeXi, home);
  drawSide(live.awayXi, away);
  ctx.beginPath();
  ctx.fillStyle = "#f4f7f2";
  ctx.arc(px(shown.ball.x), py(shown.ball.y), 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#142016";
  ctx.stroke();
}
