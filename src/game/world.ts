import {
  CUP_PRIZE,
  FORMATIONS,
  FORMATION_IDS,
  OVERDRAFT_RATE,
  PRIZE,
  SPONSORS,
  SQUAD_SHAPE,
  TIER_CLUBS,
  TIER_META,
  TIER_REPS,
  standFacts,
  stadiumLevel,
  standsFromLevel,
  standsOf,
  objectiveHit,
  objectiveText,
} from "./data";
import { createLive, simulateLive, stepMatch } from "./match";
import {
  declineAge,
  growPlayer,
  makePlayer,
  ovr,
  pickXi,
  valueFor,
  wageFor,
} from "./players";
import type {
  Club,
  CreateInput,
  Fixture,
  Message,
  Player,
  Report,
  SaveData,
  SeasonReview,
  TableRow,
  Week,
} from "./types";
import { clamp, unit } from "./util";
import {
  defaultManager,
  emptyRecords,
  makeManagerPool,
  outletCrowdCap,
  outletProfitPerSale,
  pushForm,
  refreshHappiness,
  transferCap,
  unlockAchievement,
} from "./fc";

export const USER = "user";

export function blankSave(): SaveData {
  const manager = defaultManager(1, "possession", "4-3-3");
  return {
    version: 4,
    seed: 1,
    active: false,
    phase: "title",
    screen: "dash",
    managerName: "Tyrone",
    chairmanName: "Tyrone",
    userClubId: USER,
    tier: 3,
    season: 1,
    weekIndex: 0,
    cash: 0,
    debt: 0,
    board: 60,
    fans: 55,
    fanMgrHappy: 75,
    fanChairHappy: 55,
    philosophy: "possession",
    formation: "4-3-3",
    mentality: "balanced",
    tempo: 3,
    pressing: 3,
    width: 3,
    line: "standard",
    build: "mixed",
    training: "technical",
    facilities: { stadium: 1, training: 1, academy: 1, medical: 1 },
    stands: { west: 1, east: 1, north: 0, south: 0 },
    staff: { coach: 2, scout: 1, physio: 1 },
    sponsorName: "Harbor Grain",
    sponsorBoost: 1,
    clubs: [],
    players: [],
    weeks: [],
    xi: [],
    bench: [],
    inbox: [],
    live: null,
    report: null,
    review: null,
    offer: null,
    deal: null,
    history: [],
    userCup: "in",
    objective: objectiveText(3),
    muted: false,
    manager,
    managerPool: [],
    transferBudgetMode: "normal",
    outlets: { burger: 1, counter: 0, cafe: 0, merch: 0 },
    pitchQuality: 39,
    superStadium: false,
    form: "",
    achievements: [],
    trophies: [],
    records: emptyRecords(),
    seasonProfit: 0,
  };
}

export function normalize(raw: SaveData): SaveData {
  const base = blankSave();
  const stands = raw.stands ?? standsFromLevel(raw.facilities?.stadium ?? 1);
  const screenMap: Record<string, SaveData["screen"]> = {
    office: "dash",
    club: "stadium",
    tactics: "manager",
  };
  const rawScreen = (raw.screen as string) ?? "dash";
  const manager =
    raw.manager ??
    defaultManager(raw.seed ?? 1, raw.philosophy ?? "possession", raw.formation ?? "4-3-3");
  const merged: SaveData = {
    ...base,
    ...raw,
    facilities: { ...base.facilities, ...raw.facilities, stadium: stadiumLevel(standsOf({ stands, facilities: raw.facilities ?? base.facilities })) },
    staff: { ...base.staff, ...raw.staff },
    stands,
    line: raw.line ?? "standard",
    build: raw.build ?? "mixed",
    deal: raw.deal ?? null,
    muted: raw.muted ?? false,
    chairmanName: raw.chairmanName ?? raw.managerName ?? "Tyrone",
    manager,
    managerPool: raw.managerPool?.length ? raw.managerPool : makeManagerPool(raw.seed ?? 1, manager.name),
    transferBudgetMode: raw.transferBudgetMode ?? "normal",
    outlets: { ...base.outlets, ...raw.outlets },
    pitchQuality: raw.pitchQuality ?? 39,
    superStadium: raw.superStadium ?? false,
    form: raw.form ?? "",
    achievements: raw.achievements ?? [],
    trophies: raw.trophies ?? [],
    records: { ...emptyRecords(), ...raw.records },
    seasonProfit: raw.seasonProfit ?? 0,
    fanMgrHappy: raw.fanMgrHappy ?? 75,
    fanChairHappy: raw.fanChairHappy ?? raw.fans ?? 55,
    screen: screenMap[rawScreen] ?? (raw.screen as SaveData["screen"]) ?? "dash",
    version: 4,
    active: true,
  };
  if (!FORMATIONS[merged.formation]) merged.formation = "4-3-3";
  if (merged.live) {
    merged.live = {
      ...merged.live,
      period: merged.live.period ?? "regulation",
      penHome: merged.live.penHome ?? 0,
      penAway: merged.live.penAway ?? 0,
      penKicks: merged.live.penKicks ?? [],
      penNext: merged.live.penNext ?? "home",
    };
  }
  return merged;
}

function roundRobin(ids: string[]) {
  const arr = [...ids];
  const n = arr.length;
  const rounds: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i]!;
      const away = arr[n - 1 - i]!;
      pairs.push(i === 0 && r % 2 === 1 ? [away, home] : [home, away]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop()!);
  }
  return rounds;
}

function fixture(id: string, competition: "league" | "cup", homeId: string, awayId: string): Fixture {
  return { id, competition, homeId, awayId, homeScore: null, awayScore: null, attendance: null };
}

