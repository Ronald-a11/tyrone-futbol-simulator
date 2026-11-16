import type { Philosophy } from "./types";

/** 1 = Premier League (top) … 5 = National League (start). */
export type LeagueTier = 1 | 2 | 3 | 4 | 5;

export const SAVE_VERSION = 16;

export type NationId = "eng" | "sco" | "wal" | "irl";

export type NationDef = {
  id: NationId;
  name: string;
  blurb: string;
  playable: boolean;
  startTier: LeagueTier;
  currency: "GBP";
};

export const NATIONS: NationDef[] = [
  {
    id: "eng",
    name: "England",
    blurb: "Climb from the National League to the Premier League.",
    playable: true,
    startTier: 5,
    currency: "GBP",
  },
  {
    id: "sco",
    name: "Scotland",
    blurb: "Coming soon — Scottish pyramid.",
    playable: false,
    startTier: 4,
    currency: "GBP",
  },
  {
    id: "wal",
    name: "Wales",
    blurb: "Coming soon — Cymru Premier path.",
    playable: false,
    startTier: 4,
    currency: "GBP",
  },
  {
    id: "irl",
    name: "Ireland",
    blurb: "Coming soon — League of Ireland.",
    playable: false,
    startTier: 4,
    currency: "GBP",
  },
];

export const TIER_META: Record<
  LeagueTier,
  { name: string; blurb: string; short: string }
> = {
  5: { name: "National League", short: "Nat Lge", blurb: "Non-league grind. Crowds are fierce, wages are tight." },
  4: { name: "EFL League Two", short: "Lge Two", blurb: "The first step on the Football League ladder." },
  3: { name: "EFL League One", short: "Lge One", blurb: "Proper crowds, proper pressure." },
  2: { name: "EFL Championship", short: "Champ", blurb: "The toughest second tier in Europe." },
  1: { name: "Premier League", short: "Prem", blurb: "The brass ring of English football." },
};

/** Starting bank when founding a club in that division. */
export const START_BUDGET: Record<LeagueTier, number> = {
  5: 450_000,
  4: 1_200_000,
  3: 3_500_000,
  2: 12_000_000,
  1: 55_000_000,
};

export const START_TICKET: Record<LeagueTier, number> = {
  5: 12,
  4: 16,
  3: 22,
  2: 28,
  1: 45,
};

type Template = {
  id: string;
  name: string;
  short: string;
  city: string;
  primary: string;
  secondary: string;
  stadium: string;
  style: Philosophy;
};

