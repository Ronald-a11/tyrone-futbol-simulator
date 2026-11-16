import { useMemo, useState, type ReactNode } from "react";
import { AvatarPortrait } from "@/components/game/AvatarPortrait";
import {
  STAND_IDS,
  STANDS,
  TIER_META,
  FORMATION_IDS,
  FORMATIONS,
  PHILOSOPHIES,
  divisionBuildScale,
  nextBuild,
  staffCap,
  staffSlotsForTier,
  standFacts,
  standsOf,
} from "@/game/data";
import {
  ACHIEVEMENT_DEFS,
  CHAIRMAN_AVATARS,
  SUPER_STADIUM_COST,
  budgetLabel,
  facRating,
  facilityStepCost,
  outletCrowdCap,
  outletProfitPerSale,
  outletUpgradeCost,
  makeManagerPool,
  seasonMonthLabel,
  transferCap,
  facilityPointCost,
  weeklyFacilityCost,
} from "@/game/fc";
import { maskOvr, ovr, valueFor } from "@/game/players";
import { euroBoards, otherLeagueBoards, seasonLeaders } from "@/game/scout";
import { useGame } from "@/game/store";
import type { BudgetMode, BuildUp, LineHeight, Player, Position, Screen, TrainingFocus } from "@/game/types";
import { money, type MoneyCurrency } from "@/game/util";
import { Crest } from "./ui";
import {
  USER,
  currentWeek,
  ledger,
  leagueTable,
  tablePos,
  userClub,
  userFixture,
  suggestTargets,
  userPlayers,
  wageBill,
} from "@/game/world";
import { autoPromo, playoffBand } from "@/game/england";
import {
  FcBtn,
  FcCard,
  FcFooter,
  FcHeader,
  FcSelectRow,
  FcShell,
  FcTile,
  FormDots,
  MoneyBag,
  PitchMark,
  TileGlyph,
  formatMoney,
  posTone,
} from "./fc/chrome";

export function Hub() {
  const screen = useGame((s) => s.screen);
  const notice = useGame((s) => s.notice);
  const clear = useGame((s) => s.clearNotice);
  return (
    <div className="app-bg min-h-dvh">
      {notice ? (
        <button
          type="button"
          onClick={clear}
          className="notice-in fixed top-12 right-0 left-0 z-40 mx-auto max-w-[430px] px-3"
        >
          <div className="rounded-xl border border-white/10 bg-[var(--color-fc-navy)] px-3 py-2.5 text-center text-sm font-medium text-white shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
            {notice}
          </div>
        </button>
      ) : null}
      {screen === "dash" && <Dashboard />}
      {screen === "finances" && <Finances />}
      {screen === "budget" && <Budget />}
      {screen === "fans" && <Fans />}
      {screen === "stadium" && <StadiumPits />}
      {screen === "facilities" && <Facilities />}
      {screen === "pitch" && <PitchImprove />}
      {screen === "super" && <SuperStadium />}
      {screen === "squad" && <SquadScreen />}
      {screen === "squadStats" && <SquadStats />}
      {screen === "squadGoals" && <SquadGoals />}
      {screen === "leaders" && <LeadersScreen />}
      {screen === "chart" && <ChartScreen />}
      {screen === "fixtures" && <Fixtures />}
      {screen === "table" && <TableScreen />}
      {screen === "world" && <WorldLeagues />}
      {screen === "manager" && <ManagerScreen />}
      {screen === "tactics" && <TacticsBoard />}
      {screen === "managersPool" && <ManagersPool />}
      {screen === "youth" && <YouthTraining kind="academy" />}
      {screen === "training" && <YouthTraining kind="training" />}
      {screen === "trophies" && <Trophies />}
      {screen === "achievements" && <Achievements />}
      {screen === "records" && <Records />}
      {screen === "career" && <Career />}
      {screen === "market" && <Market />}
      {screen === "inbox" && <Inbox />}
      {screen === "settings" && <Settings />}
      {screen === "medical" && <Medical />}
      {screen === "rivals" && <Rivals />}
      {screen === "history" && <HistoryScreen />}
      {screen === "finHistory" && <FinHistory />}
      {screen === "clubList" && <ClubList />}
      {screen === "highscores" && <Highscores />}
      {screen === "about" && <About />}
    </div>
  );
}

function go(screen: Screen) {
  useGame.getState().setScreen(screen);
}