export function buildWeeks(ids: string[], seed: number): Week[] {
  const first = roundRobin(ids);
  const second = first.map((pairs) => pairs.map(([h, a]) => [a, h] as [string, string]));
  const all = [...first, ...second];
  const weeks: Week[] = [];
  let matchweek = 0;
  const qfPairs = pairUp(shuffle(ids, seed), seed);
  for (const pairs of all) {
    matchweek += 1;
    weeks.push({
      label: `Matchweek ${matchweek}`,
      kind: "league",
      cupStage: null,
      fixtures: pairs.map(([h, a], i) => fixture(`L${matchweek}-${i}`, "league", h, a)),
    });
    if (matchweek === 4) {
      weeks.push({
        label: "Tyrone Shield · Quarter-final",
        kind: "cup",
        cupStage: "qf",
        fixtures: qfPairs.map(([h, a], i) => fixture(`Cqf-${i}`, "cup", h, a)),
      });
    }
    if (matchweek === 9) {
      weeks.push({
        label: "Tyrone Shield · Semi-final",
        kind: "cup",
        cupStage: "sf",
        fixtures: [],
      });
    }
  }
  weeks.push({
    label: "Tyrone Shield · Final",
    kind: "cup",
    cupStage: "final",
    fixtures: [],
  });
  return weeks;
}

function shuffle<T>(ids: T[], seed: number): T[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(unit(seed, i + 1, 19) * (i + 1));
    const tmp = a[i]!;
    a[i] = a[j]!;
    a[j] = tmp;
  }
  return a;
}

function pairUp(ids: string[], seed: number): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length; i += 2) {
    const a = ids[i];
    const b = ids[i + 1];
    if (!a || !b) continue;
    pairs.push(unit(seed, i, 4) > 0.5 ? [a, b] : [b, a]);
  }
  return pairs;
}

function targetsFor(rep: number) {
  const mean = clamp(42 + rep * 0.4, 58, 86);
  return [6, 4, 3, 2, 2, 1, 1, 0, 0, 0, -1, -1, -2, -3, -4, -5, -6, -8].map((d) =>
    clamp(Math.round(mean + d), 52, 90),
  );
}

function buildSquad(seed: number, club: Club, used: Set<string>, boost = 0): Player[] {
  const targets = targetsFor(club.reputation + boost);
  const order: typeof SQUAD_SHAPE = [
    "ST",
    "GK",
    "CAM",
    "CB",
    "CM",
    "LW",
    "RW",
    "CDM",
    "CB",
    "LB",
    "RB",
    "CM",
    "ST",
    "CB",
    "CDM",
    "LB",
    "RB",
    "GK",
  ];
  return order.map((pos, i) =>
    makePlayer(seed + club.reputation, i + club.id.length * 13, club.id, pos, targets[i] ?? 62, used),
  );
}

export function createGame(input: CreateInput): SaveData {
  const seed = Math.floor(Math.random() * 1_000_000_000) || 7;
  const used = new Set<string>();
  const userClub: Club = {
    id: USER,
    name: input.clubName.trim(),
    short: input.short.trim().toUpperCase().slice(0, 3),
    city: input.city.trim(),
    primary: input.primary,
    secondary: input.secondary,
    stadium: `${input.city.trim()} Park`,
    reputation: 56,
    style: input.philosophy,
  };
  const templates = TIER_CLUBS[3];
  const reps = TIER_REPS[3];
  const ais: Club[] = templates.map((t, i) => ({
    ...t,
    reputation: reps[i] ?? 50,
  }));
  const clubs = [userClub, ...ais];
  let players: Player[] = [];
  players = players.concat(buildSquad(seed, userClub, used, 2));
  for (const club of ais) players = players.concat(buildSquad(seed, club, used));
  const star = players
    .filter((p) => p.clubId === USER && p.pos === "ST")
    .sort((a, b) => ovr(b) - ovr(a))[0];
  if (star) {
    players = players.map((p) =>
      p.id === star.id ? { ...p, pot: Math.max(p.pot, ovr(p) + 4), morale: 74 } : p,
    );
  }
  const kid = players
    .filter((p) => p.clubId === USER)
    .sort((a, b) => a.age - b.age)[0];
  if (kid && kid.id !== star?.id) {
    players = players.map((p) => (p.id === kid.id ? { ...p, pot: clamp(ovr(p) + 14, ovr(p), 92), age: Math.min(p.age, 18) } : p));
  }
  const weeks = buildWeeks(clubs.map((c) => c.id), seed);
  const xiPick = pickXi(players, USER, input.formation);
  const withMarket = players.concat(
    makeMarket({
      ...blankSave(),
      seed,
      tier: 3,
      weekIndex: 0,
      players,
    }),
  );
  players = withMarket;
  const captain = players
    .filter((p) => p.clubId === USER)
    .sort((a, b) => ovr(b) + b.age / 10 - (ovr(a) + a.age / 10))[0];
  const base = blankSave();
  const mgr = defaultManager(seed, input.philosophy, input.formation);
  const save: SaveData = {
    ...base,
    seed,
    active: true,
    phase: "hub",
    screen: "dash",
    managerName: mgr.name,
    chairmanName: input.managerName.trim() || "Tyrone",
    tier: 3,
    season: 1,
    cash: 2_400_000,
    debt: 0,
    board: 64,
    fans: 58,
    fanMgrHappy: 85,
    fanChairHappy: 58,
    philosophy: input.philosophy,
    formation: input.formation,
    line: input.philosophy === "counter" ? "deep" : input.philosophy === "press" || input.philosophy === "possession" ? "high" : "standard",
    build: input.philosophy === "possession" ? "short" : input.philosophy === "direct" || input.philosophy === "counter" ? "direct" : "mixed",
    clubs,
    players,
    weeks,
    xi: xiPick.xi,
    bench: xiPick.bench,
    sponsorName: "Harbor Grain",
    sponsorBoost: 1,
    objective: objectiveText(3),
    manager: { ...mgr, hiredSeason: 1, hiredWeek: 0 },
    managerPool: makeManagerPool(seed, mgr.name),
    transferBudgetMode: "normal",
    outlets: { burger: 1, counter: 0, cafe: 0, merch: 0 },
    pitchQuality: 39,
    superStadium: false,
    form: "",
    achievements: [],
    trophies: [],
    records: emptyRecords(),
    seasonProfit: 0,
    inbox: [
      {
        id: "welcome",
        week: 1,
        tag: "Board",
        title: "The chair is yours",
        body: `${input.managerName.trim() || "Tyrone"}, ${userClub.name} starts in the Harbor League with £2.40m. You hired ${mgr.name}. ${objectiveText(3)}`,
      },
      {
        id: "captain",
        week: 1,
        tag: "Dressing room",
        title: "They'll follow someone",
        body: captain
          ? `${captain.name} sets the tone. Overall ${ovr(captain)}, age ${captain.age}.`
          : "Name a side before matchday.",
      },
    ],
  };
  return save;
}

