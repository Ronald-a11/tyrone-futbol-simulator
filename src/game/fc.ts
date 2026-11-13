import type { BudgetMode, ClubManager, FanMood, Philosophy, FormationId, SaveData } from "./types";
import { clamp, unit } from "./util";
import { debtLimit } from "./data";

const MGR_NAMES = [
  "V Wilkins",
  "J Finnigan",
  "S Quill",
  "R Marlowe",
  "K Ortega",
  "A Brennan",
  "T Hale",
  "M Okonkwo",
  "L Petrov",
  "C Dunn",
  "P Yates",
  "H Crowe",
  "N Adeyemi",
  "D Sato",
  "E Bloom",
];

export const CHAIRMAN_AVATARS = [
  "🧑‍💼", "👨‍🦱", "👨‍🦰", "🧔", "👨‍🦳", "🧑‍🦱", "👨‍🦲", "👨",
  "🧔‍♂️", "🧑‍🦰", "🧑", "👴", "👱‍♂️", "👨‍🔬", "🧑‍🏫", "🤵",
  "👩‍💼", "👩‍🦰", "👩‍🦱", "👩‍🦳", "👩", "👱‍♀️", "👩‍🔬", "🧑‍💻",
  "🤵‍♀️", "👮", "👵", "🧔‍♀️",
];

export const KIT_PATTERNS: { id: number; name: string; primary: string; secondary: string; pattern: string }[] = [
  { id: 0, name: "Plain green", primary: "#1f8a5b", secondary: "#efe6d2", pattern: "solid" },
  { id: 1, name: "Harbor blue", primary: "#1c3d66", secondary: "#f4f7f5", pattern: "solid" },
  { id: 2, name: "Crimson", primary: "#9d2b3a", secondary: "#efe6d2", pattern: "solid" },
  { id: 3, name: "Ink stripe", primary: "#14261f", secondary: "#d6b25e", pattern: "stripe" },
  { id: 4, name: "Brass hoop", primary: "#d6b25e", secondary: "#14261f", pattern: "hoop" },
  { id: 5, name: "White navy", primary: "#f4f7f5", secondary: "#1c3d66", pattern: "solid" },
  { id: 6, name: "Black gold", primary: "#121614", secondary: "#d6b25e", pattern: "stripe" },
  { id: 7, name: "Sky sash", primary: "#3a7bd5", secondary: "#f4f7f5", pattern: "sash" },
  { id: 8, name: "Amber", primary: "#c97a1a", secondary: "#121614", pattern: "solid" },
  { id: 9, name: "Violet", primary: "#5b3a8c", secondary: "#efe6d2", pattern: "hoop" },
  { id: 10, name: "Forest check", primary: "#2d5a27", secondary: "#a2d149", pattern: "check" },
  { id: 11, name: "Rose", primary: "#c45c7a", secondary: "#f4f7f5", pattern: "solid" },
  { id: 12, name: "Teal stripe", primary: "#0e7c7b", secondary: "#121614", pattern: "stripe" },
  { id: 13, name: "Claret", primary: "#6b1e2a", secondary: "#d6b25e", pattern: "solid" },
  { id: 14, name: "Ice", primary: "#cfe8f5", secondary: "#1c3d66", pattern: "hoop" },
  { id: 15, name: "Mustard", primary: "#c9a227", secondary: "#14261f", pattern: "sash" },
  { id: 16, name: "Navy white", primary: "#0b1d36", secondary: "#f4f7f5", pattern: "solid" },
  { id: 17, name: "Lime stripe", primary: "#a2d149", secondary: "#14261f", pattern: "stripe" },
  { id: 18, name: "Coral hoop", primary: "#e07a5f", secondary: "#f4f7f5", pattern: "hoop" },
  { id: 19, name: "Slate sash", primary: "#4a5568", secondary: "#d6b25e", pattern: "sash" },
  { id: 20, name: "Mint", primary: "#7bdcb5", secondary: "#121614", pattern: "solid" },
  { id: 21, name: "Wine check", primary: "#6b1e2a", secondary: "#efe6d2", pattern: "check" },
  { id: 22, name: "Royal", primary: "#2b4c9b", secondary: "#d6b25e", pattern: "stripe" },
  { id: 23, name: "Sand", primary: "#d4b483", secondary: "#3d2a1a", pattern: "solid" },
  { id: 24, name: "Emerald hoop", primary: "#0f6b4c", secondary: "#f4f7f5", pattern: "hoop" },
  { id: 25, name: "Graphite", primary: "#2d3436", secondary: "#74b9ff", pattern: "sash" },
  { id: 26, name: "Cherry", primary: "#c0392b", secondary: "#f4f7f5", pattern: "solid" },
  { id: 27, name: "Aqua stripe", primary: "#00b894", secondary: "#0b1d36", pattern: "stripe" },
];

