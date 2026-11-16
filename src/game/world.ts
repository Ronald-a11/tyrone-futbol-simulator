import {
  CUP_PRIZE,
  FORMATIONS,
  FORMATION_IDS,
  OVERDRAFT_RATE,
  PRIZE,
  SPONSORS,
  SQUAD_SHAPE,
  STANDS,
  START_BUDGET,
  TIER_META,
  TIER_REPS,
  staffCap,
  standFacts,
  stadiumLevel,
  standsFromLevel,
  standsOf,
  objectiveHit,
  objectiveText,
  lineOf,
  relegSlots,
  ticketPrice as tierTicket,
  boxPrice as tierBox,
} from "./data";
import type { LeagueTier } from "./england";
import {
  SAVE_VERSION,
  autoPromo,
  clubsFor,
  feeScale,
  matchDrawPrize,
  matchWinPrize,
  playoffBand,
  PLAYOFF_PRIZE,
  repsFor,
  transferWindowOpen,
  wageBand,
} from "./england";
import { createLive, simulateLive, stepMatch } from "./match";
import {
  blankComp,
  bumpComp,
  declineAge,
  ensureComp,
  growPlayer,
  makePlayer,
  ovr,
  pickXi,
  valueFor,
  wageFor,
} from "./players";
import { bestPlayerNominees, otherLeagueBlurb, seasonLeaders } from "./scout";
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
  buildSeasonOpenNews,
  pushForm,
  refreshHappiness,
  transferCap,
  unlockAchievement,
  facRating,
  facTier,
  facilityFloorFromPlayers,
  weeklyFacilityCost,
} from "./fc";

export const USER = "user";

export function blankSave(): SaveData {
  const manager = defaultManager(1, "possession", "4-3-3");
  return {
    version: SAVE_VERSION,
    seed: 1,
    active: false,
    phase: "title",
    screen: "dash",
    managerName: "Tyrone",
    chairmanName: "Tyrone",
    userClubId: USER,
    tier: 5,
    nationId: "eng",
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
    facilities: { stadium: 1, training: 20, academy: 20, medical: 1 },
    stands: { west: 1, east: 1, north: 0, south: 0 },
    staff: { coach: 2, scout: 1, physio: 1, assistant: 0 },
    sponsorName: "Sky Bet",
    sponsorBoost: 1,
    sponsorUntil: 3,
    ticketPrice: 5,
    winBonusPct: 20,
    chairmanAvatar: 0,
    kitId: 0,
    rivalClubId: "",
    stadiumName: "The Pits",
    feesPaid: 0,
    feesReceived: 0,
    managersHired: 1,
    newsQueue: [],
    clubs: [],
    players: [],
    weeks: [],
    xi: [],
    bench: [],
    inbox: [],
    live: null,
    report: null,
    review: null,
    playoff: null,
    transferFocus: null,
    targets: [],
    standJob: null,
    offer: null,
    deal: null,
    history: [],
    userCup: "in",
    objective: objectiveText(5),
    muted: true,
    currency: "GBP",
    manager,
    managerPool: [],
    transferBudgetMode: "normal",
    outlets: { burger: 1, counter: 0, cafe: 0, merch: 0 },
    pitchQuality: 39,
    superStadium: false,
    form: "",
    posTrail: [],
    achievements: [],
    trophies: [],
    records: emptyRecords(),
    seasonProfit: 0,
    windowOpen: true,
    leagueSpend: 0,
  };
}