export function clubOf(state: SaveData, id: string) {
  return state.clubs.find((c) => c.id === id);
}

export function userClub(state: SaveData) {
  return state.clubs.find((c) => c.id === USER);
}

export function userPlayers(state: SaveData) {
  return state.players.filter((p) => p.clubId === USER);
}

export function leagueTable(state: SaveData): TableRow[] {
  const rows = new Map<string, TableRow>();
  for (const c of state.clubs) {
    rows.set(c.id, { id: c.id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });
  }
  for (const week of state.weeks) {
    if (week.kind !== "league") continue;
    for (const f of week.fixtures) {
      if (f.homeScore == null || f.awayScore == null) continue;
      const h = rows.get(f.homeId);
      const a = rows.get(f.awayId);
      if (!h || !a) continue;
      h.p++;
      a.p++;
      h.gf += f.homeScore;
      h.ga += f.awayScore;
      a.gf += f.awayScore;
      a.ga += f.homeScore;
      if (f.homeScore > f.awayScore) {
        h.w++;
        h.pts += 3;
        a.l++;
      } else if (f.homeScore < f.awayScore) {
        a.w++;
        a.pts += 3;
        h.l++;
      } else {
        h.d++;
        a.d++;
        h.pts++;
        a.pts++;
      }
    }
  }
  return [...rows.values()].sort((a, b) => b.pts - a.pts || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf);
}

export function currentWeek(state: SaveData) {
  return state.weeks[state.weekIndex];
}

export function userFixture(state: SaveData) {
  const week = currentWeek(state);
  if (!week) return null;
  return week.fixtures.find((f) => f.homeId === USER || f.awayId === USER) ?? null;
}

export function tablePos(state: SaveData) {
  const table = leagueTable(state);
  const i = table.findIndex((t) => t.id === USER);
  return i < 0 ? 4 : i + 1;
}

export function broadcastWeekly(state: SaveData) {
  const base = state.tier === 1 ? 155000 : state.tier === 2 ? 48000 : 18000;
  const merit = state.tier === 1 ? 7000 : state.tier === 2 ? 2200 : 650;
  return Math.round(base + (4.5 - tablePos(state)) * merit);
}

export function commercialWeekly(state: SaveData) {
  const base = state.tier === 1 ? 42000 : state.tier === 2 ? 22000 : 14000;
  const outlets = state.outlets ?? { burger: 1, counter: 0, cafe: 0, merch: 0 };
  const food = outletCrowdCap(outlets) * outletProfitPerSale(outlets) * 0.35;
  const merch = outlets.merch * 1800 + state.fans * 40;
  return Math.round((base + state.fans * 120 + food + merch) * state.sponsorBoost);
}

export function sponsorWeekly(state: SaveData) {
  return commercialWeekly(state);
}

export function playerWages(state: SaveData) {
  return userPlayers(state).reduce((s, p) => s + (p.loan === "out" ? Math.round(p.wage * 0.4) : p.wage), 0);
}

export function staffWages(state: SaveData) {
  return state.staff.coach * 4200 + state.staff.scout * 2600 + state.staff.physio * 2600;
}

export function groundRun(state: SaveData) {
  const stands = standsOf(state);
  const rate = { west: 780, east: 560, north: 420, south: 360 };
  let run = 0;
  (Object.keys(rate) as (keyof typeof rate)[]).forEach((id) => {
    run += (stands[id] + 1) * rate[id];
  });
  const fac = (state.facilities.training + state.facilities.academy + state.facilities.medical) * 1400;
  const mgrWage = (state.manager?.wage ?? 0) * 1;
  const cut = state.superStadium ? 0.72 : 1;
  return Math.round((run + fac) * cut + mgrWage);
}

export function wageBill(state: SaveData) {
  return playerWages(state) + staffWages(state) + groundRun(state);
}

export function ticketPrice(tier: 1 | 2 | 3) {
  return tier === 1 ? 44 : tier === 2 ? 26 : 17;
}

export function boxPrice(tier: 1 | 2 | 3) {
  return tier === 1 ? 160 : tier === 2 ? 88 : 54;
}

export function crowd(state: SaveData) {
  const stands = standsOf(state);
  const facts = standFacts(stands);
  const occ = clamp(0.46 + state.fans / 260 + stands.north * 0.018 + (stands.west >= 3 ? 0.015 : 0), 0.4, 0.97);
  const boxOcc = clamp(occ + 0.12, 0.55, 0.98);
  const standard = Math.max(0, facts.seats - facts.boxes);
  const attendance = Math.round(standard * occ + facts.boxes * boxOcc);
  const ticket = ticketPrice(state.tier);
  const box = boxPrice(state.tier);
  const gate = Math.round(standard * occ * ticket + facts.boxes * boxOcc * box);
  return { cap: facts.seats, boxes: facts.boxes, attendance, gate, occ, boxOcc, ticket, box, standard };
}

export function expectedGate(state: SaveData) {
  return crowd(state).gate;
}

export const SEASON_WEEKS = 17;
export const HOME_GATES = 7;

export function ledger(state: SaveData) {
  const tv = broadcastWeekly(state);
  const shirt = commercialWeekly(state);
  const gate = crowd(state);
  const players = playerWages(state);
  const staff = staffWages(state);
  const ground = groundRun(state);
  const interest = Math.round(state.debt * OVERDRAFT_RATE);
  const seasonIn = (tv + shirt) * SEASON_WEEKS + gate.gate * HOME_GATES;
  const seasonWages = players * SEASON_WEEKS;
  const ratio = seasonIn > 0 ? seasonWages / seasonIn : 1;
  return { tv, shirt, gate, players, staff, ground, interest, seasonIn, seasonWages, ratio, pos: tablePos(state) };
}

export function wageVerdict(ratio: number) {
  if (ratio < 0.6) return "Room in the wage bill. Real top-flight sides try to keep squad cost under 70% of income.";
  if (ratio < 0.7) return "Inside the band UEFA set: squad cost under 70% of income.";
  if (ratio < 1) return "Tight. Normal for a division that still lives on the gate.";
  return "Wages are ahead of income. Real clubs in this spot earn a transfer embargo.";
}