export const ACHIEVEMENT_DEFS: { id: string; label: string }[] = [
  { id: "promo3", label: "Promotion from Harbor League" },
  { id: "promo2", label: "Promotion from Marrow Championship" },
  { id: "champ1", label: "Champions of the Tyrone Premier" },
  { id: "top4_1", label: "Top four in the Tyrone Premier" },
  { id: "shield", label: "Win the Tyrone Shield" },
  { id: "shield_final", label: "Reach the Shield final" },
  { id: "survive", label: "Avoid relegation" },
  { id: "crowd5k", label: "Crowd of 5,000+" },
  { id: "crowd10k", label: "Crowd of 10,000+" },
  { id: "profit", label: "Turn a season profit" },
  { id: "youth", label: "Academy level 4+" },
  { id: "train4", label: "Training facilities level 4+" },
  { id: "medical4", label: "Medical centre level 4+" },
  { id: "super", label: "Build the Super Stadium" },
  { id: "stands_max", label: "Max out every stand" },
  { id: "win10", label: "Win 10 league matches in a season" },
  { id: "unbeaten5", label: "Five league games unbeaten" },
  { id: "goal50", label: "Score 50 league goals in a season" },
  { id: "clean10", label: "Ten clean sheets in a season" },
  { id: "sell1m", label: "Sell a player for £1m+" },
  { id: "buy1m", label: "Buy a player for £1m+" },
  { id: "wage_ok", label: "Keep wages under recommended max" },
  { id: "debt_free", label: "Clear the overdraft" },
  { id: "fans90", label: "Fans happiness 90%+" },
  { id: "board90", label: "Board confidence 90%+" },
  { id: "mgr_long", label: "Keep a manager for 40 games" },
  { id: "sack1", label: "Sack a manager" },
  { id: "hire3", label: "Hire three managers" },
  { id: "loan5", label: "Loan out five players" },
  { id: "youth_debut", label: "Give a teenager a debut" },
  { id: "cup_qf", label: "Reach Shield quarter-final" },
  { id: "cup_sf", label: "Reach Shield semi-final" },
  { id: "promo_twice", label: "Earn two promotions" },
  { id: "title_retain", label: "Retain the Tyrone Premier" },
  { id: "away_win5", label: "Five away wins in a season" },
  { id: "derby_win", label: "Beat your local rival" },
  { id: "comeback", label: "Win after trailing at half-time" },
  { id: "hattrick", label: "A player scores a hat-trick" },
  { id: "outlets3", label: "Food outlets level 3+" },
  { id: "merch3", label: "Merchandise level 3+" },
  { id: "pitch80", label: "Pitch quality 80+" },
  { id: "cash5m", label: "Bank balance £5m+" },
  { id: "season2", label: "Complete two seasons" },
  { id: "season5", label: "Complete five seasons" },
  { id: "form_wwwww", label: "Five wins in a row" },
  { id: "zero_budget", label: "Run a season on zero transfer budget" },
  { id: "max_budget", label: "Give the manager a max budget" },
  { id: "ticket7", label: "Charge £7 tickets" },
  { id: "bonus20", label: "Agree a 20% win bonus" },
  { id: "scout5", label: "Scout staff level 5" },
  { id: "coach5", label: "Coach staff level 5" },
];

export function defaultManager(seed: number, style: Philosophy, formation: FormationId): ClubManager {
  const name = MGR_NAMES[Math.floor(unit(seed, 11, 2) * MGR_NAMES.length)] ?? "V Wilkins";
  return {
    name,
    m: 28 + Math.floor(unit(seed, 12, 1) * 12),
    c: 26 + Math.floor(unit(seed, 13, 1) * 12),
    t: 24 + Math.floor(unit(seed, 14, 1) * 12),
    formation,
    style,
    wage: 40 + Math.floor(unit(seed, 15, 1) * 40),
    happiness: 80 + Math.floor(unit(seed, 16, 1) * 15),
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    hiredSeason: 1,
    hiredWeek: 0,
  };
}

