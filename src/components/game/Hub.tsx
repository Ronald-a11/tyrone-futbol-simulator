import { useMemo, useState, type ReactNode } from "react";
import { STAND_IDS, STANDS, TIER_META, standFacts, standsOf } from "@/game/data";
import {
  ACHIEVEMENT_DEFS,
  SUPER_STADIUM_COST,
  budgetLabel,
  facilityStepCost,
  outletCrowdCap,
  outletProfitPerSale,
  outletUpgradeCost,
  transferCap,
  weeklyFacilityCost,
} from "@/game/fc";
import { maskOvr, ovr } from "@/game/players";
import { listSlots } from "@/game/saves";
import { useGame } from "@/game/store";
import type { BudgetMode, Screen, TrainingFocus } from "@/game/types";
import { money } from "@/game/util";
import {
  USER,
  currentWeek,
  ledger,
  leagueTable,
  tablePos,
  userClub,
  userFixture,
  userPlayers,
  wageBill,
} from "@/game/world";
import {
  FcBtn,
  FcCard,
  FcFooter,
  FcHeader,
  FcSelectRow,
  FcShell,
  FcTile,
  FormDots,
  HappyBar,
  MoneyBag,
  PitchMark,
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
          className="notice-in fixed top-12 right-0 left-0 z-40 mx-auto max-w-md px-3"
        >
          <div className="rounded-lg bg-[var(--color-fc-navy)] px-3 py-2 text-center text-sm text-white shadow-lg">
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
      {screen === "super" && <SuperStadium />}
      {screen === "squad" && <SquadScreen />}
      {screen === "squadStats" && <SquadStats />}
      {screen === "squadGoals" && <SquadGoals />}
      {screen === "fixtures" && <Fixtures />}
      {screen === "table" && <TableScreen />}
      {screen === "manager" && <ManagerScreen />}
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
  const squadN = userPlayers(state).filter((p) => p.loan !== "out").length;
  const quickSim = useGame((s) => s.quickSim);
  const toPress = useGame((s) => s.toPress);
  const advanceBye = useGame((s) => s.advanceBye);
  const week = currentWeek(state);

  const footer = tie && foe
    ? [
        {
          label: `Sim: ${foe.short} (${home ? "H" : "A"})`,
          onClick: quickSim,
          primary: true,
        },
        { label: "Watch", onClick: toPress },
      ]
    : [{ label: week ? "Advance week" : "Season break", onClick: advanceBye, primary: true }];

  return (
    <FcShell footer={<FcFooter buttons={footer} />}>
      <FcHeader title="Football Chairman" />
      <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
        <div className="mx-auto mt-1 max-w-[90%] rounded-sm bg-white px-4 py-1 text-center font-display text-lg font-bold tracking-wide text-[var(--color-fc-navy)] uppercase shadow">
          {club?.name ?? "Club"}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-white">
          <span>S{state.season}</span>
          <span className="rounded-full bg-sky-300/90 px-3 py-0.5 font-bold text-[var(--color-fc-navy)]">
            {TIER_META[state.tier].name}
          </span>
          <span>W{state.weekIndex + 1}</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <FcTile label="Weekend" value={state.weekIndex} tone="white" onClick={() => go("fixtures")} />
          <FcTile label="League" value={pos} tone="white" onClick={() => go("table")} />
          <FcTile label="Money" value={formatMoney(state.cash)} tone="white" wide onClick={() => go("finances")} />
          <FcTile label="Squad" value={squadN} tone="navy" onClick={() => go("squad")} />
          <FcTile label="Manager" value={state.manager?.m ?? 30} tone="navy" onClick={() => go("manager")} />
          <FcTile label="Training" value={state.facilities.training * 20} tone="navy" onClick={() => go("training")} />
          <FcTile label="Youth" value={state.facilities.academy * 20} tone="navy" onClick={() => go("youth")} />
          <FcTile label="Trophies" value={state.trophies.length} tone="green" onClick={() => go("trophies")} />
          <FcTile label="Achieved" value={state.achievements.length} tone="green" onClick={() => go("achievements")} />
          <FcTile label="Records" tone="green" onClick={() => go("records")}>
            <span className="text-lg">🏅</span>
          </FcTile>
          <FcTile label="Inbox" value={state.inbox.length} tone="green" onClick={() => go("inbox")} />
          <FcTile
            label="Fans happy?"
            tone="lime"
            wide
            onClick={() => go("fans")}
          >
            <div className="mt-1 flex w-full justify-around text-xs font-bold">
              <span>{state.fanMgrHappy}% Mgr</span>
              <span>{state.fanChairHappy}% Chair</span>
            </div>
          </FcTile>
          <FcTile label="Stadium" tone="lime" onClick={() => go("stadium")}>
            <span className="text-lg">⚽</span>
          </FcTile>
          <FcTile label="Board" value={`${state.board}%`} tone="lime" onClick={() => go("career")} />
          <FcTile label="Medical" value={state.facilities.medical * 20} tone="navy" onClick={() => go("medical")} />
          <FcTile label="Settings" tone="white" onClick={() => go("settings")}>
            <span className="text-lg">⚙</span>
          </FcTile>
        </div>
        <FormDots form={state.form} />
        {week ? (
          <p className="text-center text-xs text-white/85">
            {week.label}
            {state.userCup === "winner" ? " · Shield holders" : state.userCup === "out" ? " · Out of Shield" : ""}
            {state.offer ? " · Bid waiting" : ""}
          </p>
        ) : null}
      </div>
    </FcShell>
  );
}

