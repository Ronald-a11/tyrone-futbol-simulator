import { FORMATION_IDS, PHILOSOPHIES, SHAPES, TIER_META } from "./data";
import type { LeagueTier } from "./england";
import { ovr } from "./players";
import type { Club, CompKind, Player, SaveData } from "./types";
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

const COMPS: CompKind[] = ["league", "cup", "playoff", "friendly"];

function blankBucket() {
  return { goals: 0, assists: 0, played: 0, yellows: 0, reds: 0, cleanSheets: 0 };
}

function bucketFor(p: Player, comp: CompKind | "all" | "career") {
  if (comp === "career") {
    return {
      goals: p.careerGoals ?? p.goals,
      assists: p.careerAssists ?? p.assists,
      played: p.played,
      yellows: p.yellows ?? 0,
      reds: p.reds ?? 0,
      cleanSheets: p.cleanSheets ?? 0,
    };
  }
  if (comp === "all") {
    const bc = p.byComp;
    if (!bc) {
      return {
        goals: p.goals,
        assists: p.assists,
        played: p.played,
        yellows: p.yellows ?? 0,
        reds: p.reds ?? 0,
        cleanSheets: p.cleanSheets ?? 0,
      };
    }
    return COMPS.reduce((acc, k) => {
      const b = { ...blankBucket(), ...(bc[k] ?? {}) };
      return {
        goals: acc.goals + b.goals,
        assists: acc.assists + b.assists,
        played: acc.played + b.played,
        yellows: acc.yellows + (b.yellows ?? 0),
        reds: acc.reds + (b.reds ?? 0),
        cleanSheets: acc.cleanSheets + (b.cleanSheets ?? 0),
      };
    }, blankBucket());
  }
  return { ...blankBucket(), ...(p.byComp?.[comp] ?? {}) };
}

export type SeasonLeader = {
  id: string;
  name: string;
  clubId: string;
  goals: number;
  assists: number;
  rating: number;
  played: number;
  yellows: number;
  reds: number;
  cleanSheets: number;
};

export type CompLeaders = {
  scorers: SeasonLeader[];
  assists: SeasonLeader[];
  ratings: SeasonLeader[];
  cleanSheets: SeasonLeader[];
  yellows: SeasonLeader[];
  reds: SeasonLeader[];
  mine: SeasonLeader[];
};

export function seasonLeaders(
  state: SaveData,
  comp: CompKind | "all" | "career" = "league",
): CompLeaders {
  const leagueIds = new Set(state.clubs.map((c) => c.id));
  leagueIds.add(USER);
  const rows: SeasonLeader[] = state.players
    .filter((p) => p.clubId !== "market" && leagueIds.has(p.clubId))
    .map((p) => {
      const b = bucketFor(p, comp);
      return {
        id: p.id,
        name: p.name,
        clubId: p.clubId,
        goals: b.goals,
        assists: b.assists,
        rating: p.ratingN ? Math.round((p.ratingSum / p.ratingN) * 10) / 10 : 0,
        played: b.played,
        yellows: b.yellows ?? 0,
        reds: b.reds ?? 0,
        cleanSheets: b.cleanSheets ?? 0,
      };
    })
    .filter(
      (r) =>
        r.goals > 0 ||
        r.assists > 0 ||
        r.yellows > 0 ||
        r.reds > 0 ||
        r.cleanSheets > 0 ||
        (comp !== "career" && r.played > 0) ||
        (comp === "career" && (r.goals > 0 || r.assists > 0)),
    );

  const scorers = [...rows]
    .filter((r) => r.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 20);
  const assists = [...rows]
    .filter((r) => r.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, 20);
  const ratings = [...rows]
    .filter((r) => (comp === "career" ? r.rating > 0 : r.played >= 3) && r.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 15);
  const cleanSheets = [...rows]
    .filter((r) => r.cleanSheets > 0)
    .sort((a, b) => b.cleanSheets - a.cleanSheets || b.played - a.played)
    .slice(0, 20);
  const yellows = [...rows]
    .filter((r) => r.yellows > 0)
    .sort((a, b) => b.yellows - a.yellows || b.reds - a.reds)
    .slice(0, 20);
  const reds = [...rows]
    .filter((r) => r.reds > 0)
    .sort((a, b) => b.reds - a.reds || b.yellows - a.yellows)
    .slice(0, 20);
  const mine = rows
    .filter((r) => r.clubId === USER)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || b.rating - a.rating)
    .slice(0, 16);
  return { scorers, assists, ratings, cleanSheets, yellows, reds, mine };
}