function pushInbox(state: SaveData, msg: Omit<Message, "id" | "week">): Message[] {
  const next: Message = {
    ...msg,
    id: `m${state.season}-${state.weekIndex}-${state.inbox.length}-${msg.tag}`,
    week: state.weekIndex + 1,
  };
  return [next, ...state.inbox].slice(0, 28);
}

function runManagerTransfers(state: SaveData, seed: number) {
  let players = state.players.slice();
  let cash = state.cash;
  let inbox = state.inbox;
  let manager = { ...state.manager };
  const cap = transferCap({ ...state, cash });
  if (cap < 40_000 || state.transferBudgetMode === "zero") {
    return { players, cash, inbox, manager };
  }
  // Only shop some weeks so it feels deliberate.
  if (unit(seed, 1, 2) > 0.42) return { players, cash, inbox, manager };

  const squad = players.filter((p) => p.clubId === USER && p.loan !== "out");
  const byPos = new Map<string, number>();
  for (const p of squad) byPos.set(p.pos, (byPos.get(p.pos) ?? 0) + 1);
  const need =
    ["GK", "CB", "ST", "CM", "LW", "RW", "LB", "RB", "CDM", "CAM"].find((pos) => (byPos.get(pos) ?? 0) < (pos === "CB" || pos === "CM" ? 2 : 1)) ??
    "ST";

  const market = players
    .filter((p) => p.clubId === "market" && p.pos === need && (p.fee || valueFor(p)) <= cap)
    .sort((a, b) => ovr(b) - ovr(a));
  const pick = market[0];
  if (!pick) return { players, cash, inbox, manager };
  const fee = pick.fee || Math.round(valueFor(pick) * 0.95);
  if (fee > cap || cash < fee) return { players, cash, inbox, manager };
  if (squad.length >= 26) return { players, cash, inbox, manager };

  const wage = Math.max(pick.wage, wageFor(Math.max(ovr(pick), 40), pick.age));
  cash -= fee;
  players = players.map((p) =>
    p.id === pick.id
      ? { ...p, clubId: USER, wage, contract: 3, fee: 0, loan: null, morale: clamp(p.morale + 8, 40, 99) }
      : p,
  );
  manager.happiness = clamp(manager.happiness + 2, 20, 99);
  inbox = pushInbox(
    { ...state, inbox },
    {
      tag: "Manager",
      title: `${manager.name} signed ${pick.name}`,
      body: `Paid ${Math.round(fee / 1000)}k for a ${pick.pos}. Transfer budget mode: ${state.transferBudgetMode}.`,
    },
  );
  return { players, cash, inbox, manager };
}

function winnersOf(week: Week): string[] {
  return week.fixtures.map((f) => {
    if ((f.homeScore ?? 0) === (f.awayScore ?? 0)) return f.homeId;
    return (f.homeScore ?? 0) > (f.awayScore ?? 0) ? f.homeId : f.awayId;
  });
}

function fillNextCup(weeks: Week[], from: number): Week[] {
  const played = weeks[from];
  if (!played || played.kind !== "cup") return weeks;
  const winners = winnersOf(played);
  const nextIndex = weeks.findIndex((w, i) => i > from && w.kind === "cup" && w.fixtures.length === 0);
  if (nextIndex < 0) return weeks;
  const next = weeks[nextIndex];
  if (!next) return weeks;
  const pairs = pairUp(winners, from * 17 + winners.length);
  const fixtures = pairs.map(([h, a], i) => fixture(`C${next.cupStage}-${i}`, "cup", h, a));
  const copy = weeks.slice();
  copy[nextIndex] = { ...next, fixtures };
  return copy;
}