function Dashboard() {
  const state = useGame();
  const club = userClub(state);
  const tie = userFixture(state);
  const foe = tie ? state.clubs.find((c) => c.id === (tie.homeId === USER ? tie.awayId : tie.homeId)) : null;
  const home = tie?.homeId === USER;
  const pos = tablePos(state);
  const squad = userPlayers(state).filter((p) => p.loan !== "out");
  const xiPlayers = state.xi
    .map((id) => squad.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);
  const avgSquad = xiPlayers.length
    ? Math.round(xiPlayers.reduce((s, p) => s + ovr(p), 0) / xiPlayers.length)
    : squad.length
      ? Math.round(squad.reduce((s, p) => s + ovr(p), 0) / squad.length)
      : 0;
  const mgr = state.manager;
  const avgMgr = mgr ? Math.round((mgr.m + mgr.c + mgr.t) / 3) : 30;
  const youthR = facRating(state.facilities.academy);
  const trainR = facRating(state.facilities.training);
  const quickSim = useGame((s) => s.quickSim);
  const toPress = useGame((s) => s.toPress);
  const advanceBye = useGame((s) => s.advanceBye);
  const week = currentWeek(state);

  const footer = tie && foe
    ? [
        {
          label: `${week?.kind === "friendly" ? "Friendly" : "Sim"}: ${foe.short} (${home ? "H" : "A"})`,
          onClick: quickSim,
          primary: true,
        },
        { label: "Watch (mgr)", onClick: toPress },
      ]
    : [{ label: week ? "Advance week" : "Season break", onClick: advanceBye, primary: true }];

  const month = seasonMonthLabel(state.weekIndex);
  return (
    <FcShell footer={<FcFooter buttons={footer} />}>
      <FcHeader title="Desk" brand onSettings={() => go("settings")} onHelp={() => go("about")} />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3 pt-2">
        <div className="fc-hero mx-auto w-full rounded-xl px-3 py-2.5 text-center">
          <div className="font-display text-[1.55rem] leading-none text-[var(--color-fc-navy)] uppercase">
            {club?.name ?? "Club"}
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-2 font-sans text-[0.75rem] font-extrabold text-[var(--color-fc-navy)]/80">
            <span className="tabular-nums">
              {month} {2025 + state.season}
            </span>
            <span className="fc-chip">{TIER_META[state.tier].name}</span>
            <span className="tabular-nums">Wk {state.weekIndex}</span>
          </div>
        </div>
        <div className="rise rise-2 grid grid-cols-4 gap-2">
          <FcTile label="Weekend" value={state.weekIndex} tone="white" onClick={() => go("fixtures")} />
          <FcTile label="League" value={pos} tone="white" onClick={() => go("table")} />
          <FcTile label="Money" value={formatMoney(state.cash)} tone="white" wide onClick={() => go("finances")} />
          <FcTile label="Squad" value={avgSquad} tone="navy" onClick={() => go("squad")} />
          <FcTile label="Manager" value={avgMgr} tone="navy" onClick={() => go("manager")} />
          <FcTile label="Training" value={trainR} tone="navy" onClick={() => go("training")} />
          <FcTile label="Youth" value={youthR} tone="navy" onClick={() => go("youth")} />
          <FcTile label="Scorers" tone="navy" onClick={() => go("leaders")}>
            <TileGlyph kind="star" />
          </FcTile>
          <FcTile label="World" tone="navy" onClick={() => go("world")}>
            <TileGlyph kind="chart" />
          </FcTile>
          <FcTile label="Trophies" value={state.trophies.length} tone="green" onClick={() => go("trophies")} />
          <FcTile label="Achieved" value={state.achievements.length} tone="green" onClick={() => go("achievements")} />
          <FcTile label="Records" tone="green" onClick={() => go("records")}>
            <TileGlyph kind="star" />
          </FcTile>
          <FcTile label="History" tone="green" onClick={() => go("history")}>
            <TileGlyph kind="chart" />
          </FcTile>
          <FcTile label="Fans happy?" tone="lime" wide onClick={() => go("fans")}>
            <div className="mt-1 flex w-full justify-around font-sans text-xs font-extrabold">
              <span>{state.fanMgrHappy}% Mgr</span>
              <span>{state.fanChairHappy}% Chair</span>
            </div>
          </FcTile>
          <FcTile label="Stadium" tone="lime" onClick={() => go("stadium")}>
            <TileGlyph kind="pitch" />
          </FcTile>
          <FcTile label="Chairman" tone="lime" onClick={() => go("career")}>
            <AvatarPortrait id={state.chairmanAvatar} size={30} className="mt-0.5 rounded-lg" />
          </FcTile>
        </div>
        <div className="rise rise-3 flex justify-center gap-1.5 py-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={`h-2 w-6 rounded-full ${
                i < state.trophies.length ? "bg-[var(--color-fc-lime)]" : "bg-white/20"
              }`}
              title={state.trophies[i]?.label ?? "Empty shelf"}
            />
          ))}
        </div>
        <FormDots form={state.form} />
        <LeadersPeek />
        {week ? (
          <p className="text-center font-sans text-[0.78rem] font-bold text-white/90">
            {week.label}
            {state.newsQueue.some((c) => c.kind === "bid") ? " · Bid waiting" : ""}
            {state.inbox.length ? ` · Mail ${state.inbox.length}` : ""}
          </p>
        ) : null}
        <DeskNotes />
      </div>
    </FcShell>
  );
}

function LeadersPeek() {
  const state = useGame();
  const leaders = useMemo(() => seasonLeaders(state), [state.players, state.weekIndex, state.tier]);
  const topG = leaders.scorers[0];
  const topA = leaders.assists[0];
  if (!topG && !topA) return null;
  const clubG = topG ? state.clubs.find((c) => c.id === topG.clubId) : null;
  const clubA = topA ? state.clubs.find((c) => c.id === topA.clubId) : null;
  return (
    <button
      type="button"
      onClick={() => go("leaders")}
      className="w-full rounded-xl bg-white/95 px-3 py-2.5 text-left shadow-md"
    >
      <div className="font-display text-sm uppercase text-[var(--color-fc-navy)]">League leaders</div>
      <div className="mt-1 grid gap-1.5 text-xs font-extrabold">
        {topG ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <AvatarPortrait id={playerFaceId(topG.id)} size={24} className="rounded-full" />
              {clubG ? <Crest primary={clubG.primary} secondary={clubG.secondary} short={clubG.short} size={16} /> : null}
              <span className="truncate">
                {topG.name}
                <span className="ml-1 font-bold text-black/45">{clubG?.short ?? ""}</span>
              </span>
            </span>
            <span className="tabular-nums text-[#3E7D32]">{topG.goals}G</span>
          </div>
        ) : null}
        {topA ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              <AvatarPortrait id={playerFaceId(topA.id)} size={24} className="rounded-full" />
              {clubA ? <Crest primary={clubA.primary} secondary={clubA.secondary} short={clubA.short} size={16} /> : null}
              <span className="truncate">
                {topA.name}
                <span className="ml-1 font-bold text-black/45">{clubA?.short ?? ""}</span>
              </span>
            </span>
            <span className="tabular-nums text-[#1c3d66]">{topA.assists}A</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

function DeskNotes() {
  const state = useGame();
  const hurt = userPlayers(state).filter((p) => p.injured > 0);
  const saved = (state.targets ?? [])
    .map((t) => ({ ...t, player: state.players.find((p) => p.id === t.playerId && p.clubId === "market") }))
    .filter((t) => t.player);
  const shown = saved.length
    ? saved
    : suggestTargets(state)
        .map((t) => ({ ...t, player: state.players.find((p) => p.id === t.playerId && p.clubId === "market") }))
        .filter((t) => t.player);
  return (
    <div className="grid gap-2">
      {hurt.length ? (
        <button type="button" onClick={() => go("medical")} className="rounded-xl border border-white/10 bg-[#a50e0e] px-3 py-2.5 text-left text-xs text-white shadow-md">
          <div className="font-display text-[0.85rem] uppercase">Injury news</div>
          {hurt.slice(0, 3).map((p) => (
            <div key={p.id} className="mt-1 flex items-center gap-2">
              <AvatarPortrait id={playerFaceId(p.id)} size={22} className="rounded-full" />
              <span>
                {p.name} ({p.pos}) — {p.injured} week{p.injured === 1 ? "" : "s"}
              </span>
            </div>
          ))}
        </button>
      ) : null}
      {shown.length ? (
        <div className="rounded-xl bg-white px-3 py-2 text-left text-xs text-black shadow-sm">
          <div className="font-bold tracking-wide uppercase text-black/50">{state.manager.name} wants to buy</div>
          {shown.map((t) =>
            t.player ? (
              <button
                key={t.playerId}
                type="button"
                className="mt-2 flex w-full items-center justify-between gap-2 text-left"
                onClick={() => {
                  useGame.getState().openTalks(t.playerId);
                  useGame.setState({ phase: "negotiate" });
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AvatarPortrait id={playerFaceId(t.player.id)} size={28} className="rounded-full" />
                  <span className="min-w-0">
                    <span className="block font-bold">
                      {t.player.name} · {t.player.pos} · {ovr(t.player)}
                    </span>
                    <span className="text-black/60">{t.reason}</span>
                  </span>
                </span>
                <span className="shrink-0 font-bold tabular-nums">{formatMoney(t.player.fee)}</span>
              </button>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}

function Finances() {
  const state = useGame();
  const books = ledger(state);
  const wages = wageBill(state);
  const bonusPct = state.winBonusPct ?? 20;
  const recommended = Math.round((books.seasonIn * 0.7) / SEASON_WEEKS_SAFE);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Transfers", onClick: () => go("budget") },
            { label: "History", onClick: () => go("finHistory") },
          ]}
        />
      }
    >
      <FcHeader title="Finances" onSettings={() => go("settings")} />
      <div className="flex flex-1 flex-col gap-3 px-3 py-3">
        <FcCard>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#3E7D32] text-2xl">💰</div>
            <div>
              <div className="font-display text-lg font-bold uppercase">Bank balance</div>
              <div className="mt-1 inline-block rounded bg-[var(--color-fc-forest)] px-2 py-0.5 font-display text-xl font-bold text-white">
                {formatMoney(state.cash)}
              </div>
              <div className="mt-1 text-xs text-black/60">Overdraft: {formatMoney(state.debt)}</div>
            </div>
          </div>
          <dl className="mt-4 grid gap-1.5 text-sm">
            <Row k="Current wages" v={formatMoney(wages)} />
            <Row k={`Wages + win bonus (${bonusPct}%)`} v={formatMoney(Math.round(wages * (1 + bonusPct / 100)))} muted />
            <Row k="Recommended max wages" v={formatMoney(recommended)} />
            <Row k="Ticket price" v={`£${state.ticketPrice ?? 5}`} />
            <Row k="Sponsor" v={`${state.sponsorName} · until S${state.sponsorUntil ?? state.season + 1}`} />
            <Row k="Profit/Loss this year" v={<MoneyBag n={state.seasonProfit} />} />
          </dl>
          <div className="mt-4 font-bold">Want more money?</div>
          <p className="text-xs text-black/60">Boost finances with investment — borrow, or open the transfer budget.</p>
          <div className="mt-2 grid gap-2">
            <FcBtn className="w-full" kind="white" onClick={() => useGame.getState().takeLoan()}>
              Borrow on the overdraft
            </FcBtn>
            <FcBtn className="w-full" kind="lime" onClick={() => go("budget")}>
              Set transfer budget
            </FcBtn>
            <FcBtn className="w-full" kind="white" disabled={state.debt <= 0} onClick={() => useGame.getState().payDebt()}>
              Repay debt
            </FcBtn>
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

const SEASON_WEEKS_SAFE = 17;

function Budget() {
  const mode = useGame((s) => s.transferBudgetMode);
  const setBudget = useGame((s) => s.setBudget);
  const state = useGame();
  const modes: BudgetMode[] = ["max", "normal", "cautious", "strict", "zero"];
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Set Transfer Budget", onClick: () => go("finances"), primary: true },
            { label: "Cancel", onClick: () => go("finances") },
          ]}
        />
      }
    >
      <FcHeader title="Set Transfer Budget" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="font-display text-xl font-bold uppercase">Set transfer budget</div>
          <p className="mt-1 text-sm text-black/70">The manager understands you would like to discuss his transfer budget.</p>
          <div className="mt-3 grid gap-2">
            {modes.map((m) => {
              const info = budgetLabel(m);
              return (
                <FcSelectRow key={m} selected={mode === m} onClick={() => setBudget(m)}>
                  <span className="font-bold">{info.title}:</span> {info.body}
                </FcSelectRow>
              );
            })}
          </div>
          <p className="mt-3 text-sm font-bold">Cap now: {formatMoney(transferCap(state))}</p>
          <p className="mt-1 text-xs text-black/60">Manager happiness: {state.manager.happiness}%</p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Fans() {
  const state = useGame();
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Rivals", onClick: () => go("rivals") },
          ]}
        />
      }
    >
      <FcHeader title="The Fans" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="font-display text-sm font-bold uppercase text-black/70">Happiness & expectations</div>
          <div className="mt-3 grid gap-4">
            <PersonHappyRow pct={state.fanMgrHappy} label="Happy with Manager" />
            <PersonHappyRow pct={state.fanChairHappy} label="Happy with Chairman" />
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-4 text-sm">
            <li>
              Expectations: <strong>{state.objective}</strong>
            </li>
            <li>
              Atmosphere: Generally <strong>{state.fans >= 70 ? "loud" : state.fans >= 45 ? "steady" : "quiet"}</strong>.
            </li>
            <li>
              Tickets: <strong>£{state.ticketPrice ?? 5}</strong>
            </li>
          </ul>
          <div className="mt-5 font-display text-sm font-bold uppercase text-black/70">Worldwide popularity</div>
          <div className="mt-2 flex items-end gap-3">
            <div className="text-4xl" aria-hidden>
              🌍
            </div>
            <div className="font-display text-3xl font-bold">{Math.min(10, Math.floor(state.fans / 10))} / 10</div>
          </div>
          <p className="mt-2 text-sm text-black/70">
            Popularity rises with trophies, star signings and big nights. Higher fame means more merchandise cash.
          </p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function PersonHappyRow({ pct, label }: { pct: number; label: string }) {
  const n = Math.round(Math.max(0, Math.min(100, pct)) / 10);
  return (
    <div>
      <div className="mb-1 text-xs font-bold text-black/60">{label}</div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 justify-between gap-0.5">
          {Array.from({ length: 10 }, (_, i) => (
            <span
              key={i}
              className={`flex h-7 w-5 items-center justify-center rounded-sm text-sm ${i < n ? "bg-[#3E7D32] text-white" : "bg-[#a50e0e] text-white/90"}`}
              aria-hidden
            >
              👤
            </span>
          ))}
        </div>
        <div className="w-12 text-right font-display text-lg font-bold text-[#3E7D32] tabular-nums">{Math.round(pct)}%</div>
      </div>
    </div>
  );
}

function StadiumPits() {
  const state = useGame();
  const stands = standsOf(state);
  const facts = standFacts(stands);
  const club = userClub(state);
  const [selected, setSelected] = useState<keyof typeof stands>("west");
  const job = nextBuild(selected, stands[selected]);
  const cost = job ? Math.max(5_000, Math.round((job.cost * divisionBuildScale(state.tier)) / 1000) * 1000) : 0;
  const weeks = 2 + stands[selected];
  const active = state.standJob;
  const builtYear = 2025 + state.season;
  const groundImg = state.superStadium ? "/stadium/super.jpg" : "/stadium/ground-nl.jpg";
  const standRows = STAND_IDS.map((id) => {
    const tier = stands[id];
    return {
      id,
      name: STANDS[id].name,
      built: tier > 0 || stands[id] === 0 ? String(builtYear - Math.max(0, 1 - tier)) : "—",
      cap: STANDS[id].seats[tier] ?? 0,
    };
  });
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Facilities", onClick: () => go("facilities") },
            { label: "Super Stadium", onClick: () => go("super") },
          ]}
        />
      }
    >
      <FcHeader title={state.stadiumName || club?.stadium || "The Pits"} onSettings={() => go("settings")} />
      <div className="px-3 py-2">
        <div className="relative mb-2 overflow-hidden rounded-xl shadow-md">
          <img
            src={groundImg}
            alt=""
            className="h-36 w-full object-cover"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <div className="absolute right-2 bottom-2 rounded bg-black/55 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
            Cap {facts.seats.toLocaleString("en-GB")}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go("medical")}
          className="mb-2 flex w-full items-center justify-between rounded-xl bg-white/90 px-3 py-2.5 text-left text-sm shadow"
        >
          <span className="font-semibold text-[#3E7D32]">Medical Centre · Level {state.facilities.medical}/5</span>
          <span className="text-xs text-black/50">Upgrade ›</span>
        </button>
        <FcCard>
          <div className="grid grid-cols-[1fr_4.5rem_5rem] gap-1 border-b border-black/15 pb-1 text-[0.65rem] font-semibold tracking-wide text-black/50 uppercase">
            <span />
            <span className="text-right">Built</span>
            <span className="text-right">Capacity</span>
          </div>
          <ul>
            {standRows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row.id)}
                  className={`grid w-full grid-cols-[1fr_4.5rem_5rem] items-center gap-1 border-b border-black/10 py-2 text-left text-sm ${
                    selected === row.id ? "bg-[var(--color-fc-lime)]/40" : ""
                  }`}
                >
                  <span className="inline-flex w-fit rounded-full bg-white px-2.5 py-0.5 font-semibold uppercase shadow-sm">
                    {row.name}
                  </span>
                  <span className="text-right tabular-nums font-semibold">{row.built}</span>
                  <span className="text-right tabular-nums font-semibold">{row.cap.toLocaleString("en-GB")}</span>
                </button>
              </li>
            ))}
            <li className="grid grid-cols-[1fr_4.5rem_5rem] items-center gap-1 border-b border-black/10 py-2 text-sm">
              <span className="inline-flex w-fit rounded-full bg-white px-2.5 py-0.5 font-semibold uppercase shadow-sm">Corners</span>
              <span className="text-right tabular-nums font-semibold">—</span>
              <span className="text-right tabular-nums font-semibold">0</span>
            </li>
            <li>
              <button
                type="button"
                onClick={() => go("pitch")}
                className="grid w-full grid-cols-[1fr_4.5rem_5rem] items-center gap-1 pt-2 text-left text-sm"
              >
                <span className="font-semibold text-[#3E7D32]">Pitch ({state.pitchQuality}/99) · Improve ›</span>
                <span />
                <span className="text-right tabular-nums text-base font-semibold">{facts.seats.toLocaleString("en-GB")}</span>
              </button>
            </li>
          </ul>
          {active?.stand === selected ? (
            <p className="mt-3 text-sm font-semibold text-[#3E7D32]">
              {STANDS[selected].name}: builders on site · {active.weeks} week{active.weeks === 1 ? "" : "s"} left
            </p>
          ) : job ? (
            <div className="mt-3 border-t border-black/10 pt-3 text-sm">
              <div className="font-display text-base uppercase">{STANDS[selected].name}</div>
              <p className="mt-1 text-black/70">{job.work}</p>
              <p className="mt-1 font-semibold">
                {formatMoney(cost)} · {weeks} weeks · +{job.seats.toLocaleString("en-GB")} seats
              </p>
              <FcBtn
                className="mt-2 w-full"
                kind="lime"
                disabled={!!active}
                onClick={() => useGame.getState().liftStand(selected)}
              >
                {active ? "Job already running" : "Start works"}
              </FcBtn>
            </div>
          ) : (
            <p className="mt-3 text-sm font-semibold text-black/55">{STANDS[selected].name} is finished.</p>
          )}
        </FcCard>
      </div>
    </FcShell>
  );
}

function PitchImprove() {
  const state = useGame();
  const current = state.pitchQuality;
  const [target, setTarget] = useState(Math.min(99, current + 1));
  const setPitch = useGame((s) => s.setPitch);
  const delta = Math.max(0, target - current);
  const cost =
    delta > 0
      ? Array.from({ length: delta }, (_, i) => facilityPointCost(current + i)).reduce((a, b) => a + b, 0)
      : 0;
  const img = current < 55 ? "/stadium/pitch-worn.jpg" : "/stadium/pitch-good.jpg";
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("stadium") },
            {
              label: "Improve Pitch",
              primary: true,
              disabled: target <= current || cost > state.cash,
              onClick: () => {
                const before = useGame.getState().pitchQuality;
                setPitch(target - before);
                const after = useGame.getState().pitchQuality;
                setTarget(Math.min(99, after + 1));
              },
            },
          ]}
        />
      }
    >
      <FcHeader title="Pitch Improvements" />
      <div className="px-3 py-3">
        <div className="mb-3 overflow-hidden rounded-xl shadow-md">
          <img src={img} alt="" className="h-36 w-full object-cover" draggable={false} />
        </div>
        <FcCard>
          <div className="flex items-center justify-between gap-2 border-b border-black/10 py-3">
            <div className="flex gap-1">
              <FcBtn kind="red" onClick={() => setTarget((t) => Math.max(current, t - 5))}>
                {"<<"} 5
              </FcBtn>
              <FcBtn kind="red" onClick={() => setTarget((t) => Math.max(current, t - 1))}>
                {"<"} 1
              </FcBtn>
            </div>
            <div className="font-display text-4xl tabular-nums">{target}</div>
            <div className="flex gap-1">
              <FcBtn kind="lime" onClick={() => setTarget((t) => Math.min(99, t + 1))}>
                1 {">"}
              </FcBtn>
              <FcBtn kind="lime" onClick={() => setTarget((t) => Math.min(99, t + 5))}>
                5 {">>"}
              </FcBtn>
            </div>
          </div>
          <dl className="mt-3 grid gap-1 text-sm">
            <Row k="Current Pitch Condition" v={String(current)} />
            <Row k="Cost to Improve" v={delta > 0 ? formatMoney(cost) : "—"} />
            <Row k="Bank balance" v={formatMoney(state.cash)} />
          </dl>
          <p className="mt-2 text-xs text-black/55">A better surface cuts injuries and lifts home form.</p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Facilities() {
  const state = useGame();
  const liftOutlet = useGame((s) => s.liftOutlet);
  const [tab, setTab] = useState<"food" | "merch">("food");
  const outlets = state.outlets;
  const cap = outletCrowdCap(outlets);
  const pps = outletProfitPerSale(outlets);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("stadium") }]} />}>
      <FcHeader title="Stadium Facilities" />
      <div className="px-3 py-2">
        <PitchMark />
        <FcCard>
          <div className="grid grid-cols-2 gap-1 rounded-md bg-black/5 p-1">
            <button
              type="button"
              className={`rounded py-2 font-display text-sm font-bold uppercase ${tab === "food" ? "bg-[var(--color-fc-lime)]" : "bg-white"}`}
              onClick={() => setTab("food")}
            >
              Food & Drink
            </button>
            <button
              type="button"
              className={`rounded py-2 font-display text-sm font-bold uppercase ${tab === "merch" ? "bg-[var(--color-fc-lime)]" : "bg-white"}`}
              onClick={() => setTab("merch")}
            >
              Merchandise
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {tab === "food" ? (
              <>
                <OutletRow label="Burger Van" level={outlets.burger} onUp={() => liftOutlet("burger")} icon="🚐" />
                <OutletRow label="Food Counter" level={outlets.counter} onUp={() => liftOutlet("counter")} icon="🍟" />
                <OutletRow label="Cafe/Bar" level={outlets.cafe} onUp={() => liftOutlet("cafe")} icon="🍺" />
              </>
            ) : (
              <OutletRow label="Club Shop" level={outlets.merch} onUp={() => liftOutlet("merch")} icon="👕" />
            )}
          </div>
          <p className="mt-4 text-sm">
            Your food and drink outlets can cope with crowds of up to <strong>{cap.toLocaleString("en-GB")}</strong> and
            deliver average profits of <strong>£{pps.toFixed(2)}</strong> per sale.
          </p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function OutletRow({
  label,
  level,
  onUp,
  icon,
}: {
  label: string;
  level: number;
  onUp: () => void;
  icon: string;
}) {
  const cost = level >= 4 ? 0 : outletUpgradeCost(level);
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="font-medium">{label}</div>
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            onClick={onUp}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-sm ${i < level ? "bg-[var(--color-fc-lime)]" : "bg-black/15"}`}
          >
            {icon}
          </button>
        ))}
        {level < 4 ? <span className="ml-1 text-xs text-black/50">{formatMoney(cost)}</span> : null}
      </div>
    </div>
  );
}

