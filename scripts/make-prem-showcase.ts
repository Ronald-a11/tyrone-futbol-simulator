/** Build a playable Premier League career with a 10-season climb history baked in. */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createGame, USER } from "../src/game/world";
import { ovr } from "../src/game/players";
import type { ClubManager, SaveData } from "../src/game/types";

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "climb-save.json");

const mgr: ClubManager = {
  name: "Jordan Vale",
  m: 17,
  c: 16,
  t: 15,
  formation: "4-3-3",
  style: "press",
  wage: 45_000,
  happiness: 88,
  played: 380,
  won: 210,
  drawn: 80,
  lost: 90,
  hiredSeason: 1,
  hiredWeek: 0,
  avatar: 3,
};

let s: SaveData = createGame({
  managerName: "Tyrone",
  clubName: "Tyrone Athletic",
  short: "TYR",
  city: "Tyrone",
  stadiumName: "The Pits",
  primary: "#1a5c34",
  secondary: "#f0f4f0",
  philosophy: "press",
  formation: "4-3-3",
  chairmanAvatar: 2,
  kitId: 1,
  rivalClubId: "",
  manager: mgr,
  nationId: "eng",
  startTier: 1,
});

s = {
  ...s,
  season: 10,
  tier: 1,
  cash: 18_500_000,
  debt: 2_400_000,
  board: 78,
  fans: 86,
  fanMgrHappy: 82,
  fanChairHappy: 74,
  mentality: "attack",
  objective: "Finish in the Premier League top four.",
  sponsorName: "Sky Bet",
  sponsorBoost: 1.18,
  sponsorUntil: 12,
  notice: "Season 10 — Premier League. Climb complete: NL → L2 → L1 → Championship → Prem.",
  phase: "hub",
  screen: "dash",
  active: true,
  history: [
    { season: 1, tier: 5, pos: 1, pts: 98 },
    { season: 2, tier: 4, pos: 2, pts: 88 },
    { season: 3, tier: 3, pos: 1, pts: 92 },
    { season: 4, tier: 2, pos: 3, pts: 79 },
    { season: 5, tier: 2, pos: 2, pts: 85 },
    { season: 6, tier: 1, pos: 14, pts: 42 },
    { season: 7, tier: 1, pos: 11, pts: 48 },
    { season: 8, tier: 1, pos: 8, pts: 55 },
    { season: 9, tier: 1, pos: 6, pts: 61 },
  ],
  trophies: [
    { id: "nl-1", season: 1, label: "National League champions" },
    { id: "l2-2", season: 2, label: "League Two promotion" },
    { id: "l1-3", season: 3, label: "League One champions" },
    { id: "ch-5", season: 5, label: "Championship promotion" },
  ],
  players: s.players.map((p) => {
    if (p.clubId !== USER) return p;
    const attrs = { ...p.attrs };
    for (const k of Object.keys(attrs) as (keyof typeof attrs)[]) {
      attrs[k] = Math.min(92, attrs[k] + 14);
    }
    return { ...p, attrs, pot: Math.min(94, Math.max(p.pot, ovr({ ...p, attrs }) + 4)), morale: 80 };
  }),
};

writeFileSync(out, JSON.stringify(s));
console.log("Wrote Prem showcase", out, "season", s.season, "tier", s.tier);
