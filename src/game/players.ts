import { ALT, FIRST, FORMATIONS, LAST, NATIONS, lineOf, type Slot } from "./data";
import type { Attrs, FormationId, Player, Position, TrainingFocus } from "./types";
import { clamp, unit } from "./util";

export function ovr(p: Pick<Player, "pos" | "attrs">): number {
  const a = p.attrs;
  const map: Record<Position, number> = {
    GK: a.gk * 0.72 + a.physical * 0.1 + a.pass * 0.08 + a.defense * 0.1,
    CB: a.defense * 0.4 + a.physical * 0.24 + a.pace * 0.14 + a.pass * 0.14 + a.dribble * 0.08,
    LB: a.pace * 0.24 + a.defense * 0.26 + a.pass * 0.2 + a.dribble * 0.14 + a.physical * 0.16,
    RB: a.pace * 0.24 + a.defense * 0.26 + a.pass * 0.2 + a.dribble * 0.14 + a.physical * 0.16,
    CDM: a.defense * 0.28 + a.pass * 0.26 + a.physical * 0.2 + a.dribble * 0.12 + a.pace * 0.14,
    CM: a.pass * 0.3 + a.dribble * 0.18 + a.defense * 0.16 + a.shoot * 0.14 + a.physical * 0.1 + a.pace * 0.12,
    CAM: a.pass * 0.26 + a.dribble * 0.24 + a.shoot * 0.22 + a.pace * 0.16 + a.physical * 0.12,
    LW: a.pace * 0.28 + a.dribble * 0.26 + a.shoot * 0.2 + a.pass * 0.16 + a.physical * 0.1,
    RW: a.pace * 0.28 + a.dribble * 0.26 + a.shoot * 0.2 + a.pass * 0.16 + a.physical * 0.1,
    ST: a.shoot * 0.38 + a.pace * 0.22 + a.physical * 0.16 + a.dribble * 0.14 + a.pass * 0.1,
  };
  return clamp(Math.round(map[p.pos]), 40, 96);
}

export function wageFor(overall: number, age: number) {
  const ageMul = age <= 20 ? 0.62 : age >= 33 ? 0.82 : 1;
  const raw = (overall - 40) * (overall - 40) * 6.4 * ageMul;
  return Math.max(750, Math.round(raw / 50) * 50);
}

export function valueFor(p: Player) {
  const o = ovr(p);
  const ageMul = p.age <= 21 ? 1.45 : p.age <= 24 ? 1.22 : p.age <= 29 ? 1 : p.age <= 32 ? 0.74 : 0.5;
  const potMul = 1 + Math.max(0, p.pot - o) * 0.035;
  const raw = Math.pow(o / 58, 7.1) * 400_000 * ageMul * potMul;
  return Math.max(20000, Math.round(raw / 10000) * 10000);
}