function SuperStadium() {
  const state = useGame();
  const buySuper = useGame((s) => s.buySuper);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("stadium") }]} />}>
      <FcHeader title="Super Stadium" />
      <div className="px-3 py-3">
        <div className="relative mb-3 overflow-hidden rounded-xl shadow-lg">
          <img
            src="/stadium/super.jpg"
            alt=""
            className="h-44 w-full object-cover"
            draggable={false}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-xs font-semibold text-white">
            {state.superStadium ? "Your ground" : "Dream ground · 120k scale"}
          </div>
        </div>
        <FcCard>
          <p className="text-sm leading-relaxed text-black/80">
            A purpose-built bowl with full roofs, floodlights and lower running costs than an old-fashioned ground.
            Ready the week you buy it.
          </p>
          {state.superStadium ? (
            <p className="mt-3 font-semibold text-[#3E7D32]">Already built — stands maxed, pitch at elite level.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              <FcBtn kind="lime" onClick={buySuper}>
                Buy with {formatMoney(SUPER_STADIUM_COST)}
              </FcBtn>
              <FcBtn kind="white" disabled>
                Buy with £3.99 in-app (unavailable)
              </FcBtn>
            </div>
          )}
        </FcCard>
      </div>
    </FcShell>
  );
}

function posSortKey(pos: string) {
  const g = posGroup(pos);
  const order = { G: 0, D: 1, M: 2, A: 3 }[g];
  const fine =
    pos === "GK"
      ? 0
      : pos === "CB"
        ? 1
        : pos === "LB"
          ? 2
          : pos === "RB"
            ? 3
            : pos === "CDM"
              ? 4
              : pos === "CM"
                ? 5
                : pos === "CAM"
                  ? 6
                  : pos === "LW"
                    ? 7
                    : pos === "RW"
                      ? 8
                      : 9;
  return order * 20 + fine;
}

function sortByLine(a: Player, b: Player) {
  return posSortKey(a.pos) - posSortKey(b.pos) || ovr(b) - ovr(a);
}