function Finances() {
  const state = useGame();
  const books = ledger(state);
  const wages = wageBill(state);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Transfers", onClick: () => go("market") },
            { label: "Budget", onClick: () => go("budget") },
          ]}
        />
      }
    >
      <FcHeader title="Finances" />
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
            <Row k="Wages + win bonus (20%)" v={formatMoney(Math.round(wages * 1.2))} muted />
            <Row k="TV / wk" v={formatMoney(books.tv)} />
            <Row k="Shirt + outlets / wk" v={formatMoney(books.shirt)} />
            <Row k="Interest / wk" v={formatMoney(books.interest)} />
            <Row k="Sponsor" v={`${state.sponsorName} · ${formatMoney(books.shirt)}`} />
            <Row k="Profit/Loss this year" v={<MoneyBag n={state.seasonProfit} />} />
            <Row k="Board confidence" v={`${state.board}%`} />
          </dl>
          <div className="mt-4 font-bold">Want more money?</div>
          <div className="mt-2 grid gap-2">
            <FcBtn className="w-full" kind="white" onClick={() => useGame.getState().takeLoan()}>
              Borrow on the overdraft
            </FcBtn>
            <FcBtn className="w-full" kind="lime" disabled={state.debt <= 0} onClick={() => useGame.getState().payDebt()}>
              Repay debt
            </FcBtn>
            <FcBtn className="w-full" kind="white" onClick={() => useGame.getState().newSponsor()}>
              Renegotiate sponsor
            </FcBtn>
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

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
            { label: "Done", onClick: () => go("dash"), primary: true },
            { label: "Finances", onClick: () => go("finances") },
          ]}
        />
      }
    >
      <FcHeader title="Football Chairman" />
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
          <div className="mt-3 grid gap-3">
            <HappyBar pct={state.fanMgrHappy} label="Happy with Manager" />
            <HappyBar pct={state.fanChairHappy} label="Happy with Chairman" />
          </div>
          <ul className="mt-4 list-disc space-y-1 pl-4 text-sm">
            <li>
              Expectations: <strong>{state.objective}</strong>
            </li>
            <li>
              Atmosphere: Generally <strong>{state.fans >= 70 ? "loud" : state.fans >= 45 ? "steady" : "quiet"}</strong>.
            </li>
          </ul>
          <div className="mt-5 font-display text-sm font-bold uppercase text-black/70">Worldwide popularity</div>
          <div className="mt-2 font-display text-3xl font-bold">{Math.min(10, Math.floor(state.fans / 10))} / 10</div>
          <p className="mt-2 text-sm text-black/70">
            Popularity rises with trophies, star signings and big nights. Higher fame means more merchandise cash.
          </p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function StadiumPits() {
  const state = useGame();
  const stands = standsOf(state);
  const facts = standFacts(stands);
  const club = userClub(state);
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
      <FcHeader title={club?.stadium ?? "The Pits"} />
      <div className="px-3 py-2">
        <PitchMark />
        <FcCard>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-black/50">
                <th className="py-1">Stand</th>
                <th>Built</th>
                <th className="text-right">Capacity</th>
              </tr>
            </thead>
            <tbody>
              {STAND_IDS.map((id) => {
                const tier = stands[id];
                const seats = STANDS[id].seats[tier] ?? 0;
                return (
                  <tr key={id} className="border-t border-black/10">
                    <td className="py-2 font-medium">{STANDS[id].name}</td>
                    <td>{2025 + state.season + tier}</td>
                    <td className="text-right tabular-nums">{seats.toLocaleString("en-GB")}</td>
                  </tr>
                );
              })}
              <tr className="border-t border-black/10">
                <td className="py-2 font-medium">Corners</td>
                <td>—</td>
                <td className="text-right">0</td>
              </tr>
              <tr className="border-t border-black/20 font-bold">
                <td className="py-2">Pitch ({state.pitchQuality}/99)</td>
                <td />
                <td className="text-right tabular-nums">{facts.seats.toLocaleString("en-GB")}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-2">
            {STAND_IDS.map((id) => (
              <FcBtn key={id} kind="lime" onClick={() => useGame.getState().liftStand(id)}>
                Build {STANDS[id].name.split(" ")[0]}
              </FcBtn>
            ))}
            <FcBtn kind="white" onClick={() => useGame.getState().setPitch(1)}>
              Pitch +1
            </FcBtn>
          </div>
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
        <div className="mx-auto mb-3 flex h-28 w-48 items-end justify-center rounded-lg bg-[#2d6b3a] shadow-inner">
          <div className="h-16 w-40 rounded-t-xl border-2 border-white/50 bg-[#4a90c4]/40" />
        </div>
        <FcCard>
          <p className="text-sm">
            Get a purpose-built super stadium! Ready immediately, with lower running costs than an old-fashioned ground.
          </p>
          {state.superStadium ? (
            <p className="mt-3 font-bold text-[#3E7D32]">Already built.</p>
          ) : (
            <div className="mt-3 grid gap-2">
              <FcBtn kind="white" onClick={buySuper}>
                Buy with {formatMoney(SUPER_STADIUM_COST)} in-game money
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

function SquadScreen() {
  const state = useGame();
  const [picked, setPicked] = useState<string | null>(null);
  const xi = new Set(state.xi);
  const players = userPlayers(state).filter((p) => p.loan !== "out").sort((a, b) => ovr(b) - ovr(a));
  const loaned = userPlayers(state).filter((p) => p.loan === "out");
  const first = players.filter((p) => xi.has(p.id));
  const reserves = players.filter((p) => !xi.has(p.id));
  const detail = state.players.find((p) => p.id === picked);
  const sell = useGame((s) => s.sell);
  const loanAway = useGame((s) => s.loanAway);
  const renewPlayer = useGame((s) => s.renewPlayer);
  const recallPlayer = useGame((s) => s.recallPlayer);
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            { label: "Squad Stats", onClick: () => go("squadStats") },
            { label: "Games/Goals", onClick: () => go("squadGoals") },
          ]}
        />
      }
    >
      <FcHeader title="Your Squad" />
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {detail ? (
          <FcCard className="mt-2">
            <div className="font-display text-xl font-bold uppercase">{detail.name}</div>
            <p className="text-sm text-black/70">
              {detail.pos} · OVR {ovr(detail)} · Age {detail.age} · £{detail.wage}/wk · contract {detail.contract}y
            </p>
            <p className="mt-1 text-xs text-black/60">
              Fit {detail.fitness}% · Morale {detail.morale}%
              {detail.injured > 0 ? ` · Injured ${detail.injured}w` : ""}
              {detail.banned > 0 ? ` · Banned ${detail.banned}w` : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <FcBtn kind="lime" onClick={() => renewPlayer(detail.id)}>
                Renew
              </FcBtn>
              <FcBtn kind="white" disabled={xi.has(detail.id)} onClick={() => loanAway(detail.id)}>
                Loan out
              </FcBtn>
              <FcBtn kind="red" onClick={() => sell(detail.id)}>
                Sell
              </FcBtn>
              <FcBtn kind="white" onClick={() => setPicked(null)}>
                Close
              </FcBtn>
            </div>
          </FcCard>
        ) : null}
        <SquadBlock title="First Team" rows={first} onPick={setPicked} />
        <SquadBlock title="Reserves" rows={reserves} onPick={setPicked} />
        {loaned.length ? (
          <div className="mt-2">
            <div className="px-1 font-display text-sm font-bold text-white uppercase">Out on loan</div>
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
        <p className="mt-2 px-1 text-[0.65rem] text-white/80">Tap a player to renew, loan or sell.</p>
      </div>
    </FcShell>
  );
}

function SquadBlock({
  title,
  rows,
  onPick,
}: {
  title: string;
  rows: ReturnType<typeof userPlayers>;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-2">
      <div className="px-1 font-display text-sm font-bold text-white uppercase">{title}</div>
      <div className="mt-1 overflow-hidden rounded-lg bg-white/90">
        <div className="grid grid-cols-[1fr_2rem_2rem_4.5rem_2rem_2.5rem] gap-1 bg-[var(--color-fc-navy)] px-2 py-1 text-[0.6rem] font-bold text-white uppercase">
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
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onPick(p.id)}
              className={`grid w-full grid-cols-[1fr_2rem_2rem_4.5rem_2rem_2.5rem] items-center gap-1 px-2 py-1.5 text-left text-xs ${i % 2 ? "bg-black/5" : ""}`}
            >
              <span className="truncate font-medium">
                {p.name}
                {p.injured > 0 ? " 🤕" : ""}
                {p.banned > 0 ? " 🟥" : ""}
                {p.contract <= 1 ? " *" : ""}
              </span>
              <span className={`rounded px-1 text-center text-[0.65rem] font-bold ${posTone(p.pos)}`}>{p.pos[0]}</span>
              <span className="rounded bg-black px-1 text-center font-bold text-white tabular-nums">{ovr(p)}</span>
              <span className="flex justify-center gap-0.5">
                <Dot n={form} />
                <Dot n={fit} />
                <Dot n={hap} />
              </span>
              <span className="text-center tabular-nums">{p.age}</span>
              <span className="text-center tabular-nums">{2025 + p.contract}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dot({ n }: { n: number }) {
  const tone = n > 0 ? "bg-[#3E7D32] text-white" : n < 0 ? "bg-[#a50e0e] text-white" : "border border-black/30 bg-white";
  return <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.55rem] font-bold ${tone}`}>{n || ""}</span>;
}

function SquadStats() {
  const players = useGame((s) => userPlayers(s).filter((p) => p.played > 0).sort((a, b) => ovr(b) - ovr(a)));
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("squad") }]} />}>
      <FcHeader title="Squad Stats" />
      <div className="px-3 py-3">
        <FcCard>
          <ul className="grid gap-2 text-sm">
            {players.slice(0, 16).map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {p.name} <span className="text-black/50">{p.pos}</span>
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
  const players = useGame((s) =>
    userPlayers(s)
      .filter((p) => p.goals + p.assists > 0)
      .sort((a, b) => b.goals - a.goals || b.assists - a.assists),
  );
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("squad") }]} />}>
      <FcHeader title="Games / Goals" />
      <div className="px-3 py-3">
        <FcCard>
          <ul className="grid gap-2 text-sm">
            {players.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.name}</span>
                <span className="tabular-nums">
                  {p.played} apps · {p.goals}G {p.assists}A
                </span>
              </li>
            ))}
            {!players.length ? <li className="text-black/50">No goals yet.</li> : null}
          </ul>
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
        home,
        gf,
        ga,
        result,
        crowd: played && home && f.attendance ? String(f.attendance) : played && home ? "—" : "—",
        pos: wi < state.weekIndex ? String(tablePos({ ...state, weekIndex: wi })) : "—",
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
            { label: "Chart", onClick: () => go("table") },
          ]}
        />
      }
    >
      <FcHeader title="Fixtures / Results" />
      <div className="flex-1 overflow-y-auto">
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
            className="grid grid-cols-[2rem_1fr_1.5rem_1.5rem_1.5rem_2.5rem_2rem] items-center gap-1 border-b border-black/10 bg-white/85 px-2 py-1.5 text-xs"
          >
            <span className="tabular-nums">{r.wi}</span>
            {r.bye ? (
              <span className="col-span-6 text-black/50">No fixture</span>
            ) : (
              <>
                <span className="truncate font-bold uppercase">
                  {r.foe} ({r.home ? "H" : "A"})
                  {r.kind === "cup" ? " · Cup" : ""}
                </span>
                <span className="tabular-nums">{r.gf ?? "—"}</span>
                <span className="tabular-nums">{r.ga ?? "—"}</span>
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

function TableScreen() {
  const state = useGame();
  const table = leagueTable(state);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("fixtures") }]} />}>
      <FcHeader title="League Table" />
      <div className="px-3 py-3">
        <FcCard>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-black/50">
                <th>#</th>
                <th>Club</th>
                <th className="text-right">P</th>
                <th className="text-right">W</th>
                <th className="text-right">D</th>
                <th className="text-right">L</th>
                <th className="text-right">GD</th>
                <th className="text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row, i) => {
                const c = state.clubs.find((x) => x.id === row.id);
                return (
                  <tr key={row.id} className={row.id === USER ? "bg-[var(--color-fc-lime)]/40 font-bold" : ""}>
                    <td className="py-1.5">{i + 1}</td>
                    <td>{c?.name}</td>
                    <td className="text-right tabular-nums">{row.p}</td>
                    <td className="text-right tabular-nums">{row.w}</td>
                    <td className="text-right tabular-nums">{row.d}</td>
                    <td className="text-right tabular-nums">{row.l}</td>
                    <td className="text-right tabular-nums">{row.gf - row.ga}</td>
                    <td className="text-right tabular-nums">{row.pts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </FcCard>
      </div>
    </FcShell>
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
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-3xl">👤</div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-2xl font-bold uppercase">{m.name}</div>
              <div className="mt-1 flex gap-1">
                <StatPill letter="M" n={m.m} />
                <StatPill letter="C" n={m.c} />
                <StatPill letter="T" n={m.t} />
              </div>
              <div className="mt-1 text-xs">
                {m.formation} {m.style} · {m.happiness}% happy · Wage: £{m.wage} pw
              </div>
            </div>
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
              <div className="text-black/60">
                S{m.hiredSeason} W{m.hiredWeek + 1} —
              </div>
              <div>
                P{m.played} W{m.won} D{m.drawn} L{m.lost}
              </div>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-[0.65rem]">
              {staffSlots(state).map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={!s.canUpgrade}
                  onClick={() => useGame.getState().liftStaff(s.staffKey!)}
                  className={`rounded-md p-2 ${s.filled ? "bg-[var(--color-fc-lime-soft)]" : "bg-black/10"}`}
                >
                  <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded bg-black/10 text-lg">👤</div>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </FcCard>
      </div>
    </FcShell>
  );
}

function staffSlots(state: ReturnType<typeof useGame.getState>) {
  const slots: { key: string; label: string; filled: boolean; canUpgrade: boolean; staffKey?: "coach" | "scout" | "physio" }[] = [];
  for (let i = 0; i < 2; i++)
    slots.push({
      key: `p${i}`,
      label: "Physio",
      filled: state.staff.physio > i,
      canUpgrade: i === state.staff.physio && state.staff.physio < 5,
      staffKey: "physio",
    });
  for (let i = 0; i < 4; i++)
    slots.push({
      key: `c${i}`,
      label: "Coach",
      filled: state.staff.coach > i,
      canUpgrade: i === state.staff.coach && state.staff.coach < 5,
      staffKey: "coach",
    });
  for (let i = 0; i < 4; i++)
    slots.push({
      key: `s${i}`,
      label: "Scout",
      filled: state.staff.scout > i,
      canUpgrade: i === state.staff.scout && state.staff.scout < 5,
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
  const hireMgr = useGame((s) => s.hireMgr);
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("manager") }]} />}>
      <FcHeader title="Other Managers" />
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {pool.map((m) => (
          <FcCard key={m.name}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-xl font-bold uppercase">{m.name}</div>
                <div className="text-xs">
                  {m.formation} {m.style} · £{m.wage} pw
                </div>
                <div className="mt-1 flex gap-1">
                  <StatPill letter="M" n={m.m} />
                  <StatPill letter="C" n={m.c} />
                  <StatPill letter="T" n={m.t} />
                </div>
              </div>
              <FcBtn kind="lime" onClick={() => hireMgr(m)}>
                Hire
              </FcBtn>
            </div>
          </FcCard>
        ))}
      </div>
    </FcShell>
  );
}

function YouthTraining({ kind }: { kind: "academy" | "training" }) {
  const state = useGame();
  const current = state.facilities[kind];
  const [target, setTarget] = useState(Math.min(5, current + 1));
  const setFacTarget = useGame((s) => s.setFacTarget);
  const cost = target > current ? facilityStepCost(current, target) : 0;
  const title = kind === "academy" ? "Youth Coaching" : "Training";
  const rating = current * 20;
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("dash") },
            {
              label: "Upgrade",
              onClick: () => setFacTarget(kind, target),
              primary: true,
              disabled: target <= current,
            },
            { label: "Squad", onClick: () => go("squad") },
          ]}
        />
      }
    >
      <FcHeader title={title} />
      <div className="px-3 py-3">
        <FcCard>
          <div className="flex gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-3xl">📋</div>
            <div>
              <div className="font-display text-xl font-bold uppercase">{title}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-[var(--color-fc-lime-soft)] px-2 text-xs font-bold">RATING</span>
                <span className="rounded bg-black px-2 font-bold text-white">{rating}</span>
              </div>
              <div className="mt-1 text-xs">Weekly cost: £{weeklyFacilityCost(rating)}</div>
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
            <div className="font-display text-4xl font-bold tabular-nums">{target}</div>
            <div className="flex gap-1">
              <FcBtn kind="lime" onClick={() => setTarget((t) => Math.min(5, t + 1))}>
                1 {">"}
              </FcBtn>
              <FcBtn kind="lime" onClick={() => setTarget((t) => Math.min(5, t + 5))}>
                5 {">>"}
              </FcBtn>
            </div>
          </div>
          <dl className="mt-3 grid gap-1 text-sm">
            <Row k="Cost" v={formatMoney(cost)} />
            <Row k="New weekly cost" v={`£${weeklyFacilityCost(target * 20)}`} />
            <Row k="Bank balance" v={formatMoney(state.cash)} />
          </dl>
          <p className="mt-2 text-xs text-black/60">Levels 1–5 (rating {target * 20}). Current level {current}.</p>
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
            { label: "Settings", onClick: () => go("settings") },
            { label: "Achieved", onClick: () => go("achievements") },
          ]}
        />
      }
    >
      <FcHeader title="Chairman Career" />
      <div className="px-3 py-3">
        <FcCard>
          <div className="flex gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-3xl">👔</div>
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
            { label: "Transfers", onClick: () => go("market") },
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
                <FcBtn className="mt-2 w-full" kind="lime" onClick={() => go("market")}>
                  Open market
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
  const stashSlot = useGame((s) => s.stashSlot);
  const exportCareer = useGame((s) => s.exportCareer);
  const abandon = useGame((s) => s.abandon);
  const [slots, setSlots] = useState(() => listSlots());
  const saveSlot = (id: number) => {
    stashSlot(id);
    setSlots(listSlots());
  };
  const download = () => {
    const raw = exportCareer();
    if (!raw) return;
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tyrone-career.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <FcShell footer={<FcFooter buttons={[{ label: "Back", onClick: () => go("dash") }]} />}>
      <FcHeader title="Settings" />
      <div className="space-y-3 px-3 py-3">
        <FcCard>
          <div className="font-display text-lg font-bold uppercase">Save slots</div>
          <div className="mt-2 grid gap-2">
            {[1, 2, 3, 4, 5].map((id) => {
              const meta = slots.find((s) => s.id === id);
              return (
                <FcBtn key={id} kind="white" onClick={() => saveSlot(id)}>
                  Slot {id}
                  {meta ? `: ${meta.label}` : " (empty)"}
                </FcBtn>
              );
            })}
          </div>
          <FcBtn className="mt-3 w-full" kind="lime" onClick={download}>
            Export career JSON
          </FcBtn>
        </FcCard>
        <FcCard>
          <FcBtn className="w-full" kind="red" onClick={abandon}>
            Resign / new club
          </FcBtn>
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
            { label: "Back", onClick: () => go("dash") },
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
          <div className="font-display text-xl font-bold uppercase">Medical</div>
          <p className="mt-2 text-sm text-black/70">
            Level {level} (rating {level * 20}). Higher levels cut injury time and speed fitness recovery.
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
                <li key={row.id} className={`flex justify-between py-1 ${row.id === USER ? "font-bold text-[var(--color-fc-forest)]" : ""}`}>
                  <span>
                    {i + 1}. {c?.name}
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

function Market() {
  const state = useGame();
  const buy = useGame((s) => s.buy);
  const loan = useGame((s) => s.loan);
  const takeOffer = useGame((s) => s.takeOffer);
  const rejectOffer = useGame((s) => s.rejectOffer);
  const bumpOffer = useGame((s) => s.bumpOffer);
  const counterTalks = useGame((s) => s.counterTalks);
  const acceptTalks = useGame((s) => s.acceptTalks);
  const walkTalks = useGame((s) => s.walkTalks);
  const list = state.players.filter((p) => p.clubId === "market").sort((a, b) => b.fee - a.fee);
  const offerP = state.players.find((p) => p.id === state.offer?.playerId);
  const deal = state.deal;
  const dealP = state.players.find((p) => p.id === deal?.playerId);
  const feeVal = deal?.offerFee ?? 0;
  const wageVal = deal?.offerWage ?? 0;
  const [fee, setFee] = useState<number | null>(null);
  const [wage, setWage] = useState<number | null>(null);
  const offerFee = fee ?? feeVal;
  const offerWage = wage ?? wageVal;
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Back", onClick: () => go("finances") },
            { label: "Budget", onClick: () => go("budget") },
          ]}
        />
      }
    >
      <FcHeader title="Transfers" />
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <FcCard>
          <div className="text-sm">
            Transfer budget: <strong>{formatMoney(transferCap(state))}</strong> ({state.transferBudgetMode})
          </div>
        </FcCard>
        {state.offer && offerP ? (
          <FcCard>
            <div className="font-bold">
              {state.offer.from} want {offerP.name} for {money(state.offer.fee)}.
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <FcBtn kind="lime" onClick={takeOffer}>
                Accept
              </FcBtn>
              <FcBtn kind="white" onClick={bumpOffer}>
                Ask more
              </FcBtn>
              <FcBtn kind="white" onClick={rejectOffer}>
                Decline
              </FcBtn>
            </div>
          </FcCard>
        ) : null}
        {deal && dealP ? (
          <FcCard>
            <div className="font-bold">
              {dealP.name} · round {deal.round + 1}/4
            </div>
            <p className="text-sm">
              Ask {money(deal.askFee)} · £{deal.askWage}/wk
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs">
                Fee
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={offerFee}
                  onChange={(e) => setFee(Number(e.target.value) || 0)}
                />
              </label>
              <label className="text-xs">
                Wage
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-2 py-1"
                  value={offerWage}
                  onChange={(e) => setWage(Number(e.target.value) || 0)}
                />
              </label>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <FcBtn kind="lime" onClick={acceptTalks}>
                Meet ask
              </FcBtn>
              <FcBtn kind="white" disabled={deal.round >= 3} onClick={() => counterTalks(offerFee, offerWage)}>
                Counter
              </FcBtn>
              <FcBtn kind="white" onClick={walkTalks}>
                Walk
              </FcBtn>
            </div>
          </FcCard>
        ) : null}
        {list.map((p) => (
          <FcCard key={p.id}>
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-bold">
                  {p.name} <span className="text-black/50">{p.pos}</span>
                </div>
                <div className="text-xs text-black/60">
                  {p.age} · OVR {maskOvr(ovr(p), state.staff.scout)} · {money(p.wage)}/wk
                </div>
              </div>
              <div className="font-display text-xl font-bold text-[var(--color-fc-forest)]">{money(p.fee)}</div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <FcBtn kind="white" onClick={() => loan(p.id)}>
                Loan
              </FcBtn>
              <FcBtn kind="lime" onClick={() => buy(p.id)}>
                Open talks
              </FcBtn>
            </div>
          </FcCard>
        ))}
      </div>
    </FcShell>
  );
}

function Row({ k, v, muted }: { k: string; v: ReactNode; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 ${muted ? "text-black/45" : ""}`}>
      <dt>{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