function fanMoodFor(seed: number, i: number): FanMood {
  const roll = unit(seed, 90 + i, 2);
  if (roll > 0.75) return "Popular";
  if (roll > 0.45) return "OK";
  if (roll > 0.2) return "Unsure";
  return "Unpopular";
}

export function makeManagerPool(seed: number, exclude: string): ClubManager[] {
  const used = new Set([exclude]);
  const pool: ClubManager[] = [];
  for (let i = 0; i < 8 && pool.length < 5; i++) {
    const name = MGR_NAMES[Math.floor(unit(seed, 20 + i, 3) * MGR_NAMES.length)] ?? `Mgr ${i}`;
    if (used.has(name)) continue;
    used.add(name);
    const styles: Philosophy[] = ["possession", "press", "counter", "direct", "youth"];
    const forms: FormationId[] = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "5-3-2"];
    const wage = 35 + Math.floor(unit(seed, 80 + i, 1) * 55);
    pool.push({
      name,
      m: 24 + Math.floor(unit(seed, 30 + i, 1) * 20),
      c: 22 + Math.floor(unit(seed, 40 + i, 1) * 20),
      t: 20 + Math.floor(unit(seed, 50 + i, 1) * 20),
      formation: forms[Math.floor(unit(seed, 60 + i, 1) * forms.length)] ?? "4-3-3",
      style: styles[Math.floor(unit(seed, 70 + i, 1) * styles.length)] ?? "possession",
      wage,
      happiness: 70,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      hiredSeason: 1,
      hiredWeek: 0,
      fanMood: fanMoodFor(seed, i),
      compensation: unit(seed, 88 + i, 1) > 0.55 ? Math.round(wage * 20) : 0,
      avatar: Math.floor(unit(seed, 95 + i, 1) * CHAIRMAN_AVATARS.length),
    });
  }
  return pool;
}

export function transferCap(state: SaveData): number {
  const mode = state.transferBudgetMode ?? "normal";
  const bal = state.cash;
  const od = Math.max(0, debtLimit(state.tier) - state.debt);
  if (mode === "zero") return 0;
  if (mode === "strict") return Math.max(0, Math.floor(bal * 0.25));
  if (mode === "cautious") return Math.max(0, Math.floor(bal * 0.5));
  if (mode === "normal") return Math.max(0, bal);
  return Math.max(0, bal + Math.floor(od * 0.5));
}

export function budgetLabel(mode: BudgetMode): { title: string; body: string } {
  if (mode === "max") return { title: "Max", body: "Full bank balance + 50% overdraft headroom" };
  if (mode === "cautious") return { title: "Cautious", body: "50% bank balance" };
  if (mode === "strict") return { title: "Strict", body: "25% bank balance" };
  if (mode === "zero") return { title: "Zero", body: "No money available" };
  return { title: "Normal", body: "Full bank balance" };
}

export function outletCrowdCap(outlets: SaveData["outlets"]) {
  const food = (outlets.burger + outlets.counter + outlets.cafe) * 800 + 1000;
  return food;
}

export function outletProfitPerSale(outlets: SaveData["outlets"]) {
  return 0.6 + outlets.burger * 0.15 + outlets.counter * 0.2 + outlets.cafe * 0.25 + outlets.merch * 0.1;
}

export function outletUpgradeCost(level: number) {
  return [25_000, 60_000, 140_000, 320_000][level] ?? 0;
}

export function facilityStepCost(from: number, to: number) {
  let cost = 0;
  for (let l = from; l < to; l++) cost += upgradeStepCost(l);
  return cost;
}

export function upgradeStepCost(level: number) {
  return Math.round(80_000 * Math.pow(1.55, level));
}

export function weeklyFacilityCost(level: number) {
  return Math.round(18 + level * 4);
}

export const SUPER_STADIUM_COST = 250_000_000;

export function seasonMonthLabel(weekIndex: number) {
  const months = ["Jul", "Aug", "Aug", "Sep", "Sep", "Oct", "Oct", "Nov", "Nov", "Dec", "Dec", "Jan", "Jan", "Feb", "Feb", "Mar", "Apr", "May"];
  return months[Math.min(weekIndex, months.length - 1)] ?? "Jul";
}