/** English pyramid rivals — aligned to current real divisions (user club fills the 20th place). */
export const TIER_CLUBS: Record<LeagueTier, Template[]> = {
  5: [
    { id: "brx", name: "Barnet", short: "BAR", city: "Barnet", primary: "#1a3a6e", secondary: "#f4f7f5", stadium: "The Hive", style: "direct" },
    { id: "yor", name: "York City", short: "YOR", city: "York", primary: "#c0392b", secondary: "#f4f7f5", stadium: "LNER Community Stadium", style: "press" },
    { id: "old", name: "Oldham Athletic", short: "OLD", city: "Oldham", primary: "#1c4d8c", secondary: "#e7f2ea", stadium: "Boundary Park", style: "counter" },
    { id: "rok", name: "Rochdale", short: "ROC", city: "Rochdale", primary: "#1a3d66", secondary: "#d6b25e", stadium: "Crown Oil Arena", style: "possession" },
    { id: "hal", name: "FC Halifax Town", short: "HAL", city: "Halifax", primary: "#1f4d3a", secondary: "#efe6d2", stadium: "The Shay", style: "youth" },
    { id: "ald", name: "Aldershot Town", short: "ALD", city: "Aldershot", primary: "#c45c1a", secondary: "#142016", stadium: "Recreation Ground", style: "direct" },
    { id: "sou5", name: "Southend United", short: "SOU", city: "Southend", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "Roots Hall", style: "possession" },
    { id: "dag", name: "Dagenham & Redbridge", short: "DAG", city: "Dagenham", primary: "#c0392b", secondary: "#142016", stadium: "Victoria Road", style: "counter" },
    { id: "wee", name: "Wealdstone", short: "WEA", city: "Ruislip", primary: "#1a3d66", secondary: "#f0c020", stadium: "Grosvenor Vale", style: "youth" },
    { id: "sol", name: "Solihull Moors", short: "SOL", city: "Solihull", primary: "#f0c020", secondary: "#142016", stadium: "Damson Park", style: "press" },
    { id: "bos", name: "Boston United", short: "BOS", city: "Boston", primary: "#f0c020", secondary: "#142016", stadium: "Jakemans Community Stadium", style: "direct" },
    { id: "tam", name: "Tamworth", short: "TAM", city: "Tamworth", primary: "#c0392b", secondary: "#f4f7f5", stadium: "The Lamb Ground", style: "counter" },
    { id: "ebs", name: "Eastleigh", short: "EAS", city: "Eastleigh", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "Silverlake Stadium", style: "possession" },
    { id: "gat", name: "Gateshead", short: "GAT", city: "Gateshead", primary: "#142016", secondary: "#f4f7f5", stadium: "Gateshead International Stadium", style: "press" },
  ],
  4: [
    { id: "don", name: "Doncaster Rovers", short: "DON", city: "Doncaster", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Eco-Power Stadium", style: "counter" },
    { id: "por4", name: "Port Vale", short: "PVA", city: "Stoke", primary: "#142016", secondary: "#f4f7f5", stadium: "Vale Park", style: "direct" },
    { id: "bra", name: "Bradford City", short: "BRA", city: "Bradford", primary: "#c45c1a", secondary: "#3a2a14", stadium: "Valley Parade", style: "press" },
    { id: "wim", name: "AFC Wimbledon", short: "WIM", city: "Wimbledon", primary: "#1f5a2e", secondary: "#efe6d2", stadium: "Plough Lane", style: "counter" },
    { id: "not", name: "Notts County", short: "NCO", city: "Nottingham", primary: "#142016", secondary: "#f4f7f5", stadium: "Meadow Lane", style: "direct" },
    { id: "cre", name: "Crewe Alexandra", short: "CRE", city: "Crewe", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Gresty Road", style: "youth" },
    { id: "gri", name: "Grimsby Town", short: "GRI", city: "Grimsby", primary: "#142016", secondary: "#f4f7f5", stadium: "Blundell Park", style: "direct" },
    { id: "sal", name: "Salford City", short: "SAL", city: "Salford", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Peninsula Stadium", style: "possession" },
    { id: "che4", name: "Chesterfield", short: "CHF", city: "Chesterfield", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "SMH Group Stadium", style: "press" },
    { id: "mkd", name: "MK Dons", short: "MKD", city: "Milton Keynes", primary: "#f4f7f5", secondary: "#c0392b", stadium: "Stadium MK", style: "possession" },
    { id: "swi", name: "Swindon Town", short: "SWI", city: "Swindon", primary: "#c0392b", secondary: "#f4f7f5", stadium: "County Ground", style: "youth" },
    { id: "man", name: "Mansfield Town", short: "MAN", city: "Mansfield", primary: "#f0c020", secondary: "#142016", stadium: "Field Mill", style: "counter" },
    { id: "col", name: "Colchester United", short: "COL", city: "Colchester", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "JobServe Community Stadium", style: "direct" },
    { id: "har", name: "Harrogate Town", short: "HAR", city: "Harrogate", primary: "#f0c020", secondary: "#142016", stadium: "Wetherby Road", style: "press" },
  ],
  3: [
    { id: "bir", name: "Birmingham City", short: "BIR", city: "Birmingham", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "St Andrew's", style: "press" },
    { id: "wre", name: "Wrexham", short: "WRX", city: "Wrexham", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Racecourse Ground", style: "press" },
    { id: "stk", name: "Stockport County", short: "STK", city: "Stockport", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "Edgeley Park", style: "possession" },
    { id: "hud", name: "Huddersfield Town", short: "HUD", city: "Huddersfield", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "John Smith's Stadium", style: "counter" },
    { id: "bol", name: "Bolton Wanderers", short: "BOL", city: "Bolton", primary: "#f4f7f5", secondary: "#1a3d66", stadium: "Toughsheet Community Stadium", style: "possession" },
    { id: "cha", name: "Charlton Athletic", short: "CHA", city: "Charlton", primary: "#c0392b", secondary: "#f4f7f5", stadium: "The Valley", style: "counter" },
    { id: "ley", name: "Leyton Orient", short: "LEY", city: "Leyton", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Brisbane Road", style: "press" },
    { id: "rea", name: "Reading", short: "REA", city: "Reading", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "Select Car Leasing Stadium", style: "possession" },
    { id: "bla", name: "Blackpool", short: "BFC", city: "Blackpool", primary: "#c45c1a", secondary: "#f4f7f5", stadium: "Bloomfield Road", style: "youth" },
    { id: "pet", name: "Peterborough United", short: "PET", city: "Peterborough", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "Weston Homes Stadium", style: "press" },
    { id: "bar", name: "Barnsley", short: "BAR", city: "Barnsley", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Oakwell", style: "direct" },
    { id: "lin", name: "Lincoln City", short: "LIN", city: "Lincoln", primary: "#c0392b", secondary: "#f4f7f5", stadium: "LNER Stadium", style: "counter" },
    { id: "exe", name: "Exeter City", short: "EXE", city: "Exeter", primary: "#c0392b", secondary: "#f4f7f5", stadium: "St James Park", style: "youth" },
    { id: "ste", name: "Stevenage", short: "STE", city: "Stevenage", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Lamex Stadium", style: "direct" },
  ],
  2: [
    { id: "lee", name: "Leeds United", short: "LEE", city: "Leeds", primary: "#f4f7f5", secondary: "#142016", stadium: "Elland Road", style: "press" },
    { id: "bur", name: "Burnley", short: "BUR", city: "Burnley", primary: "#6b1f3a", secondary: "#d6b25e", stadium: "Turf Moor", style: "direct" },
    { id: "she", name: "Sheffield United", short: "SHU", city: "Sheffield", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Bramall Lane", style: "press" },
    { id: "sun", name: "Sunderland", short: "SUN", city: "Sunderland", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Stadium of Light", style: "counter" },
    { id: "cov", name: "Coventry City", short: "COV", city: "Coventry", primary: "#1a6bb5", secondary: "#f4f7f5", stadium: "Coventry Building Society Arena", style: "press" },
    { id: "mid", name: "Middlesbrough", short: "MID", city: "Middlesbrough", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Riverside", style: "counter" },
    { id: "wes", name: "West Bromwich Albion", short: "WBA", city: "West Bromwich", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "The Hawthorns", style: "possession" },
    { id: "nor", name: "Norwich City", short: "NOR", city: "Norwich", primary: "#f0c020", secondary: "#1f5a2e", stadium: "Carrow Road", style: "youth" },
    { id: "wat", name: "Watford", short: "WAT", city: "Watford", primary: "#f0c020", secondary: "#c0392b", stadium: "Vicarage Road", style: "direct" },
    { id: "hul", name: "Hull City", short: "HUL", city: "Hull", primary: "#c45c1a", secondary: "#142016", stadium: "MKM Stadium", style: "direct" },
    { id: "bri", name: "Bristol City", short: "BRI", city: "Bristol", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Ashton Gate", style: "possession" },
    { id: "swa", name: "Swansea City", short: "SWA", city: "Swansea", primary: "#f4f7f5", secondary: "#142016", stadium: "Swansea.com Stadium", style: "possession" },
    { id: "qpr", name: "Queens Park Rangers", short: "QPR", city: "London", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "Loftus Road", style: "press" },
    { id: "mil", name: "Millwall", short: "MIL", city: "London", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "The Den", style: "direct" },
  ],
  1: [
    { id: "liv", name: "Liverpool", short: "LIV", city: "Liverpool", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Anfield", style: "press" },
    { id: "ars", name: "Arsenal", short: "ARS", city: "London", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Emirates Stadium", style: "possession" },
    { id: "mci", name: "Manchester City", short: "MCI", city: "Manchester", primary: "#6bb6ff", secondary: "#f4f7f5", stadium: "Etihad Stadium", style: "possession" },
    { id: "che", name: "Chelsea", short: "CHE", city: "London", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "Stamford Bridge", style: "possession" },
    { id: "new", name: "Newcastle United", short: "NEW", city: "Newcastle", primary: "#142016", secondary: "#f4f7f5", stadium: "St James' Park", style: "direct" },
    { id: "ast", name: "Aston Villa", short: "AVL", city: "Birmingham", primary: "#6b2d8b", secondary: "#c9a227", stadium: "Villa Park", style: "possession" },
    { id: "not1", name: "Nottingham Forest", short: "NFO", city: "Nottingham", primary: "#c0392b", secondary: "#f4f7f5", stadium: "City Ground", style: "counter" },
    { id: "bha", name: "Brighton & Hove Albion", short: "BHA", city: "Brighton", primary: "#1a4d8c", secondary: "#f4f7f5", stadium: "American Express Stadium", style: "youth" },
    { id: "bou", name: "AFC Bournemouth", short: "BOU", city: "Bournemouth", primary: "#c0392b", secondary: "#142016", stadium: "Vitality Stadium", style: "press" },
    { id: "ful", name: "Fulham", short: "FUL", city: "London", primary: "#f4f7f5", secondary: "#142016", stadium: "Craven Cottage", style: "press" },
    { id: "bre", name: "Brentford", short: "BRE", city: "London", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Gtech Community Stadium", style: "counter" },
    { id: "cry", name: "Crystal Palace", short: "CRY", city: "London", primary: "#1a3d66", secondary: "#c0392b", stadium: "Selhurst Park", style: "counter" },
    { id: "eve", name: "Everton", short: "EVE", city: "Liverpool", primary: "#003399", secondary: "#f4f7f5", stadium: "Goodison Park", style: "direct" },
    { id: "whu", name: "West Ham United", short: "WHU", city: "London", primary: "#6b1f3a", secondary: "#d6b25e", stadium: "London Stadium", style: "counter" },
    { id: "tot", name: "Tottenham Hotspur", short: "TOT", city: "London", primary: "#f4f7f5", secondary: "#142016", stadium: "Tottenham Hotspur Stadium", style: "press" },
    { id: "mun", name: "Manchester United", short: "MUN", city: "Manchester", primary: "#c0392b", secondary: "#f4f7f5", stadium: "Old Trafford", style: "counter" },
    { id: "wol", name: "Wolverhampton Wanderers", short: "WOL", city: "Wolverhampton", primary: "#f0c020", secondary: "#142016", stadium: "Molineux", style: "possession" },
    { id: "ips", name: "Ipswich Town", short: "IPS", city: "Ipswich", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "Portman Road", style: "youth" },
    { id: "lei", name: "Leicester City", short: "LEI", city: "Leicester", primary: "#1a3d66", secondary: "#f4f7f5", stadium: "King Power Stadium", style: "counter" },
  ],
};

export const TIER_REPS: Record<LeagueTier, number[]> = {
  5: [58, 55, 52, 50, 48, 46, 44, 42, 40, 38, 36],
  4: [66, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46],
  3: [74, 72, 70, 68, 66, 64, 62, 60, 58, 56, 54],
  2: [82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62],
  1: [94, 92, 90, 88, 86, 84, 82, 80, 78, 76, 74],
};

export const PRIZE: Record<LeagueTier, number[]> = {
  5: [180000, 120000, 80000, 50000, 30000, 18000, 10000, 6000, 4000, 2500, 1500, 1000],
  4: [420000, 280000, 180000, 120000, 70000, 40000, 22000, 12000, 8000, 5000, 3000, 2000],
  3: [980000, 640000, 420000, 260000, 160000, 90000, 50000, 28000, 16000, 10000, 6000, 4000],
  2: [2800000, 1800000, 1200000, 780000, 480000, 280000, 140000, 80000, 50000, 30000, 18000, 10000],
  1: [12000000, 8000000, 5200000, 3400000, 2200000, 1400000, 800000, 400000, 250000, 150000, 100000, 60000],
};

export const CUP_PRIZE: Record<LeagueTier, number> = {
  5: 80000,
  4: 180000,
  3: 420000,
  2: 900000,
  1: 2200000,
};

/** Extra cash for winning the promotion play-off final. */
export const PLAYOFF_PRIZE: Record<LeagueTier, number> = {
  5: 120000,
  4: 250000,
  3: 480000,
  2: 1_100_000,
  1: 0,
};

/** Match win / draw prize money (on top of gate). */
export function matchWinPrize(tier: LeagueTier, competition: "league" | "cup" | "playoff" | "friendly") {
  const league = tier === 1 ? 85_000 : tier === 2 ? 42_000 : tier === 3 ? 22_000 : tier === 4 ? 12_000 : 6_000;
  if (competition === "friendly") return Math.round(league * 0.25);
  if (competition === "cup") return Math.round(league * 1.35);
  if (competition === "playoff") return Math.round(league * 1.8);
  return league;
}

export function matchDrawPrize(tier: LeagueTier, competition: "league" | "cup" | "playoff" | "friendly") {
  if (competition === "friendly") return 0;
  return Math.round(matchWinPrize(tier, competition) * 0.35);
}

/** Summer + January transfer windows by calendar week index. */
export function transferWindowOpen(weekIndex: number) {
  if (weekIndex <= 5) return true;
  if (weekIndex >= 11 && weekIndex <= 13) return true;
  return false;
}

export function objectiveText(tier: LeagueTier) {
  if (tier === 5) return "Win the National League, or reach the play-offs from 2nd to 5th.";
  if (tier === 4) return "Finish in League Two top three, or reach the 4th–7th play-offs.";
  if (tier === 3) return "Finish in League One top two, or reach the 3rd–6th play-offs.";
  if (tier === 2) return "Finish in the Championship top two, or reach the 3rd–6th play-offs.";
  return "Finish in the Premier League top four.";
}

export function objectiveHit(tier: LeagueTier, pos: number) {
  if (tier === 5) return pos <= 5;
  if (tier === 4) return pos <= 7;
  if (tier === 3) return pos <= 6;
  if (tier === 2) return pos <= 6;
  return pos <= 4;
}

/** Automatic promotion places. One more place is the play-off. */
export function autoPromo(tier: LeagueTier) {
  if (tier === 5) return 1;
  if (tier === 4) return 3;
  if (tier === 3 || tier === 2) return 2;
  return 0;
}

/** Inclusive league places that enter a four-team play-off. */
export function playoffBand(tier: LeagueTier): [number, number] | null {
  if (tier === 5) return [2, 5];
  if (tier === 4) return [4, 7];
  if (tier === 3 || tier === 2) return [3, 6];
  return null;
}

export function wageBand(tier: LeagueTier) {
  if (tier === 5) return { min: 450, max: 2_800 };
  if (tier === 4) return { min: 900, max: 6_000 };
  if (tier === 3) return { min: 1_800, max: 14_000 };
  if (tier === 2) return { min: 5_000, max: 45_000 };
  return { min: 15_000, max: 180_000 };
}

export function feeScale(tier: LeagueTier) {
  if (tier === 5) return 0.28;
  if (tier === 4) return 0.48;
  if (tier === 3) return 0.75;
  if (tier === 2) return 1.05;
  return 1.7;
}

export function repsFor(tier: LeagueTier, count: number) {
  const seed = TIER_REPS[tier];
  const floor = seed[seed.length - 1] ?? 40;
  return Array.from({ length: count }, (_, i) => seed[i] ?? Math.max(32, floor - (i - seed.length + 1) * 2));
}

const EXTRA_CLUBS: { city: string; name: string; primary: string }[] = [
  { city: "Accrington", name: "Accrington Stanley", primary: "#c0392b" },
  { city: "Barrow", name: "Barrow", primary: "#1a3d66" },
  { city: "Bromley", name: "Bromley", primary: "#f4f7f5" },
  { city: "Cambridge", name: "Cambridge United", primary: "#c45c1a" },
  { city: "Carlisle", name: "Carlisle United", primary: "#1a3d66" },
  { city: "Cheltenham", name: "Cheltenham Town", primary: "#c0392b" },
  { city: "Colchester", name: "Colchester United", primary: "#1a4d8c" },
  { city: "Exeter", name: "Exeter City", primary: "#c0392b" },
  { city: "Fleetwood", name: "Fleetwood Town", primary: "#c0392b" },
  { city: "Gillingham", name: "Gillingham", primary: "#1a3d66" },
  { city: "Harrogate", name: "Harrogate Town", primary: "#f0c020" },
  { city: "Lincoln", name: "Lincoln City", primary: "#c0392b" },
  { city: "Morecambe", name: "Morecambe", primary: "#c0392b" },
  { city: "Newport", name: "Newport County", primary: "#c45c1a" },
  { city: "Northampton", name: "Northampton Town", primary: "#6b1f3a" },
  { city: "Shrewsbury", name: "Shrewsbury Town", primary: "#1a3d66" },
  { city: "Stevenage", name: "Stevenage", primary: "#c0392b" },
  { city: "Sutton", name: "Sutton United", primary: "#c45c1a" },
  { city: "Tranmere", name: "Tranmere Rovers", primary: "#f4f7f5" },
  { city: "Walsall", name: "Walsall", primary: "#c0392b" },
  { city: "Bristol", name: "Bristol Rovers", primary: "#1a3d66" },
  { city: "Burton", name: "Burton Albion", primary: "#f0c020" },
  { city: "Crawley", name: "Crawley Town", primary: "#c0392b" },
  { city: "Huddersfield", name: "Huddersfield Town", primary: "#1a4d8c" },
  { city: "Millwall", name: "Millwall", primary: "#142016" },
  { city: "Plymouth", name: "Plymouth Argyle", primary: "#1f5a2e" },
  { city: "Preston", name: "Preston North End", primary: "#f4f7f5" },
  { city: "QPR", name: "Queens Park Rangers", primary: "#1a4d8c" },
  { city: "Stoke", name: "Stoke City", primary: "#c0392b" },
  { city: "Swansea", name: "Swansea City", primary: "#f4f7f5" },
  { city: "Burnley", name: "Burnley", primary: "#6b1f3a" },
  { city: "Wolverhampton", name: "Wolverhampton", primary: "#f0c020" },
  { city: "Everton", name: "Everton", primary: "#1a3d66" },
  { city: "Brentford", name: "Brentford", primary: "#c0392b" },
  { city: "Bournemouth", name: "Bournemouth", primary: "#c0392b" },
  { city: "Crystal Palace", name: "Crystal Palace", primary: "#1a3d66" },
];

const STYLES: Philosophy[] = ["possession", "press", "counter", "direct", "youth"];

/** 19 simulated rivals so the user makes a 20-club division. */
export function clubsFor(tier: LeagueTier): Template[] {
  const out: Template[] = TIER_CLUBS[tier].map((c) => ({ ...c }));
  const usedCity = new Set(out.map((c) => c.city));
  const usedId = new Set(out.map((c) => c.id));
  let n = 0;
  while (out.length < 19 && n < EXTRA_CLUBS.length * 2) {
    const src = EXTRA_CLUBS[(tier * 5 + n) % EXTRA_CLUBS.length]!;
    n += 1;
    if (usedCity.has(src.city)) continue;
    const id = `g${tier}${out.length}`;
    if (usedId.has(id)) continue;
    usedCity.add(src.city);
    usedId.add(id);
    const shortBase = src.name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
    const short = out.some((c) => c.short === shortBase) ? `G${out.length}`.slice(0, 3) : shortBase.padEnd(3, "X");
    out.push({
      id,
      name: src.name,
      short: short.length === 3 ? short : `${short}X`.slice(0, 3),
      city: src.city,
      primary: src.primary,
      secondary: src.primary === "#f4f7f5" ? "#142016" : "#f4f7f5",
      stadium: `${src.city} Ground`,
      style: STYLES[out.length % STYLES.length] ?? "direct",
    });
  }
  return out.slice(0, 19);
}

export function promoSlots(tier: LeagueTier) {
  if (tier === 5) return 2;
  if (tier === 4) return 3;
  if (tier === 3) return 2;
  if (tier === 2) return 2;
  return 0;
}

export function relegSlots(tier: LeagueTier) {
  if (tier === 1) return 3;
  if (tier === 2) return 3;
  if (tier === 3) return 3;
  if (tier === 4) return 2;
  return 0;
}

export function debtLimit(tier: LeagueTier) {
  return tier === 1 ? 40_000_000 : tier === 2 ? 12_000_000 : tier === 3 ? 4_000_000 : tier === 4 ? 1_800_000 : 600_000;
}

export function ticketBand(tier: LeagueTier) {
  const mid = START_TICKET[tier];
  return { min: Math.max(4, mid - 6), max: mid + 12, suggested: mid };
}

export function ticketPrice(tier: LeagueTier) {
  return START_TICKET[tier];
}

export function boxPrice(tier: LeagueTier) {
  return tier === 1 ? 220 : tier === 2 ? 120 : tier === 3 ? 75 : tier === 4 ? 48 : 32;
}

/** British / Irish name pools for English pyramid squads. */
export const ENG_FIRST = [
  "James", "Harry", "Jack", "Oliver", "George", "Charlie", "Thomas", "Jacob", "Noah", "Leo",
  "Arthur", "Freddie", "Alfie", "Oscar", "Henry", "Archie", "Theo", "Finley", "Luca", "Jude",
  "Reece", "Callum", "Mason", "Harvey", "Jamie", "Connor", "Kyle", "Nathan", "Jordan", "Aaron",
  "Marcus", "Jayden", "Kai", "Roman", "Ezra", "Miles", "Owen", "Riley", "Ellis", "Dylan",
  "Isaac", "Adam", "Ben", "Sam", "Joe", "Max", "Alex", "Daniel", "Matthew", "Luke",
  "Aisha", "Chloe", // unused for now — keep male squad sim
];

export const ENG_LAST = [
  "Smith", "Jones", "Williams", "Taylor", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts",
  "Johnson", "Lewis", "Walker", "Robinson", "Wood", "Thompson", "White", "Watson", "Jackson", "Wright",
  "Green", "Harris", "Cooper", "King", "Lee", "Martin", "Clarke", "James", "Morgan", "Hughes",
  "Edwards", "Hill", "Moore", "Clark", "Harrison", "Scott", "Young", "Morris", "Hall", "Ward",
  "Turner", "Carter", "Phillips", "Mitchell", "Parker", "Collins", "Bell", "Baker", "Edwards", "Murphy",
  "Patel", "Khan", "Ali", "Singh", "Ahmed", "Okonkwo", "Mensah", "Diallo", "Nkunku", "Silva",
];

export const ENG_NATIONS = [
  "England", "England", "England", "England", "England", "England",
  "Scotland", "Wales", "Ireland", "Northern Ireland",
  "France", "Portugal", "Brazil", "Nigeria", "Jamaica", "Netherlands",
];
