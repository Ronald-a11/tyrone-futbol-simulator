import type { SaveData } from "./types";
import { normalize } from "./world";

export const ACTIVE_KEY = "tyrone-futbol-v1";
export const SLOTS_KEY = "tyrone-futbol-slots";

export type SlotMeta = {
  id: number;
  label: string;
  club: string;
  season: number;
  tier: number;
  updated: number;
};

export function listSlots(): SlotMeta[] {
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SlotMeta[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSlots(slots: SlotMeta[]) {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots.slice(0, 5)));
}

function slotKey(id: number) {
  return `tyrone-futbol-slot-${id}`;
}

export function saveToSlot(state: SaveData, id: number, label?: string): SlotMeta | null {
  if (!state.active) return null;
  const club = state.clubs.find((c) => c.id === state.userClubId)?.name ?? "Club";
  const meta: SlotMeta = {
    id,
    label: label?.trim() || `${club} · S${state.season}`,
    club,
    season: state.season,
    tier: state.tier,
    updated: Date.now(),
  };
  try {
    localStorage.setItem(slotKey(id), JSON.stringify(state));
    const slots = listSlots().filter((s) => s.id !== id);
    slots.push(meta);
    writeSlots(slots.sort((a, b) => a.id - b.id));
    return meta;
  } catch {
    return null;
  }
}

export function loadFromSlot(id: number): SaveData | null {
  try {
    const raw = localStorage.getItem(slotKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed?.active || !Array.isArray(parsed.players)) return null;
    return normalize(parsed);
  } catch {
    return null;
  }
}

export function clearSlot(id: number) {
  try {
    localStorage.removeItem(slotKey(id));
    writeSlots(listSlots().filter((s) => s.id !== id));
  } catch {
    /* ignore */
  }
}

export function exportSave(state: SaveData): string {
  return JSON.stringify(state, null, 2);
}

export function importSave(raw: string): SaveData | null {
  try {
    const parsed = JSON.parse(raw) as SaveData;
    if (!parsed || !Array.isArray(parsed.players) || !Array.isArray(parsed.weeks)) return null;
    return normalize({ ...parsed, active: true });
  } catch {
    return null;
  }
}

export function writeActive(state: SaveData) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(state));
}