export function resolveWeek(state: SaveData, live: ReturnType<typeof createLive> | null): SaveData {
  const week = currentWeek(state);
  if (!week) return enterReview(state);
  let weeks = state.weeks.map((w) => ({ ...w, fixtures: w.fixtures.map((f) => ({ ...f })) }));
  const weekNow = weeks[state.weekIndex];
  if (!weekNow) return state;
  const other: Report["other"] = [];
  const notes: string[] = [];
  let userLive = live;

  if (!userLive) {
    const tie = weekNow.fixtures.find((f) => f.homeId === USER || f.awayId === USER);
    if (tie) userLive = simulateLive(state, tie.id, "measured");
  }

  for (const f of weekNow.fixtures) {
    if (userLive && f.id === userLive.fixtureId) {
      f.homeScore = userLive.homeScore;
      f.awayScore = userLive.awayScore;
    } else if (f.homeScore == null) {
      const sim = simulateLive(state, f.id, "measured");
      f.homeScore = sim.homeScore;
      f.awayScore = sim.awayScore;
      other.push({ homeId: f.homeId, awayId: f.awayId, hs: sim.homeScore, as: sim.awayScore });
    }
  }

  if (weekNow.kind === "cup") weeks = fillNextCup(weeks, state.weekIndex);

  let players = state.players.map((p) => ({ ...p, attrs: { ...p.attrs } }));
  let board = state.board;
  let fans = state.fans;
  let boardDelta = 0;
  let fanDelta = 0;
  let cash = state.cash;
  let debt = state.debt;
  const wages = wageBill(state);
  const sponsor = commercialWeekly(state);
  const broadcast = broadcastWeekly(state);
  const interest = Math.round(debt * OVERDRAFT_RATE);
  let gate = 0;

  if (userLive && (userLive.homeId === USER || userLive.awayId === USER)) {
    const home = userLive.homeId === USER;
    const gf = home ? userLive.homeScore : userLive.awayScore;
    const ga = home ? userLive.awayScore : userLive.homeScore;
    const win = gf > ga;
    const draw = gf === ga;
    if (userLive.competition === "league") {
      boardDelta += win ? 4 : draw ? 1 : -4;
      fanDelta += win ? 3 : draw ? 0 : -2;
    } else {
      boardDelta += win ? 6 : -3;
      fanDelta += win ? 4 : -1;
      if (!win && weekNow.cupStage) {
        /* eliminated below */
      }
    }
    if (userLive.pressTone === "bold" && gf < ga) {
      boardDelta -= 3;
      notes.push("The bold press talk aged badly.");
    }
    if (userLive.shouts.includes("demand") && gf < ga) {
      boardDelta -= 2;
      notes.push("Demanding more without a win irritated the board.");
    }
    if (win) notes.push(userLive.competition === "cup" ? "The Shield stays alive." : "Three points on the board sheet.");
    else if (draw) notes.push("A point. The board wanted more.");
    else notes.push("Defeat. The chair feels colder.");

    if (home) {
      const gateState = { ...state, fans };
      const c = crowd(gateState);
      gate = c.gate;
      const tie = weekNow.fixtures.find((f) => f.id === userLive.fixtureId);
      if (tie) tie.attendance = c.attendance;
      const inBoxes = Math.round(c.boxes * c.boxOcc);
      notes.push(
        `Gate: ${c.attendance.toLocaleString("en-GB")} of ${c.cap.toLocaleString("en-GB")}${inBoxes ? `, ${inBoxes.toLocaleString("en-GB")} in the boxes` : ""}.`,
      );
    }
    const bonus = win ? (state.tier === 1 ? 80000 : state.tier === 2 ? 40000 : 22000) : draw ? 8000 : 0;
    cash += gate + sponsor + broadcast + bonus - wages - interest;

    const sideIds = new Set(home ? userLive.homeXi : userLive.awayXi);
    const minutesOf = (id: string) => {
      const on = userLive.cameOn[id] ?? 0;
      if (userLive.cameOn[id] == null && !sideIds.has(id)) return 0;
      return Math.max(0, (userLive.wentOff[id] ?? userLive.minute) - on);
    };
    const involved = new Set<string>();
    for (const id of sideIds) involved.add(id);
    for (const id of Object.keys(userLive.wentOff)) {
      if (minutesOf(id) > 0) involved.add(id);
    }

    players = players.map((p) => {
      if (p.clubId !== USER) return p;
      const enteringBan = p.banned;
      let banned = enteringBan > 0 ? enteringBan - 1 : 0;
      if (!involved.has(p.id)) {
        const morale = p.age >= 26 && p.injured <= 0 && p.banned <= 0 ? clamp(p.morale - 1, 20, 99) : p.morale;
        return { ...p, banned, morale };
      }
      const mins = Math.max(1, minutesOf(p.id));
      const rating = userLive.ratings[p.id] ?? 6.2;
      let morale = p.morale + (win ? 5 : draw ? 1 : -4);
      if (rating >= 8) morale += 3;
      if (rating <= 5.4) morale -= 3;
      if (mins < 25 && p.age > 24) morale -= 1;
      const sentOff = userLive.log.some(
        (l) => l.kind === "card" && l.text.startsWith("Red card") && l.text.includes(p.name),
      );
      const addYellow = userLive.yellow[p.id] ?? 0;
      let seasonYellows = p.yellows + addYellow;
      if (sentOff) banned = Math.max(banned, 1);
      if (seasonYellows >= 5) {
        banned = Math.max(banned, 1);
        seasonYellows = 0;
        notes.push(`${p.name} is suspended after five bookings.`);
      }
      const hurt = userLive.hurt.find((h) => h.id === p.id);
      const goals = userLive.scorers.filter((s) => s.playerId === p.id).length;
      const assists = userLive.scorers.filter((s) => s.assistId === p.id).length;
      if (hurt) notes.push(`${p.name} will miss about ${hurt.weeks} week${hurt.weeks > 1 ? "s" : ""}.`);
      return {
        ...p,
        morale: clamp(Math.round(morale), 20, 99),
        fitness: clamp(Math.round(userLive.stamina[p.id] ?? p.fitness), 35, 100),
        injured: hurt ? Math.max(1, hurt.weeks - (state.facilities.medical >= 4 ? 1 : 0)) : p.injured,
        yellows: seasonYellows,
        banned,
        played: p.played + 1,
        goals: p.goals + goals,
        assists: p.assists + assists,
        ratingSum: p.ratingSum + rating,
        ratingN: p.ratingN + 1,
      };
    });
  } else {
    cash += sponsor + broadcast - wages - interest;
    players = players.map((p) => (p.clubId === USER && p.banned > 0 ? { ...p, banned: p.banned - 1 } : p));
    if (weekNow.kind === "cup" && other.length) {
      const lines = other
        .map((o) => {
          const h = state.clubs.find((c) => c.id === o.homeId)?.short ?? "Home";
          const a = state.clubs.find((c) => c.id === o.awayId)?.short ?? "Away";
          return `${h} ${o.hs}–${a} ${o.as}`;
        })
        .join(", ");
      notes.push(lines);
    } else {
      notes.push("No match for you this week. Training and wages still run.");
    }
  }

  let userCup = state.userCup;
  if (userLive && userLive.competition === "cup") {
    const home = userLive.homeId === USER;
    const gf = home ? userLive.homeScore : userLive.awayScore;
    const ga = home ? userLive.awayScore : userLive.homeScore;
    if (gf < ga) userCup = "out";
    if (gf > ga && weekNow.cupStage === "final") userCup = "winner";
  }

  // training + recovery
  players = players.map((p) => {
    if (p.clubId !== USER || p.loan === "out") return p;
    let fitness = p.fitness;
    if (p.injured > 0) {
      const heal = state.facilities.medical >= 3 && state.staff.physio >= 3 ? 2 : 1;
      const injured = Math.max(0, p.injured - heal);
      return { ...p, injured, fitness: clamp(fitness + 8, 40, 80), banned: Math.max(0, p.banned - (injured > 0 ? 0 : 1)) };
    }
    const banned = p.banned;
    const rec = 10 + state.facilities.medical * 3 + state.staff.physio * 2 + (state.training === "fitness" ? 8 : 0);
    fitness = clamp(fitness + rec, 40, 100);
    let gain = 6 + state.staff.coach * 3 + state.facilities.training * 2;
    if (state.training === "fitness") gain = Math.round(gain * 0.45);
    if (p.age <= 21) gain += state.facilities.academy * 2 + (state.training === "youth" || state.philosophy === "youth" ? 6 : 0);
    const grown = growPlayer({ ...p, fitness, banned }, state.training, gain);
    return grown;
  });

  if (cash < 0) {
    debt += Math.abs(cash) + 25000;
    notes.push("The bank covered the shortfall. The board noticed.");
    boardDelta -= 6;
    cash = 0;
  }

  board = clamp(Math.round(board + boardDelta), 0, 100);
  fans = clamp(Math.round(fans + fanDelta), 8, 99);

  let offer = state.offer;
  if (!offer && state.weekIndex % 4 === 2) {
    const sellable = players.filter((p) => p.clubId === USER && p.loan !== "in" && !state.xi.includes(p.id));
    const pick = sellable[Math.floor(unit(state.seed, state.weekIndex, 21) * sellable.length)];
    if (pick) {
      const from = state.clubs.find((c) => c.id !== USER);
      offer = {
        playerId: pick.id,
        fee: Math.round((valueFor(pick) * (0.8 + unit(state.seed, state.weekIndex, 22) * 0.35)) / 10000) * 10000,
        from: from?.name ?? "A rival",
      };
    }
  }

  let inbox = state.inbox;
  if (!userLive && weekNow.kind === "cup" && other.length) {
    const lines = other
      .map((o) => {
        const h = state.clubs.find((c) => c.id === o.homeId)?.short ?? "Home";
        const a = state.clubs.find((c) => c.id === o.awayId)?.short ?? "Away";
        return `${h} ${o.hs}–${a} ${o.as}`;
      })
      .join(", ");
    inbox = pushInbox({ ...state, inbox }, { tag: "Shield", title: weekNow.label, body: lines });
  }
  if (offer && offer !== state.offer) {
    const p = players.find((x) => x.id === offer?.playerId);
    inbox = pushInbox(
      { ...state, inbox },
      {
        tag: "Offer",
        title: `${offer.from} enquire`,
        body: p ? `They will pay £${Math.round(offer.fee / 1000)}k for ${p.name}. Answer on the market desk.` : "An offer arrived.",
      },
    );
  }

  // market refresh every 4 weeks
  if (state.weekIndex % 4 === 3) {
    const kept = players.filter((p) => p.clubId !== "market");
    const fresh = makeMarket({ ...state, players: kept, seed: state.seed + state.weekIndex });
    players = kept.concat(fresh);
    inbox = pushInbox({ ...state, inbox }, { tag: "Scout", title: "New names on the list", body: "The market list turned over. Your scout's eye decides how sharp the ratings look." });
  }

  const report: Report | null = userLive
    ? buildReport(state, userLive, { gate, wages, sponsor, broadcast, boardDelta, fanDelta, notes, other })
    : state.report;

  const nextIndex = state.weekIndex + 1;
  const sacked = board <= 4;
  let form = state.form ?? "";
  let manager = { ...state.manager };
  let records = { ...state.records };
  let trophies = state.trophies.slice();
  if (userLive && (userLive.homeId === USER || userLive.awayId === USER)) {
    const home = userLive.homeId === USER;
    const gf = home ? userLive.homeScore : userLive.awayScore;
    const ga = home ? userLive.awayScore : userLive.homeScore;
    const result = gf > ga ? "W" : gf < ga ? "L" : "D";
    form = pushForm(form, result);
    manager.played += 1;
    if (result === "W") manager.won += 1;
    else if (result === "D") manager.drawn += 1;
    else manager.lost += 1;
    manager.happiness = clamp(manager.happiness + (result === "W" ? 3 : result === "D" ? 0 : -4), 20, 99);
    if (gate > (records.biggestCrowd ?? 0)) {
      const foe = state.clubs.find((c) => c.id === (home ? userLive.awayId : userLive.homeId));
      records.biggestCrowd = gate;
      records.biggestCrowdLabel = `vs ${foe?.name ?? "opponent"}, S${state.season}`;
    }
    if (result === "L") {
      const margin = ga - gf;
      const prev = records.heaviestDefeat.match(/(\d+)-(\d+)/);
      const prevMargin = prev ? Number(prev[1]) - Number(prev[2]) : -1;
      if (margin > prevMargin) {
        records.heaviestDefeat = `${ga}-${gf}`;
        const foe = state.clubs.find((c) => c.id === (home ? userLive.awayId : userLive.homeId));
        records.heaviestDefeatLabel = `vs ${foe?.name ?? "opponent"}, S${state.season}`;
      }
    }
    if (manager.played > (records.longestManagerGames ?? 0)) {
      records.longestManagerGames = manager.played;
      records.longestManagerName = manager.name;
    }
  }

  // manager shops within the chairman's transfer budget
  {
    const shop = runManagerTransfers(
      { ...state, players, cash, inbox, manager },
      state.seed + state.weekIndex * 17,
    );
    players = shop.players;
    cash = shop.cash;
    inbox = shop.inbox;
    manager = shop.manager;
  }

  const weekDelta = cash - state.cash;

  let next: SaveData = {
    ...state,
    weeks,
    players,
    cash,
    debt,
    board,
    fans,
    userCup,
    offer,
    inbox,
    live: null,
    report,
    phase: sacked ? "sacked" : userLive ? "report" : "hub",
    weekIndex: nextIndex,
    screen: "dash",
    form,
    manager,
    records,
    trophies,
    seasonProfit: (state.seasonProfit ?? 0) + weekDelta,
  };

  next = refreshHappiness(next);

  if (
    userLive &&
    userLive.competition === "cup" &&
    weekNow.cupStage === "final" &&
    (userLive.homeId === USER || userLive.awayId === USER)
  ) {
    next = unlockAchievement(next, "shield_final");
  }
  if (userCup === "winner" && !trophies.some((t) => t.id === `shield-${state.season}`)) {
    next.trophies = [...trophies, { id: `shield-${state.season}`, season: state.season, label: "Tyrone Shield" }];
    next = unlockAchievement(next, "shield");
  }
  if ((records.biggestCrowd ?? 0) >= 5000) next = unlockAchievement(next, "crowd5k");
  if (state.facilities.academy >= 4) next = unlockAchievement(next, "youth");

  if (!sacked && nextIndex >= weeks.length) {
    const reviewed = enterReview(next);
    if (reviewed.phase === "sacked") return reviewed;
    let done: SaveData = { ...reviewed, phase: userLive ? "report" : "season" };
    const move = reviewed.review?.move;
    const pos = reviewed.review?.pos ?? 99;
    if (move === "up" && state.tier === 3) done = unlockAchievement(done, "promo3");
    if (move === "up" && state.tier === 2) done = unlockAchievement(done, "promo2");
    if (state.tier === 1 && pos === 1) {
      done = unlockAchievement(done, "champ1");
      done = {
        ...done,
        trophies: [...done.trophies, { id: `prem-${state.season}`, season: state.season, label: "Tyrone Premier" }],
      };
    }
    if (state.tier === 1 && pos <= 4) done = unlockAchievement(done, "top4_1");
    if (move !== "down") done = unlockAchievement(done, "survive");
    if ((state.seasonProfit ?? 0) + weekDelta > 0) done = unlockAchievement(done, "profit");
    return done;
  }
  return next;
}