export function personName(seed: number, n: number, used: Set<string>) {
  for (let k = 0; k < 40; k++) {
    const f = FIRST[Math.floor(unit(seed, n, k, 1) * FIRST.length)] ?? "Rio";
    const l = LAST[Math.floor(unit(seed, n, k, 2) * LAST.length)] ?? "Voss";
    const name = `${f} ${l}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  const fallback = `Squad ${n}`;
  used.add(fallback);
  return fallback;
}

function blankAttrs(): Attrs {
  return { pace: 50, shoot: 50, pass: 50, dribble: 50, defense: 50, physical: 50, gk: 20 };
}

function bumpToward(p: Player, dir: number) {
  const a = { ...p.attrs };
  const keys: (keyof Attrs)[] =
    p.pos === "GK"
      ? ["gk", "physical", "defense"]
      : p.pos === "ST" || p.pos === "LW" || p.pos === "RW" || p.pos === "CAM"
        ? ["shoot", "pace", "dribble", "pass"]
        : p.pos === "CB" || p.pos === "LB" || p.pos === "RB" || p.pos === "CDM"
          ? ["defense", "physical", "pace", "pass"]
          : ["pass", "dribble", "defense", "pace"];
  const key = [...keys].sort((x, y) => (dir > 0 ? a[x] - a[y] : a[y] - a[x]))[0] ?? "pass";
  a[key] = clamp(a[key] + dir, 28, 96);
  return { ...p, attrs: a };
}

export function makePlayer(
  seed: number,
  index: number,
  clubId: string,
  pos: Position,
  target: number,
  used: Set<string>,
  ageBias = 0,
): Player {
  const r = (s: number) => unit(seed, index, s, pos.charCodeAt(0));
  let age = 18 + Math.floor(r(3) * 15) + ageBias;
  if (index % 9 === 0) age = 17 + Math.floor(r(4) * 2);
  age = clamp(age, 17, 35);
  const spread = () => clamp(Math.round(target + (r(5 + Math.floor(r(6) * 5)) - 0.5) * 16), 32, 94);
  const wing = pos === "LW" || pos === "RW" || pos === "LB" || pos === "RB";
  const attacker = pos === "ST" || pos === "CAM" || pos === "LW" || pos === "RW";
  let player: Player = {
    id: `${clubId}_${index}_${Math.floor(r(8) * 1e6)}`,
    name: personName(seed, index + clubId.length * 17, used),
    age,
    pos,
    alt: (ALT[pos] ?? []).slice(0, 1 + Math.floor(r(9) * 2)),
    attrs: {
      pace: clamp(spread() + (wing ? 6 : 0), 30, 96),
      shoot: clamp(spread() + (attacker ? 6 : -6), 24, 96),
      pass: clamp(spread() + (pos === "CM" || pos === "CAM" ? 5 : 0), 28, 96),
      dribble: clamp(spread() + (attacker ? 4 : 0), 28, 96),
      defense: clamp(spread() + (pos === "CB" || pos === "CDM" ? 8 : attacker ? -8 : 0), 24, 96),
      physical: clamp(spread() + (pos === "CB" || pos === "ST" ? 4 : 0), 30, 96),
      gk: pos === "GK" ? clamp(target + 4, 40, 96) : clamp(18 + Math.floor(r(11) * 16), 12, 40),
    },
    pot: target,
    morale: 62 + Math.floor(r(12) * 18),
    fitness: 86 + Math.floor(r(13) * 14),
    growth: Math.floor(r(14) * 30),
    wage: 1000,
    contract: 1 + Math.floor(r(15) * 4),
    nationality: NATIONS[Math.floor(r(16) * NATIONS.length)] ?? "Marrow",
    injured: 0,
    yellows: 0,
    banned: 0,
    clubId,
    loan: null,
    fee: 0,
    played: 0,
    goals: 0,
    assists: 0,
    ratingSum: 0,
    ratingN: 0,
  };
  for (let k = 0; k < 14; k++) {
    const now = ovr(player);
    if (Math.abs(now - target) <= 1) break;
    player = bumpToward(player, now < target ? 1 : -1);
  }
  const overall = ovr(player);
  const potLift = age <= 20 ? 8 + Math.floor(r(17) * 12) : age <= 24 ? 3 + Math.floor(r(18) * 8) : Math.floor(r(19) * 3);
  player.pot = clamp(Math.max(overall, overall + potLift), overall, 96);
  player.wage = wageFor(overall, player.age);
  return player;
}

export function maskOvr(overall: number, scout: number) {
  if (scout >= 3) return `${overall}`;
  const span = scout >= 2 ? 3 : 6;
  return `${overall - span}–${overall + span}`;
}

const SLOT_DUTY = lineOf;

export function dutyFit(player: Player, slot: Position) {
  if (slot === "GK") return player.pos === "GK" ? 1 : 0.22;
  if (player.pos === "GK") return 0.12;
  if (player.pos === slot) return 1;
  if (player.alt.includes(slot)) return 0.9;
  if (lineOf(player.pos) === lineOf(slot)) return 0.84;
  return 0.72;
}

export function available(p: Player, clubId: string) {
  return p.clubId === clubId && p.loan !== "out" && p.injured <= 0 && p.banned <= 0;
}

export function pickXi(players: Player[], clubId: string, formation: FormationId) {
  const slots = FORMATIONS[formation];
  const pool = players.filter((p) => available(p, clubId));
  const used = new Set<string>();
  const xi: string[] = [];
  for (const slot of slots) {
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of pool) {
      if (used.has(p.id)) continue;
      const fit = 0.72 + 0.28 * (p.fitness / 100);
      const score = ovr(p) * dutyFit(p, slot.pos) * fit * (0.85 + 0.15 * (p.morale / 100));
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best) {
      used.add(best.id);
      xi.push(best.id);
    } else xi.push("");
  }
  const bench = pool
    .filter((p) => !used.has(p.id))
    .sort((a, b) => ovr(b) - ovr(a))
    .slice(0, 7)
    .map((p) => p.id);
  return { xi, bench };
}

export function slotList(formation: FormationId): Slot[] {
  return FORMATIONS[formation];
}

export function growPlayer(p: Player, focus: TrainingFocus, amount: number): Player {
  if (p.injured > 0) return p;
  let growth = p.growth + amount;
  let next = p;
  while (growth >= 100 && ovr(next) < next.pot) {
    growth -= 100;
    next = raiseAttr(next, focus);
  }
  if (ovr(next) >= next.pot) growth = Math.min(growth, 99);
  const wage = wageFor(ovr(next), next.age);
  return { ...next, growth, wage: Math.max(next.wage, wage) };
}

function raiseAttr(p: Player, focus: TrainingFocus): Player {
  const a = { ...p.attrs };
  if (p.pos === "GK") {
    a.gk = clamp(a.gk + 1, 1, 96);
    return { ...p, attrs: a };
  }
  const order: (keyof Attrs)[] =
    focus === "attack"
      ? ["shoot", "pace", "dribble"]
      : focus === "defense"
        ? ["defense", "physical", "pace"]
        : focus === "technical"
          ? ["pass", "dribble", "shoot"]
          : focus === "youth"
            ? ["pass", "dribble", "pace", "shoot"]
            : ["physical", "pace", "defense"];
  const key = [...order].sort((x, y) => a[x] - a[y])[0] ?? "pass";
  a[key] = clamp(a[key] + 1, 1, 96);
  return { ...p, attrs: a };
}

export function declineAge(p: Player): Player {
  if (p.age < 32) return p;
  const a = { ...p.attrs };
  if (p.pos === "GK") a.gk = clamp(a.gk - 1, 30, 96);
  else if (p.age >= 34 || p.pos === "ST" || p.pos === "LW" || p.pos === "RW") a.pace = clamp(a.pace - 1, 28, 96);
  else a.physical = clamp(a.physical - 1, 28, 96);
  const next = { ...p, attrs: a };
  return { ...next, pot: Math.max(ovr(next), next.pot - 1), wage: wageFor(ovr(next), next.age) };
}

export { SLOT_DUTY };