export function bestPlayerNominees(state: SaveData, n = 3): SeasonLeader[] {
  const league = seasonLeaders(state, "league");
  const pool = [...league.ratings, ...league.scorers];
  const seen = new Set<string>();
  const uniq: SeasonLeader[] = [];
  for (const row of pool.sort(
    (a, b) => b.rating * 10 + b.goals * 2 + b.assists - (a.rating * 10 + a.goals * 2 + a.assists),
  )) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    uniq.push(row);
    if (uniq.length >= n) break;
  }
  return uniq;
}

type ClubSeed = { name: string; short: string; primary: string; secondary: string };

const OTHER_POOL: Record<LeagueTier, ClubSeed[]> = {
  1: [
    { name: "Arsenal", short: "ARS", primary: "#EF0107", secondary: "#FFFFFF" },
    { name: "Liverpool", short: "LIV", primary: "#C8102E", secondary: "#00B2A9" },
    { name: "Man City", short: "MCI", primary: "#6CABDD", secondary: "#1C2C5B" },
    { name: "Chelsea", short: "CHE", primary: "#034694", secondary: "#FFFFFF" },
    { name: "Tottenham", short: "TOT", primary: "#132257", secondary: "#FFFFFF" },
    { name: "Man United", short: "MUN", primary: "#DA291C", secondary: "#FBE122" },
    { name: "Newcastle", short: "NEW", primary: "#241F20", secondary: "#FFFFFF" },
    { name: "Aston Villa", short: "AVL", primary: "#670E36", secondary: "#95BFE5" },
    { name: "Brighton", short: "BHA", primary: "#0057B8", secondary: "#FFFFFF" },
    { name: "West Ham", short: "WHU", primary: "#7A263A", secondary: "#1BB1E7" },
    { name: "Wolves", short: "WOL", primary: "#FDB913", secondary: "#000000" },
    { name: "Crystal Palace", short: "CRY", primary: "#1B458F", secondary: "#C4122E" },
    { name: "Fulham", short: "FUL", primary: "#FFFFFF", secondary: "#000000" },
    { name: "Brentford", short: "BRE", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Bournemouth", short: "BOU", primary: "#DA291C", secondary: "#000000" },
    { name: "Everton", short: "EVE", primary: "#003399", secondary: "#FFFFFF" },
    { name: "Nott'm Forest", short: "NFO", primary: "#E53233", secondary: "#FFFFFF" },
    { name: "Burnley", short: "BUR", primary: "#6C1D45", secondary: "#99D6EA" },
    { name: "Sheffield Utd", short: "SHU", primary: "#EE2737", secondary: "#FFFFFF" },
    { name: "Luton", short: "LUT", primary: "#F78F1E", secondary: "#002D62" },
  ],
  2: [
    { name: "Leeds", short: "LEE", primary: "#FFCD00", secondary: "#1D428A" },
    { name: "Leicester", short: "LEI", primary: "#003090", secondary: "#FDBE11" },
    { name: "Ipswich", short: "IPS", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Southampton", short: "SOU", primary: "#D71920", secondary: "#FFFFFF" },
    { name: "West Brom", short: "WBA", primary: "#122F67", secondary: "#FFFFFF" },
    { name: "Norwich", short: "NOR", primary: "#00A650", secondary: "#FFF200" },
    { name: "Middlesbrough", short: "MID", primary: "#E11B22", secondary: "#FFFFFF" },
    { name: "Coventry", short: "COV", primary: "#77B6E4", secondary: "#FFFFFF" },
    { name: "Hull", short: "HUL", primary: "#F5A12D", secondary: "#000000" },
    { name: "Watford", short: "WAT", primary: "#FBEE23", secondary: "#000000" },
    { name: "Sunderland", short: "SUN", primary: "#EB172B", secondary: "#FFFFFF" },
    { name: "Stoke", short: "STK", primary: "#E03A3E", secondary: "#FFFFFF" },
    { name: "Cardiff", short: "CAR", primary: "#0070B5", secondary: "#FFFFFF" },
    { name: "Swansea", short: "SWA", primary: "#FFFFFF", secondary: "#000000" },
    { name: "Bristol City", short: "BRC", primary: "#E31C23", secondary: "#FFFFFF" },
    { name: "QPR", short: "QPR", primary: "#1D5BA4", secondary: "#FFFFFF" },
    { name: "Preston", short: "PNE", primary: "#FFFFFF", secondary: "#001489" },
    { name: "Blackburn", short: "BLB", primary: "#009EE0", secondary: "#FFFFFF" },
    { name: "Plymouth", short: "PLY", primary: "#0033A0", secondary: "#00843D" },
    { name: "Oxford Utd", short: "OXF", primary: "#FDB913", secondary: "#003366" },
  ],
  3: [
    { name: "Bolton", short: "BOL", primary: "#FFFFFF", secondary: "#1A2B5F" },
    { name: "Wrexham", short: "WRX", primary: "#C8102E", secondary: "#FFFFFF" },
    { name: "Stockport", short: "STP", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Charlton", short: "CHA", primary: "#D4021D", secondary: "#FFFFFF" },
    { name: "Reading", short: "REA", primary: "#004C97", secondary: "#FFFFFF" },
    { name: "Barnsley", short: "BAR", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Peterborough", short: "PET", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Lincoln", short: "LIN", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Blackpool", short: "BPL", primary: "#F68712", secondary: "#FFFFFF" },
    { name: "Wycombe", short: "WYC", primary: "#73A9D8", secondary: "#002147" },
    { name: "Stevenage", short: "STE", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Leyton Orient", short: "LEY", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Northampton", short: "NOR", primary: "#8A1538", secondary: "#FFFFFF" },
    { name: "Exeter", short: "EXE", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Burton", short: "BRT", primary: "#FFD100", secondary: "#000000" },
    { name: "Cambridge", short: "CAM", primary: "#FFD100", secondary: "#000000" },
    { name: "Shrewsbury", short: "SHR", primary: "#0033A0", secondary: "#FFD100" },
    { name: "Portsmouth", short: "POR", primary: "#003087", secondary: "#FFFFFF" },
    { name: "Derby", short: "DER", primary: "#FFFFFF", secondary: "#000000" },
    { name: "Rotherham", short: "ROT", primary: "#E30613", secondary: "#FFFFFF" },
  ],
  4: [
    { name: "Notts County", short: "NCO", primary: "#000000", secondary: "#FFFFFF" },
    { name: "MK Dons", short: "MKD", primary: "#FFFFFF", secondary: "#E30613" },
    { name: "Chesterfield", short: "CHF", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Gillingham", short: "GIL", primary: "#003087", secondary: "#FFFFFF" },
    { name: "Bradford", short: "BRD", primary: "#A50044", secondary: "#FFD100" },
    { name: "Port Vale", short: "PVA", primary: "#000000", secondary: "#FFFFFF" },
    { name: "Walsall", short: "WAL", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Doncaster", short: "DON", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "AFC Wimbledon", short: "WIM", primary: "#0033A0", secondary: "#FFD100" },
    { name: "Salford", short: "SAL", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Harrogate", short: "HAR", primary: "#FFD100", secondary: "#000000" },
    { name: "Barrow", short: "BRW", primary: "#FFFFFF", secondary: "#0033A0" },
    { name: "Newport", short: "NEW", primary: "#FFD100", secondary: "#000000" },
    { name: "Crawley", short: "CRA", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Accrington", short: "ACC", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Morecambe", short: "MOR", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Tranmere", short: "TRA", primary: "#FFFFFF", secondary: "#0033A0" },
    { name: "Crewe", short: "CRE", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Grimsby", short: "GRI", primary: "#000000", secondary: "#FFFFFF" },
    { name: "Colchester", short: "COL", primary: "#0033A0", secondary: "#FFFFFF" },
  ],
  5: [
    { name: "York", short: "YOR", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Barnet", short: "BAR", primary: "#000000", secondary: "#FF8200" },
    { name: "Oldham", short: "OLD", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Rochdale", short: "ROC", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Solihull", short: "SOL", primary: "#FFD100", secondary: "#0033A0" },
    { name: "Southend", short: "SEU", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Gateshead", short: "GAT", primary: "#FFFFFF", secondary: "#000000" },
    { name: "Eastleigh", short: "EAS", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Aldershot", short: "ALD", primary: "#E30613", secondary: "#0033A0" },
    { name: "Dagenham", short: "DAG", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Wealdstone", short: "WEA", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Halifax", short: "HAL", primary: "#0033A0", secondary: "#FFFFFF" },
    { name: "Altrincham", short: "ALT", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Maidenhead", short: "MAI", primary: "#000000", secondary: "#FFFFFF" },
    { name: "Boreham Wood", short: "BOR", primary: "#FFFFFF", secondary: "#000000" },
    { name: "Ebbsfleet", short: "EBB", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Dorking", short: "DOR", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Kidderminster", short: "KID", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Woking", short: "WOK", primary: "#E30613", secondary: "#FFFFFF" },
    { name: "Bromley", short: "BRO", primary: "#FFFFFF", secondary: "#000000" },
  ],
};

const EURO_CLUBS: ClubSeed[] = [
  { name: "Real Madrid", short: "RMA", primary: "#FFFFFF", secondary: "#FEBE10" },
  { name: "Barcelona", short: "BAR", primary: "#A50044", secondary: "#004D98" },
  { name: "Bayern Munich", short: "BAY", primary: "#DC052D", secondary: "#FFFFFF" },
  { name: "PSG", short: "PSG", primary: "#004170", secondary: "#DA291C" },
  { name: "Inter", short: "INT", primary: "#010E80", secondary: "#000000" },
  { name: "AC Milan", short: "MIL", primary: "#FB090B", secondary: "#000000" },
  { name: "Dortmund", short: "BVB", primary: "#FDE100", secondary: "#000000" },
  { name: "Atletico", short: "ATM", primary: "#CB3524", secondary: "#FFFFFF" },
  { name: "Juventus", short: "JUV", primary: "#000000", secondary: "#FFFFFF" },
  { name: "Benfica", short: "BEN", primary: "#E30613", secondary: "#FFFFFF" },
  { name: "Porto", short: "POR", primary: "#003893", secondary: "#FFFFFF" },
  { name: "Ajax", short: "AJX", primary: "#D2122E", secondary: "#FFFFFF" },
  { name: "Napoli", short: "NAP", primary: "#12A0D7", secondary: "#FFFFFF" },
  { name: "Leipzig", short: "RBL", primary: "#DD0741", secondary: "#FFFFFF" },
  { name: "Arsenal", short: "ARS", primary: "#EF0107", secondary: "#FFFFFF" },
  { name: "Man City", short: "MCI", primary: "#6CABDD", secondary: "#1C2C5B" },
  { name: "Liverpool", short: "LIV", primary: "#C8102E", secondary: "#00B2A9" },
  { name: "Chelsea", short: "CHE", primary: "#034694", secondary: "#FFFFFF" },
  { name: "Sporting", short: "SPO", primary: "#008057", secondary: "#FFFFFF" },
  { name: "Leverkusen", short: "B04", primary: "#E32221", secondary: "#000000" },
  { name: "Celtic", short: "CEL", primary: "#018749", secondary: "#FFFFFF" },
  { name: "Rangers", short: "RAN", primary: "#1B458F", secondary: "#FFFFFF" },
  { name: "Galatasaray", short: "GAL", primary: "#A90432", secondary: "#FDB912" },
  { name: "Fenerbahce", short: "FEN", primary: "#FFED00", secondary: "#00205B" },
  { name: "Shakhtar", short: "SHK", primary: "#FF6A00", secondary: "#000000" },
  { name: "Salzburg", short: "RBS", primary: "#E30613", secondary: "#FFFFFF" },
  { name: "Club Brugge", short: "BRU", primary: "#0033A0", secondary: "#000000" },
  { name: "Monaco", short: "ASM", primary: "#E30613", secondary: "#FFFFFF" },
  { name: "Marseille", short: "OM", primary: "#2FAEE0", secondary: "#FFFFFF" },
  { name: "Atalanta", short: "ATA", primary: "#1E71B8", secondary: "#000000" },
  { name: "Sevilla", short: "SEV", primary: "#FFFFFF", secondary: "#D71920" },
  { name: "Villarreal", short: "VIL", primary: "#FFE500", secondary: "#0057B8" },
  { name: "Lazio", short: "LAZ", primary: "#87D8F7", secondary: "#FFFFFF" },
  { name: "Roma", short: "ROM", primary: "#8E1F2F", secondary: "#F0BC42" },
  { name: "Pilsen", short: "VPL", primary: "#0033A0", secondary: "#E30613" },
  { name: "Young Boys", short: "YB", primary: "#FFD100", secondary: "#000000" },
];

const EURO_NAMES = [
  "Haaland", "Mbappé", "Vinícius", "Bellingham", "Saka", "Palmer", "Foden", "Rodri", "Kane", "Osimhen",
  "Lautaro", "Griezmann", "Salah", "De Bruyne", "Pedri", "Gavi", "Musiala", "Wirtz", "Leão", "Dembélé",
  "Courtois", "Alisson", "Donnarumma", "Ederson", "Oblak", "Raya", "Maignan", "Neuer", "Szczęsny", "Diogo Costa",
];

export type OtherLeagueRow = {
  name: string;
  short: string;
  primary: string;
  secondary: string;
  pts: number;
  gd: number;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
};

export type OtherLeagueBoard = {
  tier: LeagueTier;
  name: string;
  short: string;
  rows: OtherLeagueRow[];
  headline: string;
  scorers: { name: string; club: string; n: number }[];
  assists: { name: string; club: string; n: number }[];
  cleanSheets: { name: string; club: string; n: number }[];
  yellows: { name: string; club: string; n: number }[];
  reds: { name: string; club: string; n: number }[];
};

export type EuroBoard = {
  id: "ucl" | "uel" | "uecl";
  name: string;
  short: string;
  rows: OtherLeagueRow[];
  headline: string;
  scorers: { name: string; club: string; n: number }[];
  assists: { name: string; club: string; n: number }[];
  cleanSheets: { name: string; club: string; n: number }[];
  yellows: { name: string; club: string; n: number }[];
  reds: { name: string; club: string; n: number }[];
};

function buildStandings(
  pool: ClubSeed[],
  seed: number,
  week: number,
  salt: number,
  count: number,
  playedCap: number,
): OtherLeagueRow[] {
  const shuffled = [...pool].sort(
    (a, b) =>
      unit(seed, week, salt + a.short.charCodeAt(0)) - unit(seed, week, salt + b.short.charCodeAt(0) + 3),
  );
  const played = Math.min(playedCap, Math.max(1, week + Math.floor(unit(seed, salt, 9) * 3)));
  const rows: OtherLeagueRow[] = shuffled.slice(0, count).map((c, i) => {
    const w = Math.max(0, Math.round(played * (0.55 - i * 0.02) + unit(seed, week, salt + i * 3) * 3));
    const d = Math.max(0, Math.min(played - w, Math.round(played * 0.22 + unit(seed, week, salt + i * 5) * 2)));
    const l = Math.max(0, played - w - d);
    const gf = Math.max(0, Math.round(w * 1.7 + d * 0.6 + unit(seed, week, salt + i * 7) * 4));
    const ga = Math.max(0, Math.round(l * 1.6 + d * 0.7 + unit(seed, week, salt + i * 9) * 3));
    return { ...c, p: played, w, d, l, gf, ga, gd: gf - ga, pts: w * 3 + d };
  });
  rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  return rows;
}

function boardLeaders(rows: OtherLeagueRow[], seed: number, week: number, salt: number) {
  const top = rows.slice(0, 12);
  const pick = (offset: number, scale: number, floor = 1) =>
    top
      .map((c, i) => ({
        name: EURO_NAMES[(salt + offset + i * 3) % EURO_NAMES.length]!,
        club: c.short,
        n: Math.max(floor, Math.round(scale - i * (scale / 14) + unit(seed, week, salt + offset + i) * 3)),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
  return {
    scorers: pick(1, 18, 2),
    assists: pick(2, 12, 1),
    cleanSheets: pick(3, 10, 1).map((r, i) => ({
      ...r,
      name: EURO_NAMES[(salt + 40 + i) % EURO_NAMES.length]!,
    })),
    yellows: pick(4, 9, 2),
    reds: pick(5, 3, 1).slice(0, 8),
  };
}

/** Full tables for every English division (including yours as a live snapshot of rivals elsewhere). */
export function otherLeagueBoards(state: SaveData): OtherLeagueBoard[] {
  const out: OtherLeagueBoard[] = [];
  for (const tier of [1, 2, 3, 4, 5] as LeagueTier[]) {
    if (tier === state.tier) continue;
    const rows = buildStandings(OTHER_POOL[tier], state.seed, state.weekIndex, tier * 17, 20, tier === 1 ? 38 : 46);
    const leaders = boardLeaders(rows, state.seed, state.weekIndex, tier * 100);
    const a = rows[0]!;
    const b = rows[1]!;
    const hs = 1 + Math.floor(unit(state.seed, state.weekIndex, tier * 50) * 3);
    const as = Math.floor(unit(state.seed, state.weekIndex, tier * 51) * 3);
    out.push({
      tier,
      name: TIER_META[tier].name,
      short: TIER_META[tier].short,
      rows,
      headline: `${a.name} ${hs}–${as} ${b.name} · ${a.name} lead the ${TIER_META[tier].short}`,
      ...leaders,
    });
  }
  return out;
}

/** UEFA competition tables + leaders (Champions League, Europa League, Conference). */
export function euroBoards(state: SaveData): EuroBoard[] {
  const defs: { id: EuroBoard["id"]; name: string; short: string; count: number; salt: number }[] = [
    { id: "ucl", name: "UEFA Champions League", short: "UCL", count: 36, salt: 701 },
    { id: "uel", name: "UEFA Europa League", short: "UEL", count: 36, salt: 702 },
    { id: "uecl", name: "UEFA Conference League", short: "UECL", count: 36, salt: 703 },
  ];
  return defs.map((d) => {
    const pool = [...EURO_CLUBS].sort(
      (a, b) =>
        unit(state.seed, state.season, d.salt + a.short.charCodeAt(0)) -
        unit(state.seed, state.season, d.salt + b.short.charCodeAt(0)),
    );
    const rows = buildStandings(pool, state.seed, state.weekIndex, d.salt, d.count, 8);
    const leaders = boardLeaders(rows, state.seed, state.weekIndex, d.salt);
    const a = rows[0]!;
    return {
      id: d.id,
      name: d.name,
      short: d.short,
      rows,
      headline: `${a.name} top the ${d.short} league phase`,
      ...leaders,
    };
  });
}

export function otherLeagueBlurb(state: SaveData): string {
  const boards = otherLeagueBoards(state);
  const euro = euroBoards(state)[0];
  const top = boards[0];
  if (euro) return `${euro.headline}. ${top?.headline ?? ""}`.trim();
  if (!top) return "Other divisions are quiet this week.";
  return top.headline;
}