function buildReport(
  state: SaveData,
  live: NonNullable<SaveData["live"]>,
  extra: {
    gate: number;
    wages: number;
    sponsor: number;
    broadcast: number;
    boardDelta: number;
    fanDelta: number;
    notes: string[];
    other: Report["other"];
  },
): Report {
  const ids = [...new Set([...live.homeXi, ...live.awayXi, ...Object.keys(live.ratings)])];
  const ratings = ids
    .map((id) => {
      const p = state.players.find((x) => x.id === id);
      if (!p || live.ratings[id] == null) return null;
      const clubId = live.homeXi.includes(id) || live.homeBench.includes(id) || p.clubId === live.homeId ? p.clubId : p.clubId;
      return { id, name: p.name, pos: p.pos, rating: Math.round(live.ratings[id]! * 10) / 10, clubId: p.clubId };
    })
    .filter((x): x is Report["ratings"][number] => !!x)
    .sort((a, b) => b.rating - a.rating);
  return {
    homeId: live.homeId,
    awayId: live.awayId,
    homeScore: live.homeScore,
    awayScore: live.awayScore,
    competition: live.competition,
    label: live.weekLabel,
    scorers: live.scorers,
    ratings: ratings.slice(0, 16),
    motm: ratings[0]?.name ?? "—",
    gate: extra.gate,
    wages: extra.wages,
    sponsor: extra.sponsor,
    broadcast: extra.broadcast,
    other: extra.other,
    boardDelta: extra.boardDelta,
    fanDelta: extra.fanDelta,
    notes: extra.notes,
    xgH: live.xgH,
    xgA: live.xgA,
  };
}