function SquadAlignPitch({
  formation,
  xi,
  players,
  avg,
}: {
  formation: string;
  xi: string[];
  players: Player[];
  avg: number;
}) {
  const slots = FORMATIONS[formation as keyof typeof FORMATIONS] ?? FORMATIONS["4-3-3"];
  const byId = new Map(players.map((p) => [p.id, p]));
  return (
    <div className="mt-2 overflow-hidden rounded-xl bg-[#1a5c2e] shadow-md">
      <div className="flex items-center justify-between bg-black/25 px-3 py-1.5 text-xs font-extrabold text-white uppercase">
        <span>
          {formation} · How they line up
        </span>
        <span className="tabular-nums">XI avg {avg}</span>
      </div>
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[340px] bg-[radial-gradient(ellipse_at_center,#3d9a4a_0%,#1f6b32_70%)]">
        <div className="pointer-events-none absolute inset-[6%] rounded-sm border border-white/35">
          <div className="absolute top-1/2 left-0 h-px w-full bg-white/35" />
          <div className="absolute top-1/2 left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/35" />
        </div>
        {slots.map((slot, i) => {
          const p = byId.get(xi[i] ?? "");
          const g = p ? posGroup(p.pos) : posGroup(slot.pos);
          const tag =
            g === "G" ? "bg-[#1f8a5b]" : g === "D" ? "bg-[#1c3d66]" : g === "M" ? "bg-[#a50e0e]" : "bg-[#c97a1a]";
          const surname = p ? (p.name.split(" ").pop() ?? p.name) : slot.pos;
          return (
            <div
              key={`${slot.pos}-${i}`}
              className="absolute flex w-[22%] -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${slot.y}%`, top: `${100 - slot.x}%` }}
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-[var(--color-fc-lime-soft)] shadow">
                {p ? <AvatarPortrait id={playerFaceId(p.id)} size={32} /> : <span className="text-[0.55rem] font-bold">{slot.pos}</span>}
              </span>
              <span className={`mt-0.5 max-w-full truncate rounded px-1 py-0.5 text-[0.55rem] font-extrabold text-white uppercase shadow ${tag}`}>
                {surname}
                {p ? ` · ${ovr(p)}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SquadScreen() {
  const state = useGame();
  const [picked, setPicked] = useState<string | null>(null);
  const [tab, setTab] = useState<"stats" | "info">("info");
  const xi = new Set(state.xi);
  const players = userPlayers(state)
    .filter((p) => p.loan !== "out")
    .slice()
    .sort(sortByLine);
  const loaned = userPlayers(state).filter((p) => p.loan === "out");
  const first = players.filter((p) => xi.has(p.id)).sort(sortByLine);
  const reserves = players.filter((p) => !xi.has(p.id)).sort(sortByLine);
  const detail = state.players.find((p) => p.id === picked);
  const avgShown = first.length
    ? Math.round(first.reduce((s, p) => s + ovr(p), 0) / first.length)
    : 0;
  const listForSale = useGame((s) => s.listForSale);
  const loanAway = useGame((s) => s.loanAway);
  const renewPlayer = useGame((s) => s.renewPlayer);
  const recallPlayer = useGame((s) => s.recallPlayer);
  const g = detail ? posGroup(detail.pos) : "A";
  const roleBlurb = detail
    ? detail.age <= 21
      ? `Young ${xi.has(detail.id) ? "first-team" : "reserve"} ${detail.pos === "GK" ? "goalkeeper" : detail.pos}`
      : `${xi.has(detail.id) ? "First-team" : "Reserve"} ${detail.pos === "GK" ? "goalkeeper" : detail.pos}`
    : "";
  return (
    <FcShell
      footer={
        detail ? (
          <FcFooter
            buttons={[
              { label: "Back", onClick: () => setPicked(null) },
              { label: "New contract", onClick: () => renewPlayer(detail.id), primary: true },
              {
                label: detail.listed ? "Unlist" : "List for sale",
                onClick: () => listForSale(detail.id),
              },
            ]}
          />
        ) : (
          <FcFooter
            buttons={[
              { label: "Back", onClick: () => go("dash") },
              { label: "Squad Stats", onClick: () => go("squadStats") },
              { label: "Games/Goals", onClick: () => go("squadGoals") },
            ]}
          />
        )
      }
    >
      <FcHeader title={detail ? "Player Profile" : "Your Squad"} />
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {detail ? (
          <FcCard className="mt-2">
            <div className="flex items-start gap-3">
              <AvatarPortrait id={playerFaceId(detail.id)} size={72} className="rounded-md" />
              <div className="min-w-0 flex-1">
                <div className="font-display text-2xl leading-none uppercase">{detail.name}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex overflow-hidden rounded text-xs font-extrabold text-white ${posTone(detail.pos)}`}>
                    <span className="bg-black/25 px-1.5 py-0.5">{g}</span>
                    <span className="bg-black px-1.5 py-0.5 tabular-nums">{ovr(detail)}</span>
                  </span>
                  <span className="text-sm font-bold">Age {detail.age}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 rounded bg-black/5 p-1">
              <button
                type="button"
                className={`rounded py-2 text-sm font-extrabold ${tab === "stats" ? "bg-[var(--color-fc-lime)]" : "bg-white"}`}
                onClick={() => setTab("stats")}
              >
                Player Statistics
              </button>
              <button
                type="button"
                className={`rounded py-2 text-sm font-extrabold ${tab === "info" ? "bg-[var(--color-fc-lime)]" : "bg-white"}`}
                onClick={() => setTab("info")}
              >
                Player Information
              </button>
            </div>
            <div className="mt-2 border-t border-black/10 pt-2 text-sm font-bold text-black/70">{roleBlurb}</div>
            {tab === "stats" ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                <Row k="Joined" v={`${2025 + state.season - Math.max(0, 3 - detail.contract)}`} />
                <Row k="This season" v={`${detail.played} games, ${detail.goals} goals, ${detail.assists} assists`} />
                <Row k="Wage" v={`£${detail.wage} pw`} />
                <Row k="Value" v={money(valueFor(detail))} />
                <Row
                  k="Transfer list"
                  v={detail.listed ? `Listed · ask ${money(detail.fee || valueFor(detail))}` : "Not listed"}
                  tone={detail.listed ? "warn" : undefined}
                />
                <Row k="Contract Expires" v={`${2025 + state.season + detail.contract}`} />
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <AttrBar label="Pace" n={detail.attrs.pace} />
                  <AttrBar label="Shoot" n={detail.attrs.shoot} />
                  <AttrBar label="Pass" n={detail.attrs.pass} />
                  <AttrBar label="Dribble" n={detail.attrs.dribble} />
                  <AttrBar label="Defense" n={detail.attrs.defense} />
                  <AttrBar label="Physical" n={detail.attrs.physical} />
                  {detail.pos === "GK" ? <AttrBar label="GK" n={detail.attrs.gk} /> : null}
                </div>
              </ul>
            ) : (
              <ul className="mt-2 space-y-1.5 text-sm">
                <Row k="Current Form" v={detail.ratingN ? (detail.ratingSum / detail.ratingN >= 7 ? "Good" : detail.ratingSum / detail.ratingN < 6 ? "Poor" : "OK") : "OK"} />
                <Row k="Fitness" v={detail.injured > 0 ? `Injured ${detail.injured}w` : detail.fitness >= 75 ? "OK" : "Tired"} />
                <Row
                  k="Happiness"
                  v={
                    detail.morale >= 75
                      ? "Pleased"
                      : detail.morale >= 55
                        ? "OK"
                        : "Unhappy"
                  }
                  tone={detail.morale >= 55 ? "good" : "bad"}
                />
                <Row k="Personality" v={personaOf(detail.name)} tone="good" />
                <Row k="Style" v={detail.attrs.pass >= detail.attrs.shoot ? "Passing" : "Direct"} tone="warn" />
                {detail.banned > 0 ? <Row k="Suspension" v={`${detail.banned} games`} tone="bad" /> : null}
              </ul>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <FcBtn kind="white" disabled={xi.has(detail.id)} onClick={() => loanAway(detail.id)}>
                Loan out
              </FcBtn>
              <FcBtn kind="white" onClick={() => setPicked(null)}>
                Close
              </FcBtn>
            </div>
          </FcCard>
        ) : (
          <>
            <SquadAlignPitch formation={state.formation} xi={state.xi} players={players} avg={avgShown} />
            <SquadBlock title="First Team" rows={first} onPick={setPicked} season={state.season} />
            <SquadBlock title="Reserves" rows={reserves} onPick={setPicked} season={state.season} />
            {loaned.length ? (
              <div className="mt-2">
                <div className="px-1 font-display text-sm text-white uppercase">Out on loan</div>
                <div className="mt-1 space-y-1 rounded-lg bg-white/90 p-2">
                  {loaned.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                      <span>
                        {p.name} <span className="text-black/50">{p.pos}</span>
                      </span>
                      <FcBtn kind="lime" className="min-h-8 px-2 text-[0.65rem]" onClick={() => recallPlayer(p.id)}>
                        Recall
                      </FcBtn>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <p className="mt-2 px-1 text-[0.65rem] font-bold text-white/85">
              Ordered GK → DEF → MID → ATT. XI avg {avgShown}. * Loan / expiring · ** Transfer listed.
            </p>
          </>
        )}
      </div>
    </FcShell>
  );
}

function personaOf(name: string) {
  const personas = ["Quiet", "Calm", "Relaxed", "Determined", "Intense", "Outspoken"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return personas[h % personas.length];
}

function posGroup(pos: string): "G" | "D" | "M" | "A" {
  if (pos === "GK") return "G";
  if (pos === "CB" || pos === "LB" || pos === "RB") return "D";
  if (pos === "CDM" || pos === "CM" || pos === "CAM") return "M";
  return "A";
}

function playerFaceId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % CHAIRMAN_AVATARS.length;
  return CHAIRMAN_AVATARS[h] ?? 0;
}

function AttrBar({ label, n }: { label: string; n: number }) {
  return (
    <div>
      <div className="flex justify-between font-semibold text-black/70">
        <span>{label}</span>
        <span className="tabular-nums">{n}</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full bg-[var(--color-fc-forest)]" style={{ width: `${Math.max(8, Math.min(100, n))}%` }} />
      </div>
    </div>
  );
}

function SquadBlock({
  title,
  rows,
  onPick,
  season,
}: {
  title: string;
  rows: ReturnType<typeof userPlayers>;
  onPick: (id: string) => void;
  season: number;
}) {
  return (
    <div className="mt-2">
      <div className="px-1 font-display text-sm font-bold text-white uppercase">{title}</div>
      <div className="mt-1 overflow-hidden rounded-lg bg-white/90">
        <div className="grid grid-cols-[1.75rem_1fr_1.5rem_2rem_4.5rem_2rem_2.5rem] gap-1 bg-[var(--color-fc-navy)] px-2 py-1 text-[0.6rem] font-bold text-white uppercase">
          <span />
          <span>Player</span>
          <span>Pos</span>
          <span>Rat</span>
          <span>Frm/Fit/Hap</span>
          <span>Age</span>
          <span>Ctr</span>
        </div>
        {rows.map((p, i) => {
          const form = p.ratingN ? (p.ratingSum / p.ratingN > 7 ? 2 : p.ratingSum / p.ratingN < 6 ? -1 : 1) : 0;
          const fit = p.injured > 0 ? -1 : p.fitness >= 80 ? 1 : p.fitness < 55 ? -1 : 0;
          const hap = p.morale >= 70 ? 1 : p.morale < 45 ? -1 : 0;
          const g = posGroup(p.pos);
          const mark = p.listed ? " **" : p.loan === "out" ? " *" : p.contract <= 1 ? " *" : "";
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onPick(p.id)}
              className={`grid w-full grid-cols-[1.75rem_1fr_1.5rem_2rem_4.5rem_2rem_2.5rem] items-center gap-1 px-2 py-1.5 text-left text-xs ${i % 2 ? "bg-black/5" : ""}`}
            >
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[var(--color-fc-lime-soft)]">
                <AvatarPortrait id={playerFaceId(p.id)} size={32} className="rounded-full" />
              </span>
              <span className={`truncate font-extrabold ${nameTone(g)}`}>
                {p.name}
                {mark}
                {p.banned > 0 ? " ■" : ""}
                {p.injured > 0 ? " +" : ""}
              </span>
              <span className={`rounded px-1 text-center text-[0.65rem] font-bold ${posTone(p.pos)}`}>{g}</span>
              <span className="rounded bg-black px-1 text-center font-bold text-white tabular-nums">{ovr(p)}</span>
              <span className="flex justify-center gap-0.5">
                {p.banned > 0 ? (
                  <span className="col-span-3 text-[0.6rem] font-extrabold text-[#a50e0e]">{p.banned} games</span>
                ) : p.injured > 0 ? (
                  <span className="text-[0.6rem] font-extrabold text-[#a50e0e]">{p.injured} weeks</span>
                ) : (
                  <>
                    <Dot n={form} />
                    <Dot n={fit} />
                    <Dot n={hap} />
                  </>
                )}
              </span>
              <span className="text-center tabular-nums">{p.age}</span>
              <span className="text-center tabular-nums">{2025 + season + p.contract}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dot({ n }: { n: number }) {
  const tone = n > 0 ? "bg-[#3E7D32] text-white" : n < 0 ? "bg-[#a50e0e] text-white" : "border border-black/30 bg-white";
  return (
    <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.55rem] font-bold ${tone}`}>
      {n > 0 ? `+${n}` : n < 0 ? `${n}` : ""}
    </span>
  );
}

function nameTone(g: "G" | "D" | "M" | "A") {
  if (g === "G") return "text-[#1f8a5b]";
  if (g === "D") return "text-[#1c3d66]";
  if (g === "M") return "text-[#a50e0e]";
  return "text-[#c97a1a]";
}

function SquadStats() {
  const state = useGame();
  const players = useMemo(
    () => userPlayers(state).filter((p) => p.played > 0).sort((a, b) => ovr(b) - ovr(a)),
    [state.players, state.xi],
  );
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("squad") }]} />}>
      <FcHeader title="Squad Stats" />
      <div className="px-3 py-3">
        <FcCard>
          <ul className="grid gap-2 text-sm">
            {players.slice(0, 16).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                  <AvatarPortrait id={playerFaceId(p.id)} size={28} className="rounded-full" />
                  <span className="truncate">
                    {p.name} <span className="text-black/50">{p.pos}</span>
                  </span>
                </span>
                <span className="tabular-nums">
                  {ovr(p)} · {p.ratingN ? (p.ratingSum / p.ratingN).toFixed(1) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </FcCard>
      </div>
    </FcShell>
  );
}

function SquadGoals() {
  const state = useGame();
  const players = useMemo(
    () =>
      userPlayers(state)
        .filter((p) => p.goals + p.assists + p.played > 0)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.played - a.played),
    [state.players],
  );
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("squad") },
            { label: "League leaders", onClick: () => go("leaders"), primary: true },
          ]}
        />
      }
    >
      <FcHeader title="Games / Goals" />
      <div className="px-3 py-3">
        <FcCard>
          <ul className="grid gap-2 text-sm">
            {players.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 border-t border-black/10 py-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <AvatarPortrait id={playerFaceId(p.id)} size={28} className="rounded-full" />
                  <span className="truncate font-extrabold">{p.name}</span>
                </span>
                <span className="tabular-nums font-bold">
                  {p.played} apps · {p.goals}G {p.assists}A
                </span>
              </li>
            ))}
            {!players.length ? <li className="text-black/50">No apps yet.</li> : null}
          </ul>
        </FcCard>
      </div>
    </FcShell>
  );
}

function LeadersScreen() {
  const state = useGame();
  const [tab, setTab] = useState<"goals" | "assists" | "clean" | "yellow" | "red">("goals");
  const [comp, setComp] = useState<"league" | "cup" | "playoff" | "friendly" | "all" | "career">("league");
  const leaders = useMemo(() => seasonLeaders(state, comp), [state.players, state.weekIndex, state.tier, comp]);
  const rows =
    tab === "goals"
      ? leaders.scorers
      : tab === "assists"
        ? leaders.assists
        : tab === "clean"
          ? leaders.cleanSheets
          : tab === "yellow"
            ? leaders.yellows
            : leaders.reds;
  const comps: { id: typeof comp; label: string }[] = [
    { id: "league", label: "League" },
    { id: "cup", label: "Cup" },
    { id: "playoff", label: "Play-offs" },
    { id: "friendly", label: "Friendly" },
    { id: "all", label: "Season" },
    { id: "career", label: "All-time" },
  ];
  const tabs: { id: typeof tab; label: string; accent: string }[] = [
    { id: "goals", label: "Scorers", accent: "#c6f06c" },
    { id: "assists", label: "Assists", accent: "#7dd3fc" },
    { id: "clean", label: "Clean sheets", accent: "#a7f3d0" },
    { id: "yellow", label: "Yellows", accent: "#fde047" },
    { id: "red", label: "Reds", accent: "#f87171" },
  ];
  const valueOf = (row: (typeof rows)[number]) =>
    tab === "goals"
      ? row.goals
      : tab === "assists"
        ? row.assists
        : tab === "clean"
          ? row.cleanSheets
          : tab === "yellow"
            ? row.yellows
            : row.reds;
  const top = rows.slice(0, 3);
  const rest = rows.slice(3);
  const maxVal = Math.max(1, ...rows.map(valueOf));
  const accent = tabs.find((t) => t.id === tab)?.accent ?? "#c6f06c";
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("table") },
            { label: "World", onClick: () => go("world") },
            { label: "Table", onClick: () => go("table"), primary: true },
          ]}
        />
      }
    >
      <FcHeader title={`${TIER_META[state.tier].short} leaders`} />
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {comps.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide ${
                comp === c.id ? "bg-[var(--color-fc-lime)] text-black" : "bg-white/15 text-white"
              }`}
              onClick={() => setComp(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`shrink-0 rounded-xl px-3 py-2 font-display text-[0.7rem] uppercase ${
                tab === t.id ? "text-black" : "bg-black/25 text-white/80"
              }`}
              style={tab === t.id ? { background: t.accent } : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {top.length ? (
          <div className="grid grid-cols-3 items-end gap-2 rounded-2xl bg-[#0c1a12] p-3 text-white ring-1 ring-white/10">
            {[top[1], top[0], top[2]].map((row, podiumI) => {
              if (!row) return <div key={podiumI} />;
              const rank = podiumI === 0 ? 2 : podiumI === 1 ? 1 : 3;
              const heights = ["h-20", "h-28", "h-16"];
              const club = state.clubs.find((c) => c.id === row.clubId);
              return (
                <div key={row.id} className="flex flex-col items-center text-center">
                  <span className="mb-1 flex h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/20">
                    <AvatarPortrait id={playerFaceId(row.id)} size={40} className="rounded-full" />
                  </span>
                  <div className="truncate text-[0.7rem] font-bold leading-tight">{row.name.split(" ").pop()}</div>
                  <div className="text-[0.6rem] text-white/50">{club?.short ?? ""}</div>
                  <div
                    className={`mt-2 flex w-full ${heights[podiumI]} flex-col items-center justify-end rounded-t-xl pb-2`}
                    style={{ background: `linear-gradient(180deg, ${accent}55, ${accent}22)` }}
                  >
                    <div className="font-display text-2xl tabular-nums" style={{ color: accent }}>
                      {valueOf(row)}
                    </div>
                    <div className="text-[0.65rem] font-bold text-white/60">#{rank}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-[#0c1a12] p-6 text-center text-sm text-white/55 ring-1 ring-white/10">
            Nothing on the board yet.
          </div>
        )}

        <div className="space-y-1.5">
          {rest.map((row, i) => {
            const club = state.clubs.find((c) => c.id === row.clubId);
            const mine = row.clubId === USER;
            const val = valueOf(row);
            return (
              <div
                key={row.id}
                className={`relative overflow-hidden rounded-xl bg-[#0c1a12] px-3 py-2.5 text-white ring-1 ring-white/8 ${mine ? "ring-[var(--color-fc-lime)]/50" : ""}`}
              >
                <div
                  className="absolute inset-y-0 left-0 opacity-30"
                  style={{ width: `${(val / maxVal) * 100}%`, background: accent }}
                />
                <div className="relative flex items-center gap-2 text-sm">
                  <span className="w-5 tabular-nums text-white/40">{i + 4}</span>
                  <span className="flex h-7 w-7 overflow-hidden rounded-full">
                    <AvatarPortrait id={playerFaceId(row.id)} size={28} className="rounded-full" />
                  </span>
                  {club ? <Crest primary={club.primary} secondary={club.secondary} short={club.short} size={16} /> : null}
                  <span className="min-w-0 flex-1 truncate font-semibold">{row.name}</span>
                  <span className="font-display text-lg tabular-nums" style={{ color: accent }}>
                    {val}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FcShell>
  );
}

function ChartScreen() {
  const state = useGame();
  const trail = state.posTrail ?? [];
  const n = Math.max(20, leagueTable(state).length);
  const colors = ["#3E7D32", "#a50e0e", "#c9a227", "#1c3d66", "#c97a1a"];
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("table"), primary: true }]} />}>
      <FcHeader title="League Positions Chart" />
      <div className="px-3 py-4">
        <FcCard>
          {!trail.length ? (
            <p className="text-sm font-bold text-black/55">Play league weeks to fill the chart.</p>
          ) : (
            <ul className="space-y-2">
              {trail.map((pos, i) => {
                const width = Math.max(8, Math.round(((n + 1 - pos) / n) * 100));
                const ordinal =
                  pos === 1 ? "1st" : pos === 2 ? "2nd" : pos === 3 ? "3rd" : `${pos}th`;
                return (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-10 shrink-0 font-extrabold text-black/60">Wk {i + 1}</span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded bg-black/10">
                      <div
                        className="flex h-full items-center justify-end rounded px-2 font-display text-sm text-white"
                        style={{ width: `${width}%`, background: colors[i % colors.length] }}
                      >
                        {ordinal}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </FcCard>
      </div>
    </FcShell>
  );
}

function Fixtures() {
  const state = useGame();
  const rows = useMemo(() => {
    return state.weeks.map((w, wi) => {
      const f = w.fixtures.find((x) => x.homeId === USER || x.awayId === USER);
      if (!f) return { wi, label: w.label, bye: true as const, kind: w.kind };
      const home = f.homeId === USER;
      const foe = state.clubs.find((c) => c.id === (home ? f.awayId : f.homeId));
      const played = f.homeScore != null;
      const gf = home ? f.homeScore : f.awayScore;
      const ga = home ? f.awayScore : f.homeScore;
      const result = !played || gf == null || ga == null ? null : gf > ga ? "W" : gf < ga ? "L" : "D";
      return {
        wi,
        label: w.label,
        bye: false as const,
        foe: foe?.name ?? "?",
        foeClub: foe,
        home,
        gf,
        ga,
        result,
        crowd: played && home && f.attendance ? String(f.attendance) : played && home ? "—" : "—",
        pos:
          w.kind === "cup" && wi === 0
            ? "FR"
            : wi < state.weekIndex
              ? String(tablePos({ ...state, weekIndex: wi }))
              : "—",
        kind: w.kind,
      };
    });
  }, [state]);

  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "League Table", onClick: () => go("table"), primary: true },
            { label: "Leaders", onClick: () => go("leaders") },
          ]}
        />
      }
    >
      <FcHeader title="Fixtures / Results" />
      <div className="flex-1 overflow-y-auto">
        <WeekResultsStrip />
        <div className="grid grid-cols-[2rem_1fr_1.5rem_1.5rem_1.5rem_2.5rem_2rem] gap-1 bg-[var(--color-fc-navy)] px-2 py-1 text-[0.6rem] font-bold text-white uppercase">
          <span>Wk</span>
          <span>Opponent</span>
          <span>F</span>
          <span>A</span>
          <span />
          <span>Crowd</span>
          <span>Pos</span>
        </div>
        {rows.map((r) => (
          <div
            key={r.wi}
            className="grid grid-cols-[2rem_1fr_1.5rem_1.5rem_1.5rem_2.5rem_2rem] items-center gap-1 border-b border-black/10 bg-white/90 px-2 py-1.5 text-xs"
          >
            <span className="tabular-nums font-bold">{r.wi}</span>
            {r.bye ? (
              <span className="col-span-6 text-black/50">No fixture</span>
            ) : (
              <>
                <span className="flex min-w-0 items-center gap-1.5 truncate font-extrabold uppercase">
                  {r.foeClub ? (
                    <Crest primary={r.foeClub.primary} secondary={r.foeClub.secondary} short={r.foeClub.short} size={18} />
                  ) : null}
                  <span className="truncate">
                    {r.foe} ({r.home ? "H" : "A"})
                    {r.kind === "cup" ? " · Cup" : ""}
                  </span>
                </span>
                <span className="tabular-nums font-bold">{r.gf ?? "—"}</span>
                <span className="tabular-nums font-bold">{r.ga ?? "—"}</span>
                <span>
                  {r.result ? (
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded text-[0.65rem] font-bold text-white ${r.result === "W" ? "bg-[#3E7D32]" : r.result === "D" ? "bg-[#c9a227]" : "bg-[#a50e0e]"}`}
                    >
                      {r.result}
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="tabular-nums">{r.crowd}</span>
                <span className="tabular-nums">{r.pos}</span>
              </>
            )}
          </div>
        ))}
      </div>
    </FcShell>
  );
}

function WeekResultsStrip() {
  const state = useGame();
  const week = state.weeks[Math.max(0, state.weekIndex - 1)];
  if (!week || week.kind !== "league") return null;
  const played = week.fixtures.filter((f) => f.homeScore != null);
  if (!played.length) return null;
  return (
    <div className="mx-2 my-2 overflow-hidden rounded-xl bg-white/95">
      <div className="bg-[var(--color-fc-navy)] px-3 py-1.5 font-display text-sm text-white uppercase">
        {TIER_META[state.tier].short}, Week {state.weekIndex} · Results
      </div>
      <ul className="max-h-40 overflow-y-auto text-sm">
        {played.map((f) => {
          const home = state.clubs.find((c) => c.id === f.homeId);
          const away = state.clubs.find((c) => c.id === f.awayId);
          const hs = f.homeScore ?? 0;
          const as = f.awayScore ?? 0;
          const homeTone = hs > as ? "text-[#3E7D32]" : hs < as ? "text-[#a50e0e]" : "text-black";
          const awayTone = as > hs ? "text-[#3E7D32]" : as < hs ? "text-[#a50e0e]" : "text-black";
          return (
            <li key={f.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-black/10 px-3 py-1.5 font-extrabold">
              <span className={`flex items-center justify-end gap-1 truncate uppercase ${homeTone}`}>
                <span className="truncate">{home?.short ?? "H"}</span>
                {home ? <Crest primary={home.primary} secondary={home.secondary} short={home.short} size={16} /> : null}
              </span>
              <span className="tabular-nums">
                {hs} - {as}
              </span>
              <span className={`flex items-center gap-1 truncate uppercase ${awayTone}`}>
                {away ? <Crest primary={away.primary} secondary={away.secondary} short={away.short} size={16} /> : null}
                <span className="truncate">{away?.short ?? "A"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TableScreen() {
  const state = useGame();
  const table = leagueTable(state);
  const n = table.length;
  const promo = autoPromo(state.tier);
  const band = playoffBand(state.tier);
  const playoffEnd = band ? band[1] : promo;
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("fixtures") },
            { label: "World", onClick: () => go("world") },
            { label: "Scorers", onClick: () => go("leaders"), primary: true },
          ]}
        />
      }
    >
      <FcHeader title={`${TIER_META[state.tier].short}, Week ${state.weekIndex}`} />
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <LeadersPeek />
        <div className="mt-2 overflow-hidden rounded-xl bg-white/95">
          <table className="w-full text-[0.72rem]">
            <thead>
              <tr className="bg-[var(--color-fc-navy)] text-left text-[0.6rem] text-white uppercase">
                <th className="px-1.5 py-1.5">#</th>
                <th>Team</th>
                <th className="text-right">P</th>
                <th className="text-right">W</th>
                <th className="text-right">D</th>
                <th className="text-right">L</th>
                <th className="text-right">F</th>
                <th className="text-right">A</th>
                <th className="text-right">GD</th>
                <th className="px-1.5 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => {
                const c = state.clubs.find((x) => x.id === row.id);
                const mine = row.id === USER;
                const auto = i < promo;
                const playoff = !auto && i < playoffEnd;
                const releg = i >= n - 2;
                const zone = mine
                  ? "bg-white font-extrabold"
                  : auto
                    ? "bg-[#d6e8ff]"
                    : playoff
                      ? "bg-[#e8f0ff]"
                      : releg
                        ? "bg-[#fde8e8]"
                        : i % 2
                          ? "bg-black/[0.03]"
                          : "";
                const nameTone = mine ? "" : i === 0 ? "text-[#c9a227]" : auto ? "text-[#3E7D32]" : "";
                return (
                  <tr key={row.id} className={zone}>
                    <td className="px-1.5 py-1 tabular-nums">{i + 1}</td>
                    <td className={`py-0.5 ${nameTone}`}>
                      <span className="inline-flex max-w-[6.5rem] items-center gap-1 truncate font-extrabold uppercase">
                        {c ? <Crest primary={c.primary} secondary={c.secondary} short={c.short} size={16} /> : null}
                        <span className="truncate">{c?.short ?? c?.name}</span>
                      </span>
                    </td>
                    <td className="text-right tabular-nums">{row.p}</td>
                    <td className="text-right tabular-nums">{row.w}</td>
                    <td className="text-right tabular-nums">{row.d}</td>
                    <td className="text-right tabular-nums">{row.l}</td>
                    <td className="text-right tabular-nums">{row.gf}</td>
                    <td className="text-right tabular-nums">{row.ga}</td>
                    <td className="text-right tabular-nums">{row.gf - row.ga}</td>
                    <td className={`px-1.5 text-right tabular-nums font-extrabold ${i === 0 ? "text-[#c9a227]" : ""}`}>{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </FcShell>
  );
}

type WorldStatTab = "table" | "goals" | "assists" | "clean" | "yellow" | "red";

function WorldStatRail({
  tab,
  scorers,
  assists,
  cleanSheets,
  yellows,
  reds,
}: {
  tab: WorldStatTab;
  scorers: { name: string; club: string; n: number }[];
  assists: { name: string; club: string; n: number }[];
  cleanSheets: { name: string; club: string; n: number }[];
  yellows: { name: string; club: string; n: number }[];
  reds: { name: string; club: string; n: number }[];
}) {
  if (tab === "table") return null;
  const rows =
    tab === "goals"
      ? scorers
      : tab === "assists"
        ? assists
        : tab === "clean"
          ? cleanSheets
          : tab === "yellow"
            ? yellows
            : reds;
  const accent =
    tab === "goals"
      ? "#c6f06c"
      : tab === "assists"
        ? "#7dd3fc"
        : tab === "clean"
          ? "#a7f3d0"
          : tab === "yellow"
            ? "#fde047"
            : "#f87171";
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="mt-3 space-y-2">
      {rows.map((row, i) => (
        <div key={`${row.name}-${row.club}-${i}`} className="relative overflow-hidden rounded-xl bg-black/35 px-3 py-2.5 ring-1 ring-white/10">
          <div className="absolute inset-y-0 left-0 opacity-25" style={{ width: `${(row.n / max) * 100}%`, background: accent }} />
          <div className="relative flex items-center gap-2 text-sm text-white">
            <span className="font-display text-lg tabular-nums text-white/35">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">
              {row.name}
              <span className="ml-1.5 text-xs font-medium text-white/45">{row.club}</span>
            </span>
            <span className="font-display text-xl tabular-nums" style={{ color: accent }}>
              {row.n}
            </span>
          </div>
        </div>
      ))}
      {!rows.length ? <p className="py-4 text-center text-sm text-white/45">No entries yet.</p> : null}
    </div>
  );
}

function WorldLadder({ rows }: { rows: { name: string; short: string; primary: string; secondary: string; p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number }[] }) {
  const maxPts = Math.max(1, ...rows.map((r) => r.pts));
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map((row, i) => {
        const zone = i < 3 ? "euro" : i >= rows.length - 3 ? "drop" : "mid";
        return (
          <div
            key={row.short}
            className={`relative overflow-hidden rounded-xl px-2.5 py-2 ring-1 ${
              zone === "euro"
                ? "bg-[#13281c] ring-[var(--color-fc-lime)]/35"
                : zone === "drop"
                  ? "bg-[#2a1414] ring-red-400/25"
                  : "bg-black/30 ring-white/8"
            }`}
          >
            <div
              className="absolute inset-y-0 left-0 opacity-20"
              style={{
                width: `${(row.pts / maxPts) * 100}%`,
                background: zone === "drop" ? "#f87171" : "#c6f06c",
              }}
            />
            <div className="relative flex items-center gap-2 text-white">
              <span className={`w-6 text-center font-display text-lg tabular-nums ${i === 0 ? "text-[#f5d76e]" : "text-white/40"}`}>
                {i + 1}
              </span>
              <Crest primary={row.primary} secondary={row.secondary} short={row.short} size={22} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{row.name}</div>
                <div className="text-[0.65rem] tabular-nums text-white/45">
                  {row.p}P · {row.w}W {row.d}D {row.l}L · GD {row.gd > 0 ? `+${row.gd}` : row.gd}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl tabular-nums text-[var(--color-fc-lime)]">{row.pts}</div>
                <div className="text-[0.6rem] uppercase tracking-wide text-white/35">pts</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WorldLeagues() {
  const state = useGame();
  const boards = useMemo(() => otherLeagueBoards(state), [state.seed, state.weekIndex, state.tier, state.season]);
  const euros = useMemo(() => euroBoards(state), [state.seed, state.weekIndex, state.tier, state.season]);
  const [scope, setScope] = useState<"eng" | "ucl" | "uel" | "uecl">("eng");
  const [engTier, setEngTier] = useState<number | null>(null);
  const [stat, setStat] = useState<WorldStatTab>("table");

  const engActive = boards.find((b) => b.tier === (engTier ?? boards[0]?.tier)) ?? boards[0];
  const euroActive = euros.find((e) => e.id === scope);
  const active = scope === "eng" ? engActive : euroActive;

  const statTabs: { id: WorldStatTab; label: string }[] = [
    { id: "table", label: "Ladder" },
    { id: "goals", label: "Scorers" },
    { id: "assists", label: "Assists" },
    { id: "clean", label: "Clean sheets" },
    { id: "yellow", label: "Yellows" },
    { id: "red", label: "Reds" },
  ];

  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("table") },
            { label: "Your leaders", onClick: () => go("leaders") },
            { label: "Your table", onClick: () => go("table"), primary: true },
          ]}
        />
      }
    >
      <FcHeader title="World board" />
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <div className="overflow-hidden rounded-2xl bg-[#0c1a12] p-3 text-white ring-1 ring-white/10">
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-[0.7rem] font-bold uppercase ${scope === "eng" ? "bg-[var(--color-fc-lime)] text-black" : "bg-white/10"}`}
              onClick={() => {
                setScope("eng");
                setStat("table");
              }}
            >
              England
            </button>
            {euros.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`rounded-full px-3 py-1.5 text-[0.7rem] font-bold uppercase ${scope === e.id ? "bg-[var(--color-fc-lime)] text-black" : "bg-white/10"}`}
                onClick={() => {
                  setScope(e.id);
                  setStat("table");
                }}
              >
                {e.short}
              </button>
            ))}
          </div>
          {scope === "eng" ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {boards.map((b) => (
                <button
                  key={b.tier}
                  type="button"
                  className={`rounded-lg px-2 py-1 text-[0.65rem] font-bold uppercase ${
                    (engTier ?? boards[0]?.tier) === b.tier ? "bg-white text-black" : "bg-white/10 text-white/80"
                  }`}
                  onClick={() => {
                    setEngTier(b.tier);
                    setStat("table");
                  }}
                >
                  {b.short}
                </button>
              ))}
            </div>
          ) : null}
          {active ? (
            <>
              <div className="mt-3 font-display text-2xl uppercase leading-none">{active.short}</div>
              <p className="mt-1 text-xs text-white/55">{active.headline}</p>
              <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                {statTabs.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`shrink-0 rounded-lg px-2.5 py-1.5 font-display text-[0.65rem] uppercase ${
                      stat === t.id ? "bg-[var(--color-fc-lime)] text-black" : "bg-white/10 text-white/75"
                    }`}
                    onClick={() => setStat(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {stat === "table" ? <WorldLadder rows={active.rows} /> : null}
              <WorldStatRail
                tab={stat}
                scorers={active.scorers}
                assists={active.assists}
                cleanSheets={active.cleanSheets}
                yellows={active.yellows}
                reds={active.reds}
              />
            </>
          ) : (
            <p className="mt-4 text-sm text-white/50">No boards available this week.</p>
          )}
        </div>
      </div>
    </FcShell>
  );
}

function TacticsBoard() {
  const state = useGame();
  const m = state.manager;
  const shapes = FORMATION_IDS.slice(0, 8);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back to manager", onClick: () => go("manager"), primary: true }]} />}>
      <FcHeader title="Tactics" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="font-display text-xl font-bold uppercase">{m.name}'s plan</div>
          <p className="mt-1 text-sm text-black/70">
            {state.formation} · {state.philosophy} · {state.line} line · {state.build} build. Tempo {state.tempo}, press {state.pressing}, width {state.width}.
          </p>
          <p className="mt-2 text-xs text-black/55">
            A high line and a hard press create chances and tire the side. Drop the line if you are protecting a lead. You can still change this during a match.
          </p>
          <div className="mt-3 text-xs font-bold tracking-wide text-black/50 uppercase">Shape</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {shapes.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => useGame.getState().shape(id)}
                className={`rounded-full px-2 py-1 text-xs font-bold ${state.formation === id ? "bg-[var(--color-fc-lime)]" : "bg-black/5"}`}
              >
                {id}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs font-bold tracking-wide text-black/50 uppercase">Idea</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {PHILOSOPHIES.map((idea) => (
              <button
                key={idea.id}
                type="button"
                onClick={() => useGame.getState().instructManager({ style: idea.id })}
                className={`rounded-full px-2 py-1 text-xs font-bold ${state.philosophy === idea.id ? "bg-[var(--color-fc-lime)]" : "bg-black/5"}`}
              >
                {idea.title}
              </button>
            ))}
          </div>
          <Meter label="Tempo" value={state.tempo} onPick={(n) => useGame.getState().tune("tempo", n)} />
          <Meter label="Pressing" value={state.pressing} onPick={(n) => useGame.getState().tune("pressing", n)} />
          <Meter label="Width" value={state.width} onPick={(n) => useGame.getState().tune("width", n)} />
          <div className="mt-3 text-xs font-bold tracking-wide text-black/50 uppercase">Line</div>
          <div className="mt-1 flex gap-1">
            {(["deep", "standard", "high"] as LineHeight[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => useGame.getState().setLine(id)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize ${state.line === id ? "bg-[var(--color-fc-navy)] text-white" : "bg-black/5"}`}
              >
                {id}
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs font-bold tracking-wide text-black/50 uppercase">Build-up</div>
          <div className="mt-1 flex gap-1">
            {(["short", "mixed", "direct"] as BuildUp[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => useGame.getState().setBuild(id)}
                className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize ${state.build === id ? "bg-[var(--color-fc-navy)] text-white" : "bg-black/5"}`}
              >
                {id}
              </button>
            ))}
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Meter({ label, value, onPick }: { label: string; value: number; onPick: (n: number) => void }) {
  return (
    <div className="mt-3">
      <div className="text-xs font-bold tracking-wide text-black/50 uppercase">
        {label} {value}
      </div>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onPick(n)}
            className={`h-8 flex-1 rounded-md text-xs font-bold ${value === n ? "bg-[var(--color-fc-lime)]" : "bg-black/10"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function ManagerScreen() {
  const state = useGame();
  const m = state.manager;
  const [tab, setTab] = useState<"records" | "staff">("staff");
  const sackMgr = useGame((s) => s.sackMgr);
  const ppg = m.played ? ((m.won * 3 + m.drawn) / m.played).toFixed(1) : "0";
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Sack Mgr", onClick: sackMgr },
            { label: "Other Mgrs", onClick: () => go("managersPool") },
          ]}
        />
      }
    >
      <FcHeader title="Managers" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="flex gap-3">
            <AvatarPortrait id={m.avatar ?? 0} size={64} className="rounded-md" />
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl font-bold uppercase">{m.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <StatPill letter="M" n={m.m} />
                <StatPill letter="C" n={m.c} />
                <StatPill letter="T" n={m.t} />
                <span className="ml-1 rounded bg-black px-1.5 py-0.5 text-xs font-extrabold text-white tabular-nums">
                  AVG {Math.round((m.m + m.c + m.t) / 3)}
                </span>
              </div>
              <div className="mt-1 text-xs">
                {m.formation} {m.style} · {personaOf(m.name)} · {m.happiness}% happy · Wage: £{m.wage} pw
              </div>
            </div>
          </div>
          <button type="button" className="mt-3 w-full rounded-lg bg-[var(--color-fc-navy)] px-3 py-2 text-sm font-bold text-white" onClick={() => go("tactics")}>
            Design tactics
          </button>
          <p className="mt-3 text-xs text-black/60">
            Ask him to change the idea. A squad with too many veterans or too many kids plays below its ratings.
            {state.transferFocus ? ` He is looking for a ${state.transferFocus}.` : " He may sign any position."}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {PHILOSOPHIES.map((idea) => (
              <button
                key={idea.id}
                type="button"
                onClick={() => useGame.getState().instructManager({ style: idea.id })}
                className={`rounded-full px-2 py-1 text-[0.65rem] font-bold ${m.style === idea.id ? "bg-[var(--color-fc-lime)]" : "bg-black/5"}`}
              >
                {idea.title}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {FORMATION_IDS.slice(0, 6).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() => useGame.getState().instructManager({ formation: shape })}
                className={`rounded-full px-2 py-1 text-[0.65rem] font-bold ${m.formation === shape ? "bg-[var(--color-fc-navy)] text-white" : "bg-black/5"}`}
              >
                {shape}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {(["Any", "GK", "CB", "CM", "ST", "LW"] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => useGame.getState().setTransferFocus(pos === "Any" ? null : (pos as Position))}
                className={`rounded-full px-2 py-1 text-[0.65rem] font-bold ${
                  (pos === "Any" && !state.transferFocus) || state.transferFocus === pos
                    ? "bg-[var(--color-fc-lime)]"
                    : "bg-black/5"
                }`}
              >
                {pos === "Any" ? "Any signing" : pos}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 rounded bg-black/5 p-1">
            <button
              type="button"
              className={`rounded py-2 text-sm font-bold ${tab === "records" ? "bg-[var(--color-fc-lime)]" : "bg-white"}`}
              onClick={() => setTab("records")}
            >
              Manager Records
            </button>
            <button
              type="button"
              className={`rounded py-2 text-sm font-bold ${tab === "staff" ? "bg-[var(--color-fc-lime)]" : "bg-white"}`}
              onClick={() => setTab("staff")}
            >
              Backroom Staff
            </button>
          </div>
          {tab === "records" ? (
            <div className="mt-3 text-sm">
              <div className="font-bold">
                {m.name} — {ppg} PPG, {state.trophies.length} trophies
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-md bg-black/5 px-2 py-2">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-[var(--color-fc-lime-soft)]">
                  <AvatarPortrait id={m.avatar ?? 0} size={40} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-black/60">
                    {seasonMonthLabel(m.hiredWeek)} {2025 + m.hiredSeason} — now
                  </div>
                  <div className="font-bold tabular-nums">
                    P{m.played} W{m.won} D{m.drawn} L{m.lost}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="mb-2 text-xs text-black/55">
                {TIER_META[state.tier].name} backroom limit — coaches {staffCap(state.tier, "coach")}, scouts{" "}
                {staffCap(state.tier, "scout")}, physios {staffCap(state.tier, "physio")}. Promote to unlock more
                desks.
              </p>
              <div className="grid grid-cols-4 gap-2 text-center text-[0.65rem]">
                {staffSlots(state).map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    disabled={!s.canUpgrade}
                    onClick={() => useGame.getState().liftStaff(s.staffKey!)}
                    className={`rounded-md p-2 ${s.filled ? "bg-[var(--color-fc-lime-soft)]" : "bg-black/10"}`}
                  >
                    <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-black/10">
                      <AvatarPortrait id={(s.key.charCodeAt(0) + s.key.charCodeAt(1)) % 12} size={40} />
                    </div>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </FcCard>
      </div>
    </FcShell>
  );
}

function staffSlots(state: ReturnType<typeof useGame.getState>) {
  const allowed = staffSlotsForTier(state.tier);
  const slots: { key: string; label: string; filled: boolean; canUpgrade: boolean; staffKey?: "coach" | "scout" | "physio" }[] = [];
  const assistant = state.staff.assistant ?? Math.min(allowed.assistant, state.staff.coach);
  const coachMax = staffCap(state.tier, "coach");
  const physioMax = staffCap(state.tier, "physio");
  const scoutMax = staffCap(state.tier, "scout");
  for (let i = 0; i < allowed.assistant; i++)
    slots.push({
      key: `a${i}`,
      label: "Assistant",
      filled: assistant > i,
      canUpgrade: i === assistant && state.staff.coach < coachMax,
      staffKey: "coach",
    });
  for (let i = 0; i < allowed.physio; i++)
    slots.push({
      key: `p${i}`,
      label: "Physio",
      filled: state.staff.physio > i,
      canUpgrade: i === state.staff.physio && state.staff.physio < physioMax,
      staffKey: "physio",
    });
  for (let i = 0; i < allowed.coach; i++)
    slots.push({
      key: `c${i}`,
      label: "Coach",
      filled: state.staff.coach > i,
      canUpgrade: i === state.staff.coach && state.staff.coach < coachMax,
      staffKey: "coach",
    });
  for (let i = 0; i < allowed.scout; i++)
    slots.push({
      key: `s${i}`,
      label: "Scout",
      filled: state.staff.scout > i,
      canUpgrade: i === state.staff.scout && state.staff.scout < scoutMax,
      staffKey: "scout",
    });
  return slots;
}

function StatPill({ letter, n }: { letter: string; n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="rounded-sm bg-[#3E7D32] px-1 text-[0.65rem] font-bold text-white">{letter}</span>
      <span className="rounded-sm bg-black px-1.5 text-sm font-bold text-white tabular-nums">{n}</span>
    </span>
  );
}

function ManagersPool() {
  const pool = useGame((s) => s.managerPool);
  const cash = useGame((s) => s.cash);
  const club = useGame((s) => userClub(s));
  const hireMgr = useGame((s) => s.hireMgr);
  const [picked, setPicked] = useState<(typeof pool)[number] | null>(null);
  if (picked) {
    const m = picked;
    return (
      <FcShell
        footer={
          <FcFooter
            buttons={[
              { label: "Cancel", onClick: () => setPicked(null) },
              {
                label: "Appoint",
                primary: true,
                onClick: () => {
                  hireMgr(m);
                  setPicked(null);
                },
              },
            ]}
          />
        }
      >
        <FcHeader title="New manager?" />
        <div className="px-3 py-3">
          <FcCard>
            <p className="text-sm text-black/75">
              Appoint {m.name} as manager of {club?.name ?? "your club"}?
            </p>
            <div className="mt-3 flex gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-[var(--color-fc-lime-soft)]">
                <AvatarPortrait id={m.avatar ?? 0} size={64} />
              </div>
              <div>
                <div className="font-display text-2xl font-bold uppercase">{m.name}</div>
                <div className="mt-1 flex gap-1">
                  <StatPill letter="M" n={m.m} />
                  <StatPill letter="C" n={m.c} />
                  <StatPill letter="T" n={m.t} />
                </div>
                <div className="mt-1 text-sm">
                  {m.formation} · {m.style} · Fans: {m.fanMood ?? "OK"}
                </div>
                <div className="mt-1 text-sm font-bold">
                  Compensation £{(m.compensation ?? m.wage * 20).toLocaleString("en-GB")} · Bank {formatMoney(cash)}
                </div>
              </div>
            </div>
          </FcCard>
        </div>
      </FcShell>
    );
  }
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("manager") },
            {
              label: "Reject and wait for more candidates",
              onClick: () => {
                const s = useGame.getState();
                useGame.setState({ managerPool: makeManagerPool(s.seed + s.weekIndex * 11, s.manager.name) });
              },
            },
          ]}
        />
      }
    >
      <FcHeader title="Hire a manager" />
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {pool.map((m) => (
          <button
            key={m.name}
            type="button"
            onClick={() => setPicked(m)}
            className="w-full rounded-xl bg-white/90 p-3 text-left shadow"
          >
            <div className="flex gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md bg-[var(--color-fc-lime-soft)]">
                <AvatarPortrait id={m.avatar ?? 0} size={56} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl font-bold uppercase">{m.name}</div>
                <div className="mt-1 flex gap-1">
                  <StatPill letter="M" n={m.m} />
                  <StatPill letter="C" n={m.c} />
                  <StatPill letter="T" n={m.t} />
                </div>
                <div className="mt-1 text-xs text-black/60">
                  {m.formation} · {m.style} · Fans: {m.fanMood ?? "OK"}
                </div>
                <div className="text-xs text-black/50">
                  Pay compensation: {(m.compensation ?? 0) > 0 ? formatMoney(m.compensation ?? m.wage * 20) : "None"}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </FcShell>
  );
}

function YouthTraining({ kind }: { kind: "academy" | "training" }) {
  const state = useGame();
  const current = facRating(state.facilities[kind]);
  const [target, setTarget] = useState(Math.min(99, current + 1));
  const setFacTarget = useGame((s) => s.setFacTarget);
  const cost = target > current ? facilityStepCost(current, target) : 0;
  const title = kind === "academy" ? "Youth Coaching" : "Training";
  const footerBtns =
    kind === "training"
      ? [
          { label: "Back", onClick: () => go("dash") },
          {
            label: "Upgrade",
            onClick: () => setFacTarget(kind, target),
            primary: true,
            disabled: target <= current,
          },
        ]
      : [
          { label: "Back", onClick: () => go("dash") },
          {
            label: "Upgrade",
            onClick: () => setFacTarget(kind, target),
            primary: true,
            disabled: target <= current,
          },
          { label: "Squad", onClick: () => go("squad") },
        ];
  return (
    <FcShell footer={<FcFooter buttons={footerBtns} />}>
      <FcHeader title={title} />
      <div className="px-3 py-3">
        <FcCard>
          <div className="flex gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-3xl">📋</div>
            <div>
              <div className="font-display text-xl font-bold uppercase">{title}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-[var(--color-fc-lime-soft)] px-2 text-xs font-bold">RATING</span>
                <span className="rounded bg-black px-2 font-bold text-white">{current}</span>
              </div>
              <div className="mt-1 text-xs">Weekly cost: {formatMoney(weeklyFacilityCost(current))}</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-y border-black/10 py-3">
            <div className="flex gap-1">
              <FcBtn kind="red" onClick={() => setTarget((t) => Math.max(current, t - 5))}>
                {"<<"} 5
              </FcBtn>
              <FcBtn kind="red" onClick={() => setTarget((t) => Math.max(current, t - 1))}>
                {"<"} 1
              </FcBtn>
            </div>
            <div className="font-display text-4xl font-semibold tabular-nums">{target}</div>
            <div className="flex gap-1">
              <FcBtn kind="lime" onClick={() => setTarget((t) => Math.min(99, t + 1))}>
                1 {">"}
              </FcBtn>
              <FcBtn kind="lime" onClick={() => setTarget((t) => Math.min(99, t + 5))}>
                5 {">>"}
              </FcBtn>
            </div>
          </div>
          <dl className="mt-3 grid gap-1 text-sm">
            <Row k="Cost" v={formatMoney(cost)} />
            <Row k="New weekly cost" v={formatMoney(weeklyFacilityCost(target))} />
            <Row k="Bank balance" v={formatMoney(state.cash)} />
          </dl>
          <p className="mt-2 text-xs text-black/60">
            {kind === "training"
              ? "Training rating opens from your squad’s average quality, then climbs to 99."
              : "Youth rating opens from your young players’ quality, then climbs to 99."}{" "}
            Current {current}.
          </p>
          {kind === "training" ? <TrainingFocusPicker /> : null}
        </FcCard>
      </div>
    </FcShell>
  );
}

function TrainingFocusPicker() {
  const training = useGame((s) => s.training);
  const focus = useGame((s) => s.focus);
  const options: { id: TrainingFocus; label: string }[] = [
    { id: "attack", label: "Attack" },
    { id: "defense", label: "Defense" },
    { id: "fitness", label: "Fitness" },
    { id: "technical", label: "Technical" },
    { id: "youth", label: "Youth" },
  ];
  return (
    <div className="mt-4 border-t border-black/10 pt-3">
      <div className="font-display text-sm font-bold uppercase">Weekly focus</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <FcBtn key={o.id} kind={training === o.id ? "lime" : "white"} onClick={() => focus(o.id)}>
            {o.label}
          </FcBtn>
        ))}
      </div>
    </div>
  );
}

function Trophies() {
  const trophies = useGame((s) => s.trophies);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Current Club", onClick: () => go("dash") },
            { label: "Chairman", onClick: () => go("career") },
          ]}
        />
      }
    >
      <FcHeader title="Trophies" />
      <div className="px-3 py-3">
        <FcCard>
          {!trophies.length ? (
            <>
              <div className="font-display text-2xl font-bold uppercase">No trophies yet!</div>
              <p className="mt-2 text-sm">This page will display your club&apos;s trophies.</p>
              <p className="mt-1 text-sm text-black/60">But for now this section is empty… come back when you&apos;ve won something!</p>
            </>
          ) : (
            <ul className="grid gap-2">
              {trophies.map((t) => (
                <li key={t.id} className="flex justify-between border-b border-black/10 py-2 text-sm">
                  <span className="font-bold">{t.label}</span>
                  <span>S{t.season}</span>
                </li>
              ))}
            </ul>
          )}
        </FcCard>
      </div>
    </FcShell>
  );
}

function Achievements() {
  const earned = useGame((s) => s.achievements);
  const map = new Map(earned.map((a) => [a.id, a]));
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Current Club", onClick: () => go("dash") },
            { label: "Chairman", onClick: () => go("career") },
          ]}
        />
      }
    >
      <FcHeader title={`Achievements (${earned.length}/${ACHIEVEMENT_DEFS.length})`} />
      <div className="flex items-center justify-between bg-white/70 px-3 py-1 text-[0.65rem] font-bold tracking-wide text-black/50 uppercase">
        <span>Achievement</span>
        <span>Date</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {ACHIEVEMENT_DEFS.map((def) => {
          const got = map.get(def.id);
          return (
            <div key={def.id} className="flex items-center gap-2 border-b border-black/10 bg-white/85 px-3 py-2 text-sm">
              <span className={got ? "text-[var(--color-fc-lime)]" : "text-black/30"}>★</span>
              <span className="flex-1 font-medium">{def.label}</span>
              <span className="text-black/50">{got?.earnedAt ?? "—"}</span>
            </div>
          );
        })}
      </div>
    </FcShell>
  );
}

function Records() {
  const r = useGame((s) => s.records);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Current Club", onClick: () => go("dash") },
            { label: "Chairman", onClick: () => go("career") },
          ]}
        />
      }
    >
      <FcHeader title="Club Records" />
      <div className="px-3 py-3">
        <FcCard className="grid gap-3">
          <RecordRow
            title="Biggest Crowd"
            badge={String(r.biggestCrowd || "—")}
            body={r.biggestCrowdLabel}
            tone="green"
          />
          <RecordRow
            title="Longest Serving Manager"
            badge={String(r.longestManagerGames || "—")}
            body={`games ${r.longestManagerName}`}
            tone="green"
          />
          <RecordRow title="Heaviest Defeat" badge={r.heaviestDefeat} body={r.heaviestDefeatLabel} tone="red" />
        </FcCard>
      </div>
    </FcShell>
  );
}

function RecordRow({
  title,
  badge,
  body,
  tone,
}: {
  title: string;
  badge: string;
  body: string;
  tone: "green" | "red";
}) {
  return (
    <div className="flex gap-3">
      <div className={`flex h-12 w-12 items-center justify-center rounded-md text-xl ${tone === "green" ? "bg-[#3E7D32]" : "bg-[#a50e0e]"} text-white`}>
        ⚽
      </div>
      <div>
        <div className="font-bold">{title}</div>
        <div className="mt-0.5 flex items-center gap-2 text-sm">
          <span className={`rounded px-1.5 py-0.5 text-xs font-bold text-white ${tone === "green" ? "bg-[#3E7D32]" : "bg-[#a50e0e]"}`}>
            {badge}
          </span>
          <span className="text-black/70">{body}</span>
        </div>
      </div>
    </div>
  );
}

function Career() {
  const state = useGame();
  const m = state.manager;
  const hist = state.history;
  const games = hist.reduce((s, h) => s + 1, 0);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Club List", onClick: () => go("clubList") },
            { label: "Highscores", onClick: () => go("highscores") },
          ]}
        />
      }
    >
      <FcHeader title="Chairman Career" onSettings={() => go("settings")} />
      <div className="px-3 py-3">
        <FcCard>
          <div className="flex gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-[var(--color-fc-lime-soft)]">
              <AvatarPortrait id={state.chairmanAvatar} size={64} />
            </div>
            <div>
              <div className="font-display text-2xl font-bold uppercase">{state.chairmanName}</div>
              <div className="text-sm text-black/60 uppercase">{userClub(state)?.name}</div>
              <div className="text-xs text-black/50">
                {2025 + state.season} - NOW ({state.season - 1} YEARS)
              </div>
              <div className="mt-1 flex gap-3 text-sm">
                <span>🏆 {state.trophies.length}</span>
                <span>★ {state.achievements.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 border-t border-black/10 pt-3 text-sm">
            <div>
              {m.played} games W {m.won} D {m.drawn} L {m.lost}{" "}
              {m.played ? ((m.won * 3 + m.drawn) / m.played).toFixed(1) : "0"} PPG
            </div>
            <dl className="mt-2 grid gap-1">
              <Row k="All-time Profit/Loss" v={<MoneyBag n={state.seasonProfit} />} />
              <Row k="Transfer fees paid" v={formatMoney(state.feesPaid ?? 0)} />
              <Row k="Transfer fees received" v={formatMoney(state.feesReceived ?? 0)} />
              <Row
                k="Managers (avg games)"
                v={String(
                  state.managersHired
                    ? Math.round((m.played + hist.reduce((s, h) => s + 1, 0)) / Math.max(1, state.managersHired))
                    : m.played,
                )}
              />
              <Row k="Lifetime Fan Approval" v={`${state.fanChairHappy.toFixed(1)}%`} />
              <Row k="Lifetime Mgr Approval" v={`${state.fanMgrHappy.toFixed(1)}%`} />
              <Row k="Seasons logged" v={String(games || state.season)} />
            </dl>
            {hist.length ? (
              <ul className="mt-3 grid gap-1 text-xs">
                {hist.map((h) => (
                  <li key={`${h.season}-${h.tier}`}>
                    S{h.season} tier {h.tier} · {h.pos}th · {h.pts} pts
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Inbox() {
  const inbox = useGame((s) => s.inbox);
  const dismissMail = useGame((s) => s.dismissMail);
  const clearMail = useGame((s) => s.clearMail);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Clear", onClick: clearMail },
            { label: "Transfers", onClick: () => go("budget") },
          ]}
        />
      }
    >
      <FcHeader title="Inbox" />
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {!inbox.length ? (
          <FcCard>
            <div className="font-display text-xl font-bold uppercase">No mail</div>
            <p className="mt-1 text-sm text-black/60">Board notes, bids and manager signings land here.</p>
          </FcCard>
        ) : (
          inbox.map((m) => (
            <FcCard key={m.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[0.65rem] font-bold tracking-wide text-black/50 uppercase">
                    {m.tag} · W{m.week}
                  </div>
                  <div className="font-bold">{m.title}</div>
                  <p className="mt-1 text-sm text-black/70">{m.body}</p>
                </div>
                <FcBtn kind="white" className="min-h-8 shrink-0 px-2 text-[0.65rem]" onClick={() => dismissMail(m.id)}>
                  Dismiss
                </FcBtn>
              </div>
              {m.tag === "Offer" ? (
                <FcBtn className="mt-2 w-full" kind="lime" onClick={() => go("budget")}>
                  Transfer budget
                </FcBtn>
              ) : null}
            </FcCard>
          ))
        )}
      </div>
    </FcShell>
  );
}

function Settings() {
  const currency = useGame((s) => s.currency);
  const setCurrency = useGame((s) => s.setCurrency);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("dash"), primary: true }]} />}>
      <FcHeader title="Settings" />
      <div className="space-y-3 px-3 py-3">
        <FcCard>
          <div className="font-display text-lg font-semibold uppercase">Preferences</div>
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-semibold tracking-wide text-black/50 uppercase">
              Currency
              <select
                className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm font-normal normal-case text-black"
                value={currency ?? "GBP"}
                onChange={(e) => setCurrency(e.target.value as MoneyCurrency)}
              >
                <option value="GBP">£ Pound (GBP)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="USD">$ Dollar (USD)</option>
              </select>
            </label>
            <p className="text-xs text-black/55">Display only — balances stay in club pounds under the hood.</p>
            <FcBtn kind="white" onClick={() => go("about")}>
              About
            </FcBtn>
            <FcBtn kind="white" onClick={() => go("inbox")}>
              Inbox
            </FcBtn>
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Medical() {
  const state = useGame();
  const liftFacility = useGame((s) => s.liftFacility);
  const level = state.facilities.medical;
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("stadium") },
            {
              label: level >= 5 ? "Maxed" : "Upgrade",
              onClick: () => liftFacility("medical"),
              primary: true,
              disabled: level >= 5,
            },
          ]}
        />
      }
    >
      <FcHeader title="Medical Centre" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="font-display text-xl font-semibold uppercase">Medical</div>
          <p className="mt-2 text-sm text-black/70">
            Stadium upgrade · Level {level}/5 (rating {level * 20}). Higher levels cut injury time and speed fitness
            recovery.
          </p>
          <dl className="mt-3 grid gap-1 text-sm">
            <Row k="Physio staff" v={String(state.staff.physio)} />
            <Row k="Bank balance" v={formatMoney(state.cash)} />
          </dl>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Rivals() {
  const state = useGame();
  const table = leagueTable(state).slice(0, 8);
  const you = tablePos(state);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("fans") },
            { label: "Full table", onClick: () => go("table") },
          ]}
        />
      }
    >
      <FcHeader title="Rivals" />
      <div className="px-3 py-3">
        <FcCard>
          <p className="text-sm text-black/70">
            You sit {you}
            {you === 1 ? "st" : you === 2 ? "nd" : you === 3 ? "rd" : "th"}. Clubs around you set the local derby tone.
          </p>
          <ul className="mt-3 grid gap-1 text-sm">
            {table.map((row, i) => {
              const c = state.clubs.find((x) => x.id === row.id);
              return (
                <li key={row.id} className={`flex items-center justify-between gap-2 py-1 ${row.id === USER ? "font-bold text-[var(--color-fc-forest)]" : ""}`}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 tabular-nums">{i + 1}.</span>
                    {c ? <Crest primary={c.primary} secondary={c.secondary} short={c.short} size={20} /> : null}
                    <span className="truncate">{c?.name}</span>
                  </span>
                  <span className="tabular-nums">{row.pts} pts</span>
                </li>
              );
            })}
          </ul>
        </FcCard>
      </div>
    </FcShell>
  );
}

function HistoryScreen() {
  const hist = useGame((s) => s.history);
  const form = useGame((s) => s.form);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("dash") }]} />}>
      <FcHeader title="History" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="font-display text-sm font-bold uppercase">Recent form</div>
          <FormDots form={form} />
          <ul className="mt-3 grid gap-2 text-sm">
            {hist.length ? (
              hist.map((h) => (
                <li key={`${h.season}-${h.tier}`} className="flex justify-between border-b border-black/10 py-1">
                  <span>
                    S{h.season} · Tier {h.tier}
                  </span>
                  <span className="tabular-nums">
                    {h.pos}th · {h.pts} pts
                  </span>
                </li>
              ))
            ) : (
              <li className="text-black/50">No completed seasons yet.</li>
            )}
          </ul>
        </FcCard>
      </div>
    </FcShell>
  );
}

function FinHistory() {
  const state = useGame();
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("finances") }]} />}>
      <FcHeader title="Financial History" />
      <div className="px-3 py-3">
        <FcCard>
          <dl className="grid gap-2 text-sm">
            <Row k="Season P/L" v={<MoneyBag n={state.seasonProfit} />} />
            <Row k="Fees paid" v={formatMoney(state.feesPaid ?? 0)} />
            <Row k="Fees received" v={formatMoney(state.feesReceived ?? 0)} />
            <Row k="Debt" v={formatMoney(state.debt)} />
            <Row k="Cash" v={formatMoney(state.cash)} />
          </dl>
        </FcCard>
      </div>
    </FcShell>
  );
}

function ClubList() {
  const state = useGame();
  const table = leagueTable(state);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("career") }]} />}>
      <FcHeader title="Club List" />
      <div className="px-3 py-3">
        <FcCard>
          <ul className="grid gap-1 text-sm">
            {table.map((row, i) => {
              const c = state.clubs.find((x) => x.id === row.id);
              return (
                <li key={row.id} className={`flex items-center justify-between gap-2 py-1 ${row.id === USER ? "font-bold" : ""}`}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="w-4 tabular-nums">{i + 1}.</span>
                    {c ? <Crest primary={c.primary} secondary={c.secondary} short={c.short} size={20} /> : null}
                    <span className="truncate">{c?.name}</span>
                  </span>
                  <span className="tabular-nums">{row.pts}</span>
                </li>
              );
            })}
          </ul>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Highscores() {
  const state = useGame();
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("career") }]} />}>
      <FcHeader title="Highscores" />
      <div className="px-3 py-3">
        <FcCard>
          <dl className="grid gap-2 text-sm">
            <Row k="Trophies" v={String(state.trophies.length)} />
            <Row k="Achievements" v={`${state.achievements.length}/${ACHIEVEMENT_DEFS.length}`} />
            <Row k="Biggest crowd" v={String(state.records.biggestCrowd || "—")} />
            <Row k="Bank high (cash now)" v={formatMoney(state.cash)} />
          </dl>
          <p className="mt-3 text-xs text-black/50">Local career scores only — no online board.</p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function About() {
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("dash") }]} />}>
      <FcHeader title="About" />
      <div className="px-3 py-3">
        <FcCard className="text-sm leading-relaxed text-black/75">
          <p className="font-display text-lg font-bold uppercase">Tyrone Futbol Simulator</p>
          <p className="mt-2">
            Build a club from scratch, hire and fire managers, set the budget, develop the ground, and climb the Tyrone
            pyramid. Mobile web chairman desk — careers save in this browser.
          </p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Market() {
  const state = useGame();
  const mode = useGame((s) => s.transferBudgetMode);
  const setBudget = useGame((s) => s.setBudget);
  const modes: BudgetMode[] = ["max", "normal", "cautious", "strict", "zero"];
  const info = budgetLabel(mode);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("finances") },
            { label: "Done", onClick: () => go("finances"), primary: true },
          ]}
        />
      }
    >
      <FcHeader title="Transfers" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="font-display text-xl font-semibold uppercase">Transfer budget</div>
          <div className="mt-3 inline-block rounded bg-[var(--color-fc-forest)] px-3 py-1.5 font-display text-2xl font-semibold text-white tabular-nums">
            {formatMoney(transferCap(state))}
          </div>
          <p className="mt-2 text-sm text-black/70">
            {info.title}: {info.body}
          </p>
          <p className="mt-1 text-xs text-black/55">Manager happiness: {state.manager.happiness}%</p>
          <div className="mt-4 grid gap-2">
            {modes.map((m) => {
              const row = budgetLabel(m);
              return (
                <FcSelectRow key={m} selected={mode === m} onClick={() => setBudget(m)}>
                  <span className="font-semibold">{row.title}</span>
                  <span className="text-black/60"> — {row.body}</span>
                </FcSelectRow>
              );
            })}
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Row({
  k,
  v,
  muted,
  tone,
}: {
  k: string;
  v: ReactNode;
  muted?: boolean;
  tone?: "good" | "bad" | "warn";
}) {
  const valueTone =
    tone === "good" ? "text-[#3E7D32] font-extrabold" : tone === "bad" ? "text-[#a50e0e] font-extrabold" : tone === "warn" ? "text-[#a50e0e] font-extrabold" : "font-extrabold";
  return (
    <div className={`flex justify-between gap-3 border-t border-black/10 py-1 ${muted ? "text-black/45" : ""}`}>
      <dt className="font-bold text-black/70">{k}</dt>
      <dd className={`text-right ${valueTone}`}>{v}</dd>
    </div>
  );
}