export function normalize(raw: SaveData): SaveData {
  const base = blankSave();
  const stands = raw.stands ?? standsFromLevel(raw.facilities?.stadium ?? 1);
  const screenMap: Record<string, SaveData["screen"]> = {
    office: "dash",
    club: "stadium",
  };
  const rawScreen = (raw.screen as string) ?? "dash";
  const manager =
    raw.manager ??
    defaultManager(raw.seed ?? 1, raw.philosophy ?? "possession", raw.formation ?? "4-3-3");
  const merged: SaveData = {
    ...base,
    ...raw,
    facilities: (() => {
      const f = { ...base.facilities, ...raw.facilities };
      return {
        ...f,
        training: facRating(f.training),
        academy: facRating(f.academy),
        stadium: stadiumLevel(standsOf({ stands, facilities: raw.facilities ?? base.facilities })),
      };
    })(),
    staff: { ...base.staff, ...raw.staff },
    stands,
    line: raw.line ?? "standard",
    build: raw.build ?? "mixed",
    deal: raw.deal
      ? {
          ...raw.deal,
          script: raw.deal.script ?? [],
          mood: raw.deal.mood ?? "open",
          beat: raw.deal.beat ?? 0,
        }
      : null,
    muted: raw.muted ?? false,
    currency: raw.currency === "EUR" || raw.currency === "USD" ? raw.currency : "GBP",
    chairmanName: raw.chairmanName ?? raw.managerName ?? "Tyrone",
    manager,
    managerPool: raw.managerPool?.length ? raw.managerPool : makeManagerPool(raw.seed ?? 1, manager.name),
    transferBudgetMode: raw.transferBudgetMode ?? "normal",
    outlets: { ...base.outlets, ...raw.outlets },
    pitchQuality: raw.pitchQuality ?? 39,
    superStadium: raw.superStadium ?? false,
    form: raw.form ?? "",
    posTrail: raw.posTrail ?? [],
    achievements: raw.achievements ?? [],
    trophies: raw.trophies ?? [],
    records: { ...emptyRecords(), ...raw.records },
    seasonProfit: raw.seasonProfit ?? 0,
    windowOpen: raw.windowOpen ?? transferWindowOpen(raw.weekIndex ?? 0),
    leagueSpend: raw.leagueSpend ?? 0,
    players: (raw.players ?? []).map((p) => ({
      ...p,
      listed: !!p.listed,
      yellows: p.yellows ?? 0,
      reds: p.reds ?? 0,
      cleanSheets: p.cleanSheets ?? 0,
      byComp: ensureComp({ byComp: p.byComp ?? blankComp() }),
      careerGoals: p.careerGoals ?? p.goals ?? 0,
      careerAssists: p.careerAssists ?? p.assists ?? 0,
    })),
    fanMgrHappy: raw.fanMgrHappy ?? 75,
    fanChairHappy: raw.fanChairHappy ?? raw.fans ?? 55,
    sponsorUntil: raw.sponsorUntil ?? raw.season + 2,
    ticketPrice: raw.ticketPrice ?? 5,
    winBonusPct: raw.winBonusPct ?? 20,
    chairmanAvatar: raw.chairmanAvatar ?? 0,
    kitId: raw.kitId ?? 0,
    rivalClubId: raw.rivalClubId ?? "",
    stadiumName: raw.stadiumName ?? raw.clubs?.find((c) => c.id === USER)?.stadium ?? "The Pits",
    feesPaid: raw.feesPaid ?? 0,
    feesReceived: raw.feesReceived ?? 0,
    managersHired: raw.managersHired ?? 1,
    newsQueue: raw.newsQueue ?? [],
    nationId: raw.nationId ?? "eng",
    playoff: raw.playoff ?? null,
    transferFocus: raw.transferFocus ?? null,
    targets: raw.targets ?? [],
    standJob: raw.standJob ?? null,
    screen: screenMap[rawScreen] ?? (raw.screen as SaveData["screen"]) ?? "dash",
    version: SAVE_VERSION,
    active: true,
  };
  if (!FORMATIONS[merged.formation]) merged.formation = "4-3-3";
  if (merged.deal && merged.phase === "hub") merged.phase = "negotiate";
  if (merged.live) {
    merged.live = {
      ...merged.live,
      period: merged.live.period ?? "regulation",
      penHome: merged.live.penHome ?? 0,
      penAway: merged.live.penAway ?? 0,
      penKicks: merged.live.penKicks ?? [],
      penNext: merged.live.penNext ?? "home",
      restartSide: merged.live.restartSide ?? null,
      phaseChain: merged.live.phaseChain ?? null,
      addedTime: merged.live.addedTime ?? 0,
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

function fixture(id: string, competition: "league" | "cup" | "playoff" | "friendly", homeId: string, awayId: string): Fixture {
  return { id, competition, homeId, awayId, homeScore: null, awayScore: null, attendance: null };
}

export function buildWeeks(ids: string[], seed: number, rivalId?: string): Week[] {
  const first = roundRobin(ids);
  const second = first.map((pairs) => pairs.map(([h, a]) => [a, h] as [string, string]));
  const all = [...first, ...second];
  const weeks: Week[] = [];
  const foe = ids.find((id) => id === rivalId && id !== USER) ?? ids.find((id) => id !== USER);
  if (ids.includes(USER) && foe) {
    weeks.push({
      label: "Pre-season friendly",
      kind: "friendly",
      cupStage: null,
      fixtures: [fixture("FRI", "friendly", USER, foe)],
    });
  }
  let matchweek = 0;
  const cupIds = ids.includes(USER) ? [USER, ...shuffle(ids.filter((id) => id !== USER), seed).slice(0, 15)] : ids.slice(0, 16);
  const r16 = pairUp(shuffle(cupIds, seed + 2), seed + 5);
  for (const pairs of all) {
    matchweek += 1;
    weeks.push({
      label: `Matchweek ${matchweek}`,
      kind: "league",
      cupStage: null,
      fixtures: pairs.map(([h, a], i) => fixture(`L${matchweek}-${i}`, "league", h, a)),
    });
    if (matchweek === 8) {
      weeks.push({
        label: "FA Cup · Round of 16",
        kind: "cup",
        cupStage: "r16",
        fixtures: r16.map(([h, a], i) => fixture(`Cr16-${i}`, "cup", h, a)),
      });
    }
    if (matchweek === 16) {
      weeks.push({
        label: "FA Cup · Quarter-final",
        kind: "cup",
        cupStage: "qf",
        fixtures: [],
      });
    }
    if (matchweek === 24) {
      weeks.push({
        label: "FA Cup · Semi-final",
        kind: "cup",
        cupStage: "sf",
        fixtures: [],
      });
    }
  }
  weeks.push({
    label: "FA Cup · Final",
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
  // Slightly higher floors so squads match current-division quality bands.
  const mean = clamp(46 + rep * 0.42, 60, 88);
  return [7, 5, 3, 2, 2, 1, 1, 0, 0, 0, -1, -1, -2, -3, -4, -5, -6, -7].map((d) =>
    clamp(Math.round(mean + d), 54, 92),
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
  const startTier = (input.startTier ?? 5) as LeagueTier;
  const stadiumName = input.stadiumName.trim() || "The Pits";
  const startCash = START_BUDGET[startTier];
  const userClub: Club = {
    id: USER,
    name: input.clubName.trim(),
    short: input.short.trim().toUpperCase().slice(0, 3),
    city: input.city.trim(),
    primary: input.primary,
    secondary: input.secondary,
    stadium: stadiumName,
    reputation: TIER_REPS[startTier][3] ?? 50,
    style: input.philosophy,
  };
  const templates = clubsFor(startTier);
  const reps = repsFor(startTier, templates.length);
  const ais: Club[] = templates.map((t, i) => ({
    ...t,
    reputation: reps[i] ?? 50,
  }));
  const clubs = [userClub, ...ais];
  let players: Player[] = [];
  players = players.concat(buildSquad(seed, userClub, used, 7));
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
  const weeks = buildWeeks(clubs.map((c) => c.id), seed, input.rivalClubId);
  const withMarket = players.concat(
    makeMarket({
      ...blankSave(),
      seed,
      tier: startTier,
      weekIndex: 0,
      players,
    }),
  );
  players = withMarket;
  const captain = players
    .filter((p) => p.clubId === USER)
    .sort((a, b) => ovr(b) + b.age / 10 - (ovr(a) + a.age / 10))[0];
  const base = blankSave();
  const mgr = {
    ...input.manager,
    hiredSeason: 1,
    hiredWeek: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    happiness: 82,
  };
  const xiFromMgr = pickXi(players, USER, mgr.formation);
  const save: SaveData = {
    ...base,
    seed,
    active: true,
    phase: "hub",
    screen: "dash",
    managerName: mgr.name,
    chairmanName: input.managerName.trim() || "Tyrone",
    chairmanAvatar: input.chairmanAvatar,
    kitId: input.kitId,
    rivalClubId: input.rivalClubId || ais[0]?.id || "",
    stadiumName,
    nationId: input.nationId || "eng",
    tier: startTier,
    season: 1,
    cash: startCash,
    debt: 0,
    board: 64,
    fans: 58,
    fanMgrHappy: 85,
    fanChairHappy: 58,
    philosophy: mgr.style,
    formation: mgr.formation,
    line: mgr.style === "counter" ? "deep" : mgr.style === "press" || mgr.style === "possession" ? "high" : "standard",
    build: mgr.style === "possession" ? "short" : mgr.style === "direct" || mgr.style === "counter" ? "direct" : "mixed",
    clubs,
    players,
    weeks,
    xi: xiFromMgr.xi,
    bench: xiFromMgr.bench,
    facilities: {
      stadium: 1,
      training: facilityFloorFromPlayers(players, USER, "training", ovr),
      academy: facilityFloorFromPlayers(players, USER, "academy", ovr),
      medical: 1,
    },
    staff: {
      coach: Math.min(2, staffCap(startTier, "coach")),
      scout: Math.min(1, staffCap(startTier, "scout")),
      physio: Math.min(1, staffCap(startTier, "physio")),
      assistant: 0,
    },
    sponsorName: startTier <= 2 ? "Sky Bet" : startTier === 3 ? "Vanarama" : "Utilita",
    sponsorBoost: 1,
    sponsorUntil: 3,
    ticketPrice: tierTicket(startTier),
    winBonusPct: 20,
    feesPaid: 0,
    feesReceived: 0,
    managersHired: 1,
    objective: objectiveText(startTier),
    manager: mgr,
    managerPool: makeManagerPool(seed, mgr.name),
    transferBudgetMode: "normal",
    outlets: { burger: 1, counter: 0, cafe: 0, merch: 0 },
    pitchQuality: startTier === 5 ? 28 : 39,
    stands: startTier >= 4 ? { west: startTier === 5 ? 0 : 1, east: 0, north: 0, south: 0 } : { west: 2, east: 1, north: 1, south: 0 },
    superStadium: false,
    form: "",
    achievements: [],
    trophies: [],
    records: emptyRecords(),
    seasonProfit: 0,
    windowOpen: true,
    leagueSpend: 0,
    currency: "GBP",
    newsQueue: [],
    inbox: [
      {
        id: "welcome",
        week: 1,
        tag: "Board",
        title: "The chair is yours",
        body: `${input.managerName.trim() || "Tyrone"}, ${userClub.name} starts in the ${TIER_META[startTier].name} with £${Math.round(startCash / 1000).toLocaleString("en-GB")}k. You hired ${mgr.name}. ${objectiveText(startTier)}`,
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
  const open = buildSeasonOpenNews(save);
  return {
    ...save,
    targets: suggestTargets(save),
    newsQueue: [
      {
        id: `appointed-${mgr.name}`,
        kind: "continue" as const,
        title: "New manager appointed",
        body: `${mgr.name} is on a rolling contract at ${userClub.name}. Severance is twelve months' wages (£${(mgr.wage * 52).toLocaleString("en-GB")}) if you sack him.`,
        cta: "Continue",
      },
      ...open,
    ],
  };
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
  const base = state.tier === 1 ? 155_000 : state.tier === 2 ? 48_000 : state.tier === 3 ? 14_000 : state.tier === 4 ? 6_000 : 2_500;
  const merit = state.tier === 1 ? 7_000 : state.tier === 2 ? 2_200 : state.tier === 3 ? 650 : state.tier === 4 ? 280 : 120;
  return Math.round(base + (4.5 - tablePos(state)) * merit);
}

export function booksSplit(state: SaveData) {
  const base = state.tier === 1 ? 42_000 : state.tier === 2 ? 22_000 : state.tier === 3 ? 12_000 : state.tier === 4 ? 7_000 : 3_500;
  const outlets = state.outlets ?? { burger: 1, counter: 0, cafe: 0, merch: 0 };
  const foodRaw = outletCrowdCap(outlets) * outletProfitPerSale(outlets) * 0.35;
  const merchRaw = outlets.merch * 1800 + state.fans * (state.tier === 1 ? 40 : 12);
  const boost = state.sponsorBoost || 1;
  const sponsor = Math.round(base * boost);
  const food = Math.round(foodRaw * boost);
  const merch = Math.round(merchRaw * boost);
  return { sponsor, food, merch, commercial: sponsor + food + merch };
}

export function commercialWeekly(state: SaveData) {
  return booksSplit(state).commercial;
}

export function sponsorWeekly(state: SaveData) {
  return commercialWeekly(state);
}

export function playerWages(state: SaveData) {
  return userPlayers(state).reduce((s, p) => s + (p.loan === "out" ? Math.round(p.wage * 0.4) : p.wage), 0);
}

export function staffWages(state: SaveData) {
  const scale = state.tier === 1 ? 1 : state.tier === 2 ? 0.72 : state.tier === 3 ? 0.48 : state.tier === 4 ? 0.32 : 0.2;
  return Math.round((state.staff.coach * 4200 + state.staff.scout * 2600 + state.staff.physio * 2600) * scale);
}

export function groundRun(state: SaveData) {
  const stands = standsOf(state);
  const rate = { west: 780, east: 560, north: 420, south: 360 };
  let run = 0;
  (Object.keys(rate) as (keyof typeof rate)[]).forEach((id) => {
    run += (stands[id] + 1) * rate[id];
  });
  const fac =
    (facTier(state.facilities.training) + facTier(state.facilities.academy) + state.facilities.medical) * 1400;
  const mgrWage = (state.manager?.wage ?? 0) * 1;
  const cut = state.superStadium ? 0.72 : 1;
  const tierCut = state.tier === 1 ? 1 : state.tier === 2 ? 0.7 : state.tier === 3 ? 0.45 : state.tier === 4 ? 0.3 : 0.18;
  return Math.round((run + fac) * cut * tierCut + mgrWage);
}

export function wageBill(state: SaveData) {
  return playerWages(state) + staffWages(state) + groundRun(state);
}

export function ticketPrice(tier: LeagueTier) {
  return tierTicket(tier);
}

export function boxPrice(tier: LeagueTier) {
  return tierBox(tier);
}

export function crowd(state: SaveData) {
  const stands = standsOf(state);
  const facts = standFacts(stands);
  const fair = ticketPrice(state.tier);
  const asked = state.ticketPrice ?? fair;
  const ratio = asked / Math.max(1, fair);
  const priceShift = ratio > 1.2 ? -0.16 : ratio > 1.05 ? -0.06 : ratio < 0.8 ? 0.08 : 0.02;
  const occ = clamp(0.46 + state.fans / 260 + stands.north * 0.018 + (stands.west >= 3 ? 0.015 : 0) + priceShift, 0.28, 0.97);
  const boxOcc = clamp(occ + 0.12, 0.55, 0.98);
  const standard = Math.max(0, facts.seats - facts.boxes);
  const attendance = Math.round(standard * occ + facts.boxes * boxOcc);
  const ticket = state.ticketPrice ?? ticketPrice(state.tier);
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
  let stands = standsOf(state);
  let standJob = state.standJob ? { ...state.standJob } : null;
  let newsQueue = (state.newsQueue ?? []).slice();
  if (standJob) {
    standJob.weeks -= 1;
    if (standJob.weeks <= 0) {
      const spec = STANDS[standJob.stand];
      stands = { ...stands, [standJob.stand]: standJob.toTier };
      newsQueue.unshift({
        id: `stand-${state.season}-${state.weekIndex}-${standJob.stand}`,
        kind: "continue",
        title: `${spec.name} is open`,
        body: `${spec.name} is finished. The new seats count from this week. The ground still has work left if you want a bigger club.`,
        cta: "Continue",
      });
      standJob = null;
    }
  }
  const other: Report["other"] = [];
  const notes: string[] = [];
  let userLive = live;
  const weekLives: NonNullable<typeof live>[] = [];

  if (!userLive) {
    const tie = weekNow.fixtures.find((f) => f.homeId === USER || f.awayId === USER);
    if (tie) userLive = simulateLive(state, tie.id, "measured");
  }

  for (const f of weekNow.fixtures) {
    if (userLive && f.id === userLive.fixtureId) {
      f.homeScore = userLive.homeScore;
      f.awayScore = userLive.awayScore;
      weekLives.push(userLive);
    } else if (f.homeScore == null) {
      const sim = simulateLive(state, f.id, "measured");
      f.homeScore = sim.homeScore;
      f.awayScore = sim.awayScore;
      weekLives.push(sim);
      other.push({ homeId: f.homeId, awayId: f.awayId, hs: sim.homeScore, as: sim.awayScore });
    }
  }

  if (weekNow.kind === "cup") weeks = fillNextCup(weeks, state.weekIndex);

  let players = state.players.map((p) => ({ ...p, attrs: { ...p.attrs } }));

  // Credit goals / assists / apps / cards / clean sheets by competition
  type Credit = {
    goals: number;
    assists: number;
    apps: number;
    yellows: number;
    reds: number;
    cleanSheets: number;
    kind: "league" | "cup" | "playoff" | "friendly";
  };
  const credit = new Map<string, Credit[]>();
  const bump = (
    id: string,
    kind: Credit["kind"],
    patch: Partial<Omit<Credit, "kind">>,
  ) => {
    const list = credit.get(id) ?? [];
    list.push({
      goals: patch.goals ?? 0,
      assists: patch.assists ?? 0,
      apps: patch.apps ?? 0,
      yellows: patch.yellows ?? 0,
      reds: patch.reds ?? 0,
      cleanSheets: patch.cleanSheets ?? 0,
      kind,
    });
    credit.set(id, list);
  };
  const gkOf = (xi: string[], formId: import("./types").LiveMatch["homeForm"]) => {
    const slots = FORMATIONS[formId];
    for (let i = 0; i < xi.length; i++) {
      if (slots[i]?.pos === "GK" && xi[i]) return xi[i]!;
    }
    return xi[0] ?? "";
  };
  for (const lm of weekLives) {
    const kind = (lm.competition ?? weekNow.kind) as Credit["kind"];
    const seen = new Set<string>();
    for (const id of [...lm.homeXi, ...lm.awayXi]) {
      if (seen.has(id)) continue;
      seen.add(id);
      bump(id, kind, { apps: 1 });
    }
    for (const s of lm.scorers) {
      if (s.playerId) bump(s.playerId, kind, { goals: 1 });
      if (s.assistId) bump(s.assistId, kind, { assists: 1 });
    }
    for (const [id, y] of Object.entries(lm.yellow ?? {})) {
      if (y > 0) bump(id, kind, { yellows: y });
    }
    for (const line of lm.log) {
      if (line.kind !== "card" || !line.text.startsWith("Red card")) continue;
      const redId = [...lm.homeXi, ...lm.awayXi, ...Object.keys(lm.wentOff ?? {})].find((id) => {
        const pl = players.find((x) => x.id === id) ?? state.players.find((x) => x.id === id);
        return pl && line.text.includes(pl.name);
      });
      if (redId) bump(redId, kind, { reds: 1 });
    }
    if (lm.awayScore === 0) {
      const gk = gkOf(lm.homeXi, lm.homeForm);
      if (gk) bump(gk, kind, { cleanSheets: 1 });
    }
    if (lm.homeScore === 0) {
      const gk = gkOf(lm.awayXi, lm.awayForm);
      if (gk) bump(gk, kind, { cleanSheets: 1 });
    }
  }
  if (credit.size) {
    players = players.map((p) => {
      const list = credit.get(p.id);
      if (!list?.length) return p;
      let byComp = ensureComp(p);
      let goals = p.goals;
      let assists = p.assists;
      let played = p.played;
      let yellows = p.yellows ?? 0;
      let reds = p.reds ?? 0;
      let cleanSheets = p.cleanSheets ?? 0;
      let careerGoals = p.careerGoals ?? 0;
      let careerAssists = p.careerAssists ?? 0;
      for (const d of list) {
        byComp = bumpComp(byComp, d.kind, {
          goals: d.goals,
          assists: d.assists,
          played: d.apps,
          yellows: d.yellows,
          reds: d.reds,
          cleanSheets: d.cleanSheets,
        });
        goals += d.goals;
        assists += d.assists;
        played += d.apps;
        yellows += d.yellows;
        reds += d.reds;
        cleanSheets += d.cleanSheets;
        careerGoals += d.goals;
        careerAssists += d.assists;
      }
      return { ...p, byComp, goals, assists, played, yellows, reds, cleanSheets, careerGoals, careerAssists };
    });
  }
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
  let ticketTake = 0;
  let boxTake = 0;
  let winBonusPay = 0;
  let resultBonus = 0;
  const bonusPct = state.winBonusPct ?? 20;

  if (userLive && (userLive.homeId === USER || userLive.awayId === USER)) {
    const home = userLive.homeId === USER;
    const gf = home ? userLive.homeScore : userLive.awayScore;
    const ga = home ? userLive.awayScore : userLive.homeScore;
    const win = gf > ga;
    const draw = gf === ga;
    winBonusPay = win ? Math.round(wages * (bonusPct / 100)) : 0;
    if (userLive.competition === "friendly") {
      boardDelta += win ? 1 : 0;
      fanDelta += win ? 1 : 0;
      notes.push(win ? "Friendly won. A useful run-out." : draw ? "Friendly shared." : "Friendly lost. No league points.");
    } else if (userLive.competition === "league") {
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
    if (userLive.competition !== "friendly") {
      if (win) notes.push(userLive.competition === "cup" ? "The Shield stays alive." : "Three points on the board sheet.");
      else if (draw) notes.push("A point. The board wanted more.");
      else notes.push("Defeat. The chair feels colder.");
    }

    if (home) {
      const gateState = { ...state, fans };
      const c = crowd(gateState);
      ticketTake = Math.round(c.standard * c.occ * c.ticket);
      boxTake = Math.round(c.boxes * c.boxOcc * c.box);
      gate = ticketTake + boxTake;
      const tie = weekNow.fixtures.find((f) => f.id === userLive.fixtureId);
      if (tie) tie.attendance = c.attendance;
      const inBoxes = Math.round(c.boxes * c.boxOcc);
      notes.push(
        `Gate: ${c.attendance.toLocaleString("en-GB")} of ${c.cap.toLocaleString("en-GB")}${inBoxes ? `, ${inBoxes.toLocaleString("en-GB")} in the boxes` : ""}.`,
      );
    }
    resultBonus = win
      ? matchWinPrize(state.tier, userLive.competition)
      : draw
        ? matchDrawPrize(state.tier, userLive.competition)
        : 0;
    if (win && userLive.competition === "cup" && weekNow.cupStage === "final") {
      notes.push(`Cup final won — winners' prize lands with the season settlement (£${CUP_PRIZE[state.tier].toLocaleString("en-GB")}).`);
    }
    if (win && userLive.competition === "playoff" && state.playoff?.round === "final") {
      resultBonus += PLAYOFF_PRIZE[state.tier];
      notes.push(`Play-off winners' prize: £${PLAYOFF_PRIZE[state.tier].toLocaleString("en-GB")}.`);
    }
    cash += gate + sponsor + broadcast + resultBonus - wages - winBonusPay - interest;
    if (resultBonus > 0 && win) notes.push(`Match prize: £${resultBonus.toLocaleString("en-GB")}.`);
    if (winBonusPay > 0) notes.push(`Win bonus paid: ${winBonusPay.toLocaleString("en-GB")} (${bonusPct}%).`);

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
      /* yellows / reds / clean sheets already credited from weekLives above */
      let seasonYellows = p.yellows ?? 0;
      if (sentOff) banned = Math.max(banned, 1);
      if (seasonYellows >= 5) {
        banned = Math.max(banned, 1);
        seasonYellows = 0;
        notes.push(`${p.name} is suspended after five bookings.`);
      }
      const hurt = userLive.hurt.find((h) => h.id === p.id);
      if (hurt) notes.push(`${p.name} will miss about ${hurt.weeks} week${hurt.weeks > 1 ? "s" : ""}.`);
      return {
        ...p,
        morale: clamp(Math.round(morale), 20, 99),
        fitness: clamp(Math.round(userLive.stamina[p.id] ?? p.fitness), 35, 100),
        injured: hurt ? Math.max(1, hurt.weeks - (state.facilities.medical >= 4 ? 1 : 0)) : p.injured,
        yellows: seasonYellows,
        banned,
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

  if (userLive) {
    const injuries = userLive.hurt
      .map((h) => players.find((p) => p.id === h.id && p.clubId === USER))
      .filter((p): p is Player => !!p && p.injured > 0);
    if (injuries.length) {
      newsQueue.unshift({
        id: `inj-${state.season}-${state.weekIndex}`,
        kind: "continue",
        title: injuries.length === 1 ? `${injuries[0]?.name ?? "Player"} injured` : "Injury list",
        body: injuries
          .map((p) => `${p.name} (${p.pos}) will miss ${p.injured} week${p.injured === 1 ? "" : "s"}.`)
          .join(" "),
        cta: "Continue",
      });
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
    let gain = 6 + state.staff.coach * 3 + facTier(state.facilities.training) * 2;
    if (state.training === "fitness") gain = Math.round(gain * 0.45);
    if (p.age <= 21)
      gain +=
        facTier(state.facilities.academy) * 2 +
        (state.training === "youth" || state.philosophy === "youth" ? 6 : 0);
    const grown = growPlayer({ ...p, fitness, banned }, state.training, gain);
    return grown;
  });

  if (cash < 0) {
    debt += Math.abs(cash) + 25000;
    notes.push("The bank covered the shortfall. Interest is running.");
    boardDelta -= 1;
    cash = 0;
  }

  board = clamp(Math.round(board + boardDelta), 0, 100);
  fans = clamp(Math.round(fans + fanDelta), 8, 99);

  let offer = state.offer;
  if (!offer && (state.weekIndex % 3 === 1 || state.weekIndex % 4 === 2)) {
    const listed = players.filter((p) => p.clubId === USER && p.loan !== "in" && p.listed);
    const sellable = listed.length
      ? listed
      : players.filter((p) => p.clubId === USER && p.loan !== "in" && p.contract <= 1);
    const pick = sellable[Math.floor(unit(state.seed, state.weekIndex, 21) * sellable.length)];
    if (pick) {
      const from = state.clubs.find((c) => c.id !== USER);
      const premium = pick.listed ? 0.95 : 0.8;
      offer = {
        playerId: pick.id,
        fee: Math.round((valueFor(pick) * (premium + unit(state.seed, state.weekIndex, 22) * 0.35)) / 10000) * 10000,
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
    const keep = !!p && (state.xi.includes(p.id) || ovr(p) >= 62);
    const line = p ? (p.pos === "GK" ? "gk" : lineOf(p.pos)) : "atk";
    const roleLabel =
      line === "gk" ? "Goalkeeper" : line === "def" ? "Defender" : line === "mid" ? "Midfielder" : "Attacker";
    newsQueue.unshift({
      id: `bid-${state.season}-${state.weekIndex}-${offer.playerId}`,
      kind: "bid",
      title: `${roleLabel.toUpperCase()} IN DEMAND`,
      body: p
        ? `A bid of £${offer.fee.toLocaleString("en-GB")} has been made for ${p.name}. ${
            keep
              ? "The manager feels he is an important player who should stay at the club."
              : `The manager is open to selling the ${roleLabel.toLowerCase()} if the fee is right.`
          }`
        : "An offer arrived for one of your players.",
      playerId: offer.playerId,
      fee: offer.fee,
      from: offer.from,
      keep,
    });
    inbox = pushInbox(
      { ...state, inbox },
      {
        tag: "Offer",
        title: `${offer.from} enquire`,
        body: p ? `They will pay £${Math.round(offer.fee / 1000)}k for ${p.name}.` : "An offer arrived.",
      },
    );
  }

  // Manager suggests a new deal for ageing / expiring contracts
  if (state.weekIndex % 5 === 1) {
    const candidates = players
      .filter((p) => p.clubId === USER && p.loan !== "in" && (p.contract <= 1 || p.age >= 30))
      .sort((a, b) => a.contract - b.contract || b.age - a.age);
    const pick = candidates[0];
    if (pick && !newsQueue.some((c) => c.kind === "contract" && c.playerId === pick.id)) {
      const base = Math.max(pick.wage, wageFor(ovr(pick), pick.age));
      const wages = [Math.round(base * 0.75), Math.round(base * 0.9), base, Math.round(base * 1.15), Math.round(base * 1.35)].map(
        (w) => Math.max(1, Math.round(w / 1) ),
      );
      const uniq = [...new Set(wages)].sort((a, b) => a - b);
      const years = [1, 2, 3, 4].filter((y) => y >= 1);
      const line = pick.pos === "GK" ? "gk" : lineOf(pick.pos);
      const role =
        line === "gk" ? "goalkeeper" : line === "def" ? "defender" : line === "mid" ? "midfielder" : "attacker";
      const bill = wageBill({ ...state, players });
      const recommended = Math.round(bill * 1.35);
      newsQueue.unshift({
        id: `contract-${state.season}-${state.weekIndex}-${pick.id}`,
        kind: "contract",
        title: "MANAGER SUGGESTS NEW DEAL",
        body: `The manager feels that ${role} ${pick.name} should be offered a new contract.`,
        playerId: pick.id,
        wages: uniq,
        years,
        suggestedWage: base,
        suggestedYears: Math.min(3, Math.max(2, pick.contract + 1)),
        wageBill: bill,
        recommendedBill: recommended,
      });
    }
  }

  // market refresh every 4 weeks
  if (state.weekIndex % 4 === 3) {
    const kept = players.filter((p) => p.clubId !== "market");
    const fresh = makeMarket({ ...state, players: kept, seed: state.seed + state.weekIndex });
    players = kept.concat(fresh);
    inbox = pushInbox({ ...state, inbox }, { tag: "Scout", title: "New names on the list", body: "The market list turned over. Your scout's eye decides how sharp the ratings look." });
  }

  let targets = (state.targets ?? []).filter((t) => players.some((p) => p.id === t.playerId && p.clubId === "market"));
  if (state.weekIndex % 4 === 3 || targets.length === 0) {
    targets = suggestTargets({ ...state, players, manager: state.manager });
  }

  const books = booksSplit(state);
  const groundCost = Math.round(groundRun(state) * 0.55);
  const academyCost = weeklyFacilityCost(facRating(state.facilities.academy));
  const trainingCost = weeklyFacilityCost(facRating(state.facilities.training));
  const playerStaffWages = playerWages(state) + staffWages(state) + (state.manager?.wage ?? 0);
  const feesIn = 0;
  const feesOut = 0;
  const income = ticketTake + boxTake + books.food + books.merch + broadcast + books.sponsor + resultBonus + feesIn;
  const costs = playerStaffWages + groundCost + academyCost + trainingCost + winBonusPay + interest + feesOut;
  const finance: NonNullable<Report["finance"]> = {
    tickets: ticketTake,
    boxes: boxTake,
    food: books.food,
    merch: books.merch,
    tv: broadcast,
    sponsor: books.sponsor,
    wages: playerStaffWages,
    ground: groundCost,
    academy: academyCost,
    training: trainingCost,
    bonus: winBonusPay,
    result: resultBonus,
    interest,
    feesIn,
    feesOut,
    net: income - costs,
  };
  if (userLive && (userLive.homeId === USER || userLive.awayId === USER)) {
    newsQueue.push({
      id: `week-finance-${state.season}-${state.weekIndex}`,
      kind: "weekFinance",
      title: "LAST WEEK'S FINANCIAL REPORT",
      finance,
    });
  }

  const report: Report | null = userLive
    ? buildReport(state, userLive, { gate, wages, sponsor, broadcast, boardDelta, fanDelta, notes, other, finance })
    : state.report;

  const nextIndex = state.weekIndex + 1;
  const sacked = board <= 0;
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

  let posTrail = (state.posTrail ?? []).slice();
  if (weekNow.kind === "league") {
    const after = { ...state, weeks, players, weekIndex: state.weekIndex + 1 };
    posTrail = [...posTrail, tablePos(after)];
  }

  // Transfer window + league spend + awards / other-league news
  const wasOpen = state.windowOpen ?? transferWindowOpen(state.weekIndex);
  const nowOpen = transferWindowOpen(nextIndex);
  let leagueSpend = state.leagueSpend ?? 0;
  if (wasOpen) {
    const aiSpend = Math.round(
      (state.tier === 1 ? 2_400_000 : state.tier === 2 ? 650_000 : state.tier === 3 ? 180_000 : state.tier === 4 ? 55_000 : 18_000) *
        (0.35 + unit(state.seed, state.weekIndex, 55) * 1.4),
    );
    leagueSpend += aiSpend;
  }
  if (wasOpen && !nowOpen) {
    newsQueue.unshift({
      id: `window-close-${state.season}-${state.weekIndex}`,
      kind: "continue",
      title: "Transfer window closed",
      body: `The window is shut until January. Clubs in ${TIER_META[state.tier].name} spent about £${leagueSpend.toLocaleString("en-GB")} this window (your club £${(state.feesPaid ?? 0).toLocaleString("en-GB")} out, £${(state.feesReceived ?? 0).toLocaleString("en-GB")} in).`,
      cta: "Continue",
    });
  }
  if (!wasOpen && nowOpen) {
    leagueSpend = 0;
    newsQueue.unshift({
      id: `window-open-${state.season}-${nextIndex}`,
      kind: "continue",
      title: "Transfer window open",
      body: `The window is open again. Clubs can buy and sell until it shuts. Keep an eye on the wage bill.`,
      cta: "Continue",
    });
  }

  const leagueWeeksDone = weeks.slice(0, nextIndex).filter((w) => w.kind === "league").length;
  const totalLeagueWeeks = weeks.filter((w) => w.kind === "league").length;
  if (weekNow.kind === "league" && leagueWeeksDone === Math.max(4, Math.floor(totalLeagueWeeks / 2))) {
    const noms = bestPlayerNominees({ ...state, players }, 3);
    if (noms.length) {
      const lines = noms
        .map((n, i) => {
          const club = state.clubs.find((c) => c.id === n.clubId);
          return `${i + 1}. ${n.name} (${club?.short ?? "?"}) — ${n.goals}G ${n.assists}A · ${n.rating || "—"} avg`;
        })
        .join("\n");
      newsQueue.unshift({
        id: `poty-nom-${state.season}`,
        kind: "continue",
        title: "Player of the Year nominations",
        body: `The league shortlist is out:\n${lines}`,
        cta: "Continue",
      });
    }
  }

  if (weekNow.kind === "league" && state.weekIndex % 3 === 2) {
    newsQueue.unshift({
      id: `other-lge-${state.season}-${state.weekIndex}`,
      kind: "continue",
      title: "Around the pyramid",
      body: otherLeagueBlurb(state),
      cta: "Continue",
    });
  }

  if (weekNow.kind === "league") {
    const top = seasonLeaders({ ...state, players }, "league").scorers[0];
    if (top && top.goals >= 5 && top.goals % 5 === 0) {
      const club = state.clubs.find((c) => c.id === top.clubId);
      newsQueue.unshift({
        id: `scorer-${state.season}-${top.id}-${top.goals}`,
        kind: "continue",
        title: "Golden boot chase",
        body: `${top.name} (${club?.short ?? "club"}) leads the league scoring charts on ${top.goals} goals.`,
        cta: "Continue",
      });
    }
  }

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
    posTrail,
    windowOpen: nowOpen,
    leagueSpend,
    manager,
    records,
    trophies,
    seasonProfit: (state.seasonProfit ?? 0) + weekDelta,
    stands,
    standJob,
    newsQueue,
    targets,
    facilities: { ...state.facilities, stadium: stadiumLevel(stands) },
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
  if (facRating(state.facilities.academy) >= 80) next = unlockAchievement(next, "youth");

  if (!sacked && weekNow.kind === "playoff" && userLive) {
    const home = userLive.homeId === USER;
    const gf = home ? userLive.homeScore : userLive.awayScore;
    const ga = home ? userLive.awayScore : userLive.homeScore;
    const won = gf > ga;
    if (won && state.playoff?.round !== "final") {
      const table = leagueTable(next);
      const opp = state.playoff?.otherId ?? "";
      const userPos = table.findIndex((t) => t.id === USER);
      const oppPos = table.findIndex((t) => t.id === opp);
      const homeId = userPos <= oppPos ? USER : opp;
      const awayId = homeId === USER ? opp : USER;
      const finalWeek: Week = {
        label: "Play-off final",
        kind: "playoff",
        cupStage: null,
        fixtures: [fixture("POF", "playoff", homeId, awayId)],
      };
      return {
        ...next,
        weeks: [...weeks, finalWeek],
        weekIndex: weeks.length,
        playoff: { round: "final", otherId: opp },
        phase: "report",
        review: null,
      };
    }
    return finishSeason(next, true, won ? "up" : "stay", state, weekDelta);
  }

  if (!sacked && nextIndex >= weeks.length) {
    const table = leagueTable(next);
    const pos = Math.max(1, table.findIndex((t) => t.id === USER) + 1);
    const band = playoffBand(state.tier);
    if (band && pos >= band[0] && pos <= band[1]) {
      const seeds = table.slice(band[0] - 1, band[1]).map((t) => t.id);
      const pairs: [string, string][] = [
        [seeds[0] ?? USER, seeds[3] ?? USER],
        [seeds[1] ?? USER, seeds[2] ?? USER],
      ];
      const mine = pairs.find((p) => p.includes(USER)) ?? pairs[0]!;
      const other = pairs.find((p) => p !== mine) ?? pairs[1]!;
      const opp = mine[0] === USER ? mine[1]! : mine[0]!;
      const otherWinner = unit(state.seed, pos, 77) > 0.42 ? other[0]! : other[1]!;
      const userPos = table.findIndex((t) => t.id === USER);
      const oppPos = table.findIndex((t) => t.id === opp);
      const homeId = userPos <= oppPos ? USER : opp;
      const awayId = homeId === USER ? opp : USER;
      const semi: Week = {
        label: "Play-off semi-final",
        kind: "playoff",
        cupStage: null,
        fixtures: [fixture("POS", "playoff", homeId, awayId)],
      };
      const oppClub = state.clubs.find((c) => c.id === opp);
      return {
        ...next,
        weeks: [...weeks, semi],
        weekIndex: weeks.length,
        playoff: { round: "sf", otherId: otherWinner },
        phase: userLive ? "report" : "hub",
        review: null,
        newsQueue: [
          {
            id: `playoff-${state.season}`,
            kind: "continue" as const,
            title: "Promotion play-offs",
            body: `You finished ${pos}${pos === 1 ? "st" : pos === 2 ? "nd" : pos === 3 ? "rd" : "th"} — inside the play-off places. Semi-final vs ${oppClub?.name ?? "a rival"}. Win two ties and you go up.`,
            cta: "Continue",
          },
          ...(next.newsQueue ?? []),
        ],
      };
    }
    return finishSeason(next, !!userLive, undefined, state, weekDelta);
  }
  return next;
}

function finishSeason(
  next: SaveData,
  userLive: boolean,
  forced: "up" | "down" | "stay" | undefined,
  state: SaveData,
  weekDelta: number,
): SaveData {
  const reviewed = enterReview({ ...next, playoff: null }, forced);
  if (reviewed.phase === "sacked") return reviewed;
  let done: SaveData = { ...reviewed, phase: userLive ? "report" : "season", playoff: null };
  const move = reviewed.review?.move;
  const pos = reviewed.review?.pos ?? 99;
  if (move === "up" && state.tier === 5) done = unlockAchievement(done, "promo3");
  if (move === "up" && state.tier === 4) done = unlockAchievement(done, "promo4");
  if (move === "up" && state.tier === 3) done = unlockAchievement(done, "promo5");
  if (move === "up" && state.tier === 2) done = unlockAchievement(done, "promo6");
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
    finance: NonNullable<Report["finance"]>;
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
    finance: extra.finance,
  };
}

export function suggestTargets(state: SaveData): SaveData["targets"] {
  const squad = state.players.filter((p) => p.clubId === USER && p.loan !== "out");
  const market = state.players.filter((p) => p.clubId === "market");
  const counts = new Map<string, { n: number; best: number }>();
  for (const p of squad) {
    const row = counts.get(p.pos) ?? { n: 0, best: 0 };
    row.n += 1;
    row.best = Math.max(row.best, ovr(p));
    counts.set(p.pos, row);
  }
  const order = state.transferFocus
    ? [state.transferFocus, "ST", "CB", "CM", "GK", "LW"]
    : ["ST", "CB", "CM", "GK", "LW", "RB"];
  const want: string[] = [];
  for (const pos of order) {
    if (want.includes(pos)) continue;
    const row = counts.get(pos);
    if (!row || row.n < 2 || row.best < 60) want.push(pos);
    if (want.length >= 2) break;
  }
  const picks: SaveData["targets"] = [];
  const used = new Set<string>();
  for (const pos of want) {
    const pick = market
      .filter((p) => p.pos === pos && !used.has(p.id))
      .sort((a, b) => ovr(b) - ovr(a))[0];
    if (!pick) continue;
    used.add(pick.id);
    const row = counts.get(pos);
    const mgr = state.manager?.name ?? "The manager";
    picks.push({
      playerId: pick.id,
      reason: !row || row.n < 2 ? `${mgr} wants cover at ${pos}.` : `${mgr} wants a stronger ${pos}.`,
    });
  }
  return picks.slice(0, 2);
}

function makeMarket(state: SaveData): Player[] {
  const used = new Set(state.players.map((p) => p.name));
  const mean = state.tier === 1 ? 78 : state.tier === 2 ? 72 : state.tier === 3 ? 66 : state.tier === 4 ? 60 : 54;
  const band = wageBand(state.tier);
  const scale = feeScale(state.tier);
  const list: Player[] = [];
  const poses = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST"] as const;
  const focus = state.transferFocus;
  for (let i = 0; i < 18; i++) {
    const pos = focus && i < 6 ? focus : (poses[i % poses.length] ?? "CM");
    const target = clamp(mean + Math.round((unit(state.seed, i, 30) - 0.45) * 14), 48, 90);
    const p = makePlayer(state.seed + 99, 400 + i, "market", pos, target, used);
    const rawFee = valueFor(p) * scale * (0.82 + unit(state.seed, i, 31) * 0.36);
    p.fee = Math.max(5_000, Math.round(rawFee / 5_000) * 5_000);
    p.wage = clamp(Math.round(p.wage / 50) * 50, band.min, band.max);
    p.contract = 2 + Math.floor(unit(state.seed, i, 32) * 3);
    list.push(p);
  }
  return list;
}

export function enterReview(state: SaveData, forced?: "up" | "down" | "stay"): SaveData {
  const table = leagueTable(state);
  const pos = Math.max(1, table.findIndex((t) => t.id === USER) + 1);
  const prize = (PRIZE[state.tier][pos - 1] ?? 20000) + (state.userCup === "winner" ? CUP_PRIZE[state.tier] : 0);
  const hit = objectiveHit(state.tier, pos);
  const n = table.length;
  const upN = autoPromo(state.tier);
  const downN = relegSlots(state.tier);
  const move: SeasonReview["move"] =
    forced ??
    (upN > 0 && pos <= upN && state.tier > 1
      ? "up"
      : downN > 0 && pos > n - downN && state.tier < 5
        ? "down"
        : "stay");
  let board = clamp(state.board + (hit ? 12 : -10) + (pos === 1 ? 8 : 0) + (move === "up" ? 8 : move === "down" ? -16 : 0), 0, 100);
  const squad = state.players.filter((p) => p.clubId === USER);
  const scorer = [...squad].sort((a, b) => b.goals - a.goals || b.assists - a.assists)[0];
  const young = [...squad].filter((p) => p.age <= 21).sort((a, b) => ovr(b) + b.goals - (ovr(a) + a.goals))[0];
  const awards = [
    scorer && scorer.goals > 0 ? `Top scorer: ${scorer.name} (${scorer.goals})` : "No league goals from your side",
    young ? `Young player: ${young.name}, ${young.age}` : "No teenager in the squad",
  ].join(". ");
  const review: SeasonReview = {
    pos,
    prize,
    cup: state.userCup === "winner" ? "FA Cup winners" : state.userCup === "out" ? "Cup exit" : "Cup still open",
    move,
    objectiveHit: hit,
    table,
    tier: state.tier,
    awards,
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
    reds: 0,
    cleanSheets: 0,
    fitness: 94,
    played: 0,
    goals: 0,
    assists: 0,
    ratingSum: 0,
    ratingN: 0,
    byComp: blankComp(),
    careerGoals: p.careerGoals ?? 0,
    careerAssists: p.careerAssists ?? 0,
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
  if (move === "up") tier = Math.max(1, tier - 1) as LeagueTier;
  if (move === "down") tier = Math.min(5, tier + 1) as LeagueTier;
  const prevUser = userClub(state);
  if (!prevUser) return state;
  const reputation = clamp(
    prevUser.reputation + (move === "up" ? 8 : move === "down" ? -7 : 1),
    40,
    92,
  );
  const user: Club = { ...prevUser, reputation, style: state.philosophy };
  const templates = clubsFor(tier);
  const reps = repsFor(tier, templates.length);
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
        reds: 0,
        cleanSheets: 0,
        fitness: 94,
        played: 0,
        goals: 0,
        assists: 0,
        ratingSum: 0,
        ratingN: 0,
        byComp: blankComp(),
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
  const youthN = facRating(state.facilities.academy) >= 80 ? 2 : 1;
  for (let i = 0; i < youthN; i++) {
    const pos = SQUAD_SHAPE[Math.floor(unit(state.seed, state.season, i + 3) * SQUAD_SHAPE.length)] ?? "CM";
    const ac = facTier(state.facilities.academy);
    const target = clamp(54 + ac * 3 + Math.floor(unit(state.seed, i, 8) * 6), 54, 74);
    const kid = makePlayer(state.seed + 500 + state.season, 800 + i, USER, pos, target, used, -2);
    kid.age = 17;
    kid.contract = 3;
    kid.pot = clamp(ovr(kid) + 8 + ac * 2, ovr(kid), 93);
    kid.wage = wageFor(ovr(kid), 17);
    intakes.push(kid);
  }
  players = players.concat(intakes);
  const market = makeMarket({ ...state, seed: state.seed + state.season * 13, tier, players });
  players = players.concat(market);
  const weeks = buildWeeks(clubs.map((c) => c.id), state.seed + state.season * 99, state.rivalClubId);
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
  const nextBase: SaveData = {
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
    playoff: null,
    transferFocus: state.transferFocus ?? null,
    objective: objectiveText(tier),
    sponsorName,
    sponsorBoost: clamp(0.9 + (review && review.pos <= 3 ? 0.15 : 0), 0.85, 1.25),
    fans: clamp(state.fans + (move === "up" ? 6 : move === "down" ? -6 : 0), 10, 99),
    form: "",
    posTrail: [],
    windowOpen: true,
    leagueSpend: 0,
    feesPaid: 0,
    feesReceived: 0,
  };
  const openNews = buildSeasonOpenNews(nextBase);
  openNews.unshift({
    id: `window-summer-${nextBase.season}`,
    kind: "continue",
    title: "Summer transfer window open",
    body: "The window is open until early autumn. Sign carefully — every fee counts toward league spend.",
    cta: "Continue",
  });
  return { ...nextBase, targets: suggestTargets(nextBase), newsQueue: openNews };
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