function makeMarket(state: SaveData): Player[] {
  const used = new Set(state.players.map((p) => p.name));
  const mean = state.tier === 1 ? 76 : state.tier === 2 ? 68 : 62;
  const list: Player[] = [];
  const poses = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"] as const;
  for (let i = 0; i < 12; i++) {
    const pos = poses[i % poses.length] ?? "CM";
    const target = clamp(mean + Math.round((unit(state.seed, i, 30) - 0.45) * 16), 54, 88);
    const p = makePlayer(state.seed + 99, 400 + i, "market", pos, target, used);
    p.fee = Math.round((valueFor(p) * (1.02 + unit(state.seed, i, 31) * 0.28)) / 10000) * 10000;
    p.contract = 3;
    list.push(p);
  }
  return list;
}

export function enterReview(state: SaveData): SaveData {
  const table = leagueTable(state);
  const pos = Math.max(1, table.findIndex((t) => t.id === USER) + 1);
  const prize = (PRIZE[state.tier][pos - 1] ?? 20000) + (state.userCup === "winner" ? CUP_PRIZE[state.tier] : 0);
  const hit = objectiveHit(state.tier, pos);
  const move: SeasonReview["move"] =
    pos <= 2 && state.tier > 1 ? "up" : pos >= 7 && state.tier < 3 ? "down" : "stay";
  let board = clamp(state.board + (hit ? 12 : -10) + (pos === 1 ? 8 : 0) + (move === "up" ? 8 : move === "down" ? -16 : 0), 0, 100);
  const review: SeasonReview = {
    pos,
    prize,
    cup: state.userCup === "winner" ? "Tyrone Shield winners" : state.userCup === "out" ? "Shield exit" : "Shield still open",
    move,
    objectiveHit: hit,
    table,
    tier: state.tier,
  };
  const sacked = board <= 6;
  return {
    ...state,
    review,
    board,
    cash: state.cash + prize,
    phase: sacked ? "sacked" : "season",
    history: [...state.history, { season: state.season, tier: state.tier, pos, pts: table.find((t) => t.id === USER)?.pts ?? 0 }],
  };
}

function ageResetPlayer(p: Player): Player {
  const aged = declineAge({ ...p, age: p.age + 1, attrs: { ...p.attrs } });
  const grown =
    aged.age <= 28
      ? growPlayer(aged, "technical", 28 + Math.floor(unit(p.id.length * 17, p.age, 9) * 40))
      : aged;
  return {
    ...grown,
    contract: Math.max(1, p.contract - 1),
    loan: null,
    injured: 0,
    banned: 0,
    yellows: 0,
    fitness: 94,
    played: 0,
    goals: 0,
    assists: 0,
    ratingSum: 0,
    ratingN: 0,
    fee: 0,
    morale: clamp(p.morale + (p.goals >= 8 ? 4 : 0), 40, 95),
  };
}

function persistAiSquad(
  state: SaveData,
  club: Club,
  used: Set<string>,
  carryPool: Player[],
): Player[] {
  const previous = state.players
    .filter((p) => p.clubId === club.id)
    .map(ageResetPlayer)
    .sort((a, b) => ovr(b) - ovr(a));
  const kept: Player[] = [];
  for (const p of previous) {
    if (kept.length >= 16) break;
    if (used.has(p.name)) continue;
    if (p.age >= 35 && unit(state.seed, p.age, club.id.length) > 0.55) continue;
    used.add(p.name);
    kept.push({ ...p, clubId: club.id });
  }
  while (kept.length < 18 && carryPool.length) {
    const star = carryPool.shift();
    if (!star || used.has(star.name)) continue;
    used.add(star.name);
    kept.push({ ...star, clubId: club.id, contract: Math.max(2, star.contract) });
  }
  if (kept.length < 18) {
    const fillers = buildSquad(state.seed + state.season * 50 + club.reputation, club, used).slice(0, 18 - kept.length);
    kept.push(...fillers);
  }
  return kept;
}

