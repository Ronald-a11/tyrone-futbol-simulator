import { FORMATION_IDS, PHILOSOPHIES, SHAPES } from "./data";
import { ovr } from "./players";
import type { Club, Player, SaveData } from "./types";
import { unit } from "./util";

const USER = "user";

export type ScoutNote = {
  foe: Club;
  styleTitle: string;
  styleBody: string;
  formation: string;
  shapeName: string;
  threat: { name: string; pos: string; ovr: number; line: string };
  weakness: string;
  home: boolean;
};

function foeForm(seed: number, clubId: string) {
  const n = clubId.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return FORMATION_IDS[Math.floor(unit(seed, n, 2) * FORMATION_IDS.length)] ?? "4-3-3";
}

function threatScore(p: Player) {
  const atk =
    p.pos === "ST" || p.pos === "LW" || p.pos === "RW" || p.pos === "CAM"
      ? 1.2
      : p.pos === "CM"
        ? 1.05
        : 0.9;
  return ovr(p) * atk + p.goals * 0.4 + p.assists * 0.25;
}

export function oppositionReport(state: SaveData, foeId: string, home: boolean): ScoutNote | null {
  const foe = state.clubs.find((c) => c.id === foeId);
  if (!foe) return null;
  const phil = PHILOSOPHIES.find((p) => p.id === foe.style);
  const formation = foeForm(state.seed, foe.id);
  const shape = SHAPES[formation];
  const squad = state.players.filter((p) => p.clubId === foe.id && p.loan !== "out" && p.injured <= 0);
  const threatPlayer = [...squad].sort((a, b) => threatScore(b) - threatScore(a))[0];
  const weak =
    [...squad].sort((a, b) => ovr(a) - ovr(b)).find((p) => p.pos !== "GK") ?? threatPlayer;
  const threatPos = threatPlayer?.pos ?? "ST";
  const line =
    threatPos === "ST" || threatPos === "LW" || threatPos === "RW" || threatPos === "CAM"
      ? "in attack"
      : threatPos === "CB" || threatPos === "LB" || threatPos === "RB" || threatPos === "CDM"
        ? "at the back"
        : "through midfield";
  const weakness = !weak
    ? "No clear soft spot."
    : weak.age >= 32
      ? `${weak.name} is ${weak.age} and can be turned.`
      : ovr(weak) < 62
        ? `${weak.pos} looks soft — ${weak.name} is the soft spot.`
        : foe.style === "press"
          ? "They press high; a sharp ball behind them hurts."
          : foe.style === "possession"
            ? "Deny the middle and they go sideways."
            : foe.style === "counter"
              ? "Do not overcommit. They wait for the break."
              : foe.style === "youth"
                ? "Young legs, thin experience. Early goals shake them."
                : "Win the second balls and they fade.";
  return {
    foe,
    styleTitle: phil?.title ?? foe.style,
    styleBody: phil?.body ?? "",
    formation,
    shapeName: shape?.name ?? formation,
    threat: {
      name: threatPlayer?.name ?? "Their best",
      pos: threatPos,
      ovr: threatPlayer ? ovr(threatPlayer) : 60,
      line,
    },
    weakness,
    home,
  };
}

export type SeasonLeader = {
  id: string;
  name: string;
  clubId: string;
  goals: number;
  assists: number;
  rating: number;
  played: number;
};

export function seasonLeaders(state: SaveData): {
  scorers: SeasonLeader[];
  assists: SeasonLeader[];
  ratings: SeasonLeader[];
  mine: SeasonLeader[];
} {
  const rows: SeasonLeader[] = state.players
    .filter((p) => p.clubId !== "market" && (p.played > 0 || p.goals > 0 || p.assists > 0))
    .map((p) => ({
      id: p.id,
      name: p.name,
      clubId: p.clubId,
      goals: p.goals,
      assists: p.assists,
      rating: p.ratingN ? Math.round((p.ratingSum / p.ratingN) * 10) / 10 : 0,
      played: p.played,
    }));
  const scorers = [...rows].sort((a, b) => b.goals - a.goals || b.assists - a.assists).slice(0, 8);
  const assists = [...rows].sort((a, b) => b.assists - a.assists || b.goals - a.goals).slice(0, 8);
  const ratings = [...rows]
    .filter((r) => r.played >= 3)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
  const mine = rows
    .filter((r) => r.clubId === USER)
    .sort((a, b) => b.goals - a.goals || b.rating - a.rating)
    .slice(0, 8);
  return { scorers, assists, ratings, mine };
}