export function managerAppointedCard(mgr: ClubManager, clubName: string): SaveData["newsQueue"][number] {
  return {
    id: `appointed-${mgr.name}-${Date.now()}`,
    kind: "continue",
    title: "New manager appointed",
    body: `${mgr.name} is on a rolling contract at ${clubName}. Severance is twelve months' wages (£${(mgr.wage * 52).toLocaleString("en-GB")}) if you sack him.`,
    cta: "Continue",
  };
}

export function buildSeasonOpenNews(state: SaveData): SaveData["newsQueue"] {
  const wages = state.players.filter((p) => p.clubId === "user" && p.loan !== "out").reduce((s, p) => s + p.wage, 0);
  const sponsors = [
    { name: "Harbor Grain", fee: 180_000, untilSeason: state.season + 2 },
    { name: "Quay Motors", fee: 140_000, untilSeason: state.season + 3 },
    { name: "Northglass Tools", fee: 220_000, untilSeason: state.season + 1 },
  ];
  const rival =
    state.clubs.find((c) => c.id === state.rivalClubId)?.name ??
    state.clubs.find((c) => c.id !== "user")?.name ??
    "a local side";
  const club = state.clubs.find((c) => c.id === "user");
  return [
    {
      id: `expect-${state.season}`,
      kind: "continue",
      title: "Season prepare",
      body: `The fan survey is in. Expectations this year: ${state.objective}`,
      cta: "Continue",
    },
    {
      id: `sponsor-${state.season}`,
      kind: "sponsor",
      title: "Choose shirt sponsor",
      body: "Three firms want the shirt. Pick one deal for the seasons ahead.",
      options: sponsors,
    },
    {
      id: `tickets-${state.season}`,
      kind: "tickets",
      title: "Set ticket prices",
      body: "Higher prices swell the gate when crowds come. Lower prices keep the terrace loud. Typical Harbor League tickets sit between £3 and £7.",
      min: 3,
      max: 7,
    },
    {
      id: `friendly-${state.season}`,
      kind: "continue",
      title: "Pre-season friendly",
      body: `${club?.name ?? "Your club"} host ${rival} in a pre-season friendly at ${state.stadiumName || club?.stadium || "home"}. Division tag: ${state.tier === 3 ? "Harbor League" : state.tier === 2 ? "Championship" : "Premier"}.`,
      cta: "Continue",
    },
    {
      id: `bonus-${state.season}`,
      kind: "bonus",
      title: "Players request a win bonus",
      body: "The squad wants a cut of matchday bonuses. The board recommends staying near 20% of weekly wages for a full win week.",
      wages,
      recommended: Math.round(wages * 0.2),
    },
  ];
}

export function pushForm(form: string, result: "W" | "D" | "L") {
  return (form + result).slice(-10);
}

export function unlockAchievement(state: SaveData, id: string): SaveData {
  if (state.achievements.some((a) => a.id === id)) return state;
  return {
    ...state,
    achievements: [...state.achievements, { id, earnedAt: `S${state.season} W${state.weekIndex + 1}` }],
  };
}

export function emptyRecords() {
  return {
    biggestCrowd: 0,
    biggestCrowdLabel: "—",
    heaviestDefeat: "—",
    heaviestDefeatLabel: "—",
    longestManagerGames: 0,
    longestManagerName: "—",
  };
}

export function syncManagerTactics(state: SaveData): SaveData {
  const m = state.manager;
  if (!m) return state;
  return {
    ...state,
    philosophy: m.style,
    formation: m.formation,
  };
}

export function refreshHappiness(state: SaveData): SaveData {
  const tablePos = 1;
  void tablePos;
  const board = state.board;
  const fans = state.fans;
  const mgrHappy = clamp(40 + state.manager.happiness * 0.35 + (state.manager.won - state.manager.lost) * 3, 5, 99);
  const chairHappy = clamp(fans * 0.55 + board * 0.35 + (state.seasonProfit >= 0 ? 5 : -8), 5, 99);
  return { ...state, fanMgrHappy: Math.round(mgrHappy), fanChairHappy: Math.round(chairHappy) };
}