export function openNextSeason(state: SaveData): SaveData {
  const review = state.review;
  const move = review?.move ?? "stay";
  let tier = state.tier;
  if (move === "up") tier = (tier - 1) as 1 | 2 | 3;
  if (move === "down") tier = (tier + 1) as 1 | 2 | 3;
  const prevUser = userClub(state);
  if (!prevUser) return state;
  const reputation = clamp(
    prevUser.reputation + (move === "up" ? 8 : move === "down" ? -7 : 1),
    40,
    92,
  );
  const user: Club = { ...prevUser, reputation, style: state.philosophy };
  const templates = TIER_CLUBS[tier];
  const reps = TIER_REPS[tier];
  const ais: Club[] = templates.map((t, i) => ({ ...t, reputation: reps[i] ?? 60 }));
  const clubs = [user, ...ais];
  const used = new Set<string>();
  let mine = state.players
    .filter((p) => p.clubId === USER && p.loan !== "in")
    .map((p) => {
      const aged = declineAge({ ...p, age: p.age + 1, attrs: { ...p.attrs } });
      return {
        ...aged,
        contract: p.loan === "out" ? p.contract : p.contract - 1,
        loan: null as Player["loan"],
        injured: 0,
        banned: 0,
        yellows: 0,
        fitness: 94,
        played: 0,
        goals: 0,
        assists: 0,
        ratingSum: 0,
        ratingN: 0,
        fee: 0,
      };
    });
  const left = mine.filter((p) => p.contract <= 0);
  mine = mine.filter((p) => p.contract > 0);
  for (const p of mine) used.add(p.name);
  let players = mine.slice();

  const oldAiIds = new Set(state.clubs.filter((c) => c.id !== USER).map((c) => c.id));
  const newAiIds = new Set(ais.map((c) => c.id));
  const carryPool = state.players
    .filter((p) => oldAiIds.has(p.clubId) && !newAiIds.has(p.clubId))
    .map(ageResetPlayer)
    .sort((a, b) => ovr(b) * 10 + b.goals - (ovr(a) * 10 + a.goals))
    .slice(0, 24);
  for (const p of carryPool) {
    /* names reserved when assigned */
  }

  const memorable = state.players
    .filter((p) => oldAiIds.has(p.clubId) && p.goals + p.assists >= 8)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, 4);
  const returningNotes = memorable.map((p) => {
    const club = state.clubs.find((c) => c.id === p.clubId);
    return `${p.name} (${club?.short ?? "AI"})`;
  });
  for (const club of ais) {
    const sameClub = oldAiIds.has(club.id);
    const squad = persistAiSquad(state, club, used, sameClub ? [] : carryPool);
    players = players.concat(squad);
  }

  const intakes: Player[] = [];
  const youthN = state.facilities.academy >= 4 ? 2 : 1;
  for (let i = 0; i < youthN; i++) {
    const pos = SQUAD_SHAPE[Math.floor(unit(state.seed, state.season, i + 3) * SQUAD_SHAPE.length)] ?? "CM";
    const target = clamp(54 + state.facilities.academy * 3 + Math.floor(unit(state.seed, i, 8) * 6), 54, 74);
    const kid = makePlayer(state.seed + 500 + state.season, 800 + i, USER, pos, target, used, -2);
    kid.age = 17;
    kid.contract = 3;
    kid.pot = clamp(ovr(kid) + 8 + state.facilities.academy * 2, ovr(kid), 93);
    kid.wage = wageFor(ovr(kid), 17);
    intakes.push(kid);
  }
  players = players.concat(intakes);
  const market = makeMarket({ ...state, seed: state.seed + state.season * 13, tier, players });
  players = players.concat(market);
  const weeks = buildWeeks(clubs.map((c) => c.id), state.seed + state.season * 99);
  const picked = pickXi(players, USER, state.formation);
  const sponsorName = SPONSORS[Math.floor(unit(state.seed, state.season, 12) * SPONSORS.length)] ?? "Brassline";
  let inbox: Message[] = [
    {
      id: `s${state.season + 1}`,
      week: 1,
      tag: "Board",
      title: move === "up" ? "Promotion" : move === "down" ? "Relegation" : "Another season",
      body:
        move === "up"
          ? `${user.name} go up into the ${TIER_META[tier].name}. ${objectiveText(tier)}`
          : move === "down"
            ? `The drop into the ${TIER_META[tier].name} stings. ${objectiveText(tier)}`
            : `${TIER_META[tier].name}, season ${state.season + 1}. ${objectiveText(tier)}`,
    },
  ];
  if (returningNotes.length) {
    inbox.push({
      id: `rivals${state.season}`,
      week: 1,
      tag: "Scouting",
      title: "Familiar faces",
      body: `${returningNotes.slice(0, 4).join(", ")} are still around. The ledger remembers.`,
    });
  }
  if (left.length) {
    inbox.push({
      id: `left${state.season}`,
      week: 1,
      tag: "Contracts",
      title: "Players walked",
      body: `${left.map((p) => p.name).join(", ")} refused to stay without a new deal.`,
    });
  }
  if (intakes.length) {
    inbox.push({
      id: `youth${state.season}`,
      week: 1,
      tag: "Academy",
      title: "Intake",
      body: intakes.map((p) => `${p.name}, ${p.pos}, potential ${p.pot}`).join(". ") + ".",
    });
  }
  return {
    ...state,
    tier,
    season: state.season + 1,
    weekIndex: 0,
    clubs,
    players,
    weeks,
    xi: picked.xi,
    bench: picked.bench,
    inbox,
    phase: "hub",
    screen: "dash",
    review: null,
    seasonProfit: 0,
    report: null,
    live: null,
    offer: null,
    deal: null,
    userCup: "in",
    objective: objectiveText(tier),
    sponsorName,
    sponsorBoost: clamp(0.9 + (review && review.pos <= 3 ? 0.15 : 0), 0.85, 1.25),
    fans: clamp(state.fans + (move === "up" ? 6 : move === "down" ? -6 : 0), 10, 99),
  };
}

export function beginLive(state: SaveData, tone: "bold" | "measured" | "deflect") {
  const tie = userFixture(state);
  if (!tie) return state;
  const xi = state.xi.length === 11 ? state : { ...state, ...pickInto(state) };
  const live = createLive(xi, tie.id, tone);
  return { ...xi, live, phase: "match" as const };
}

function pickInto(state: SaveData): Pick<SaveData, "xi" | "bench"> {
  return pickXi(state.players, USER, state.formation);
}

export function ensureXi(state: SaveData): SaveData {
  if (state.xi.filter(Boolean).length === 11) return state;
  const picked = pickXi(state.players, USER, state.formation);
  return { ...state, xi: picked.xi, bench: picked.bench };
}

export { stepMatch, FORMATION_IDS };
