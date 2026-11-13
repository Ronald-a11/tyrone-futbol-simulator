import type { BudgetMode, ClubManager, Philosophy, FormationId, SaveData } from "./types";
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
  { id: "profit", label: "Turn a season profit" },
  { id: "youth", label: "Academy level 4+" },
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

export function makeManagerPool(seed: number, exclude: string): ClubManager[] {
  const used = new Set([exclude]);
  const pool: ClubManager[] = [];
  for (let i = 0; i < 6; i++) {
    const name = MGR_NAMES[Math.floor(unit(seed, 20 + i, 3) * MGR_NAMES.length)] ?? `Mgr ${i}`;
    if (used.has(name)) continue;
    used.add(name);
    const styles: Philosophy[] = ["possession", "press", "counter", "direct", "youth"];
    const forms: FormationId[] = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "5-3-2"];
    pool.push({
      name,
      m: 24 + Math.floor(unit(seed, 30 + i, 1) * 20),
      c: 22 + Math.floor(unit(seed, 40 + i, 1) * 20),
      t: 20 + Math.floor(unit(seed, 50 + i, 1) * 20),
      formation: forms[Math.floor(unit(seed, 60 + i, 1) * forms.length)] ?? "4-3-3",
      style: styles[Math.floor(unit(seed, 70 + i, 1) * styles.length)] ?? "possession",
      wage: 35 + Math.floor(unit(seed, 80 + i, 1) * 55),
      happiness: 70,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      hiredSeason: 1,
      hiredWeek: 0,
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

export const SUPER_STADIUM_COST = 8_000_000;

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
