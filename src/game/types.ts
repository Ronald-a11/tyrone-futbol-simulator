export type Position =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LW"
  | "RW"
  | "ST";

export type Philosophy = "possession" | "press" | "counter" | "direct" | "youth";
export type Mentality = "defend" | "balanced" | "attack";
export type FormationId =
  | "4-3-3"
  | "4-2-3-1"
  | "4-4-2"
  | "3-5-2"
  | "5-3-2"
  | "3-4-3"
  | "3-4-2-1"
  | "4-2-2-2"
  | "4-3-1-2"
  | "4-1-4-1"
  | "3-2-4-1"
  | "5-4-1"
  | "4-4-1-1";
export type StandId = "west" | "east" | "north" | "south";
export type Stands = Record<StandId, number>;
export type LineHeight = "deep" | "standard" | "high";
export type BuildUp = "short" | "mixed" | "direct";
export type TrainingFocus = "attack" | "defense" | "fitness" | "technical" | "youth";
export type Screen =
  | "dash"
  | "finances"
  | "budget"
  | "fans"
  | "stadium"
  | "facilities"
  | "pitch"
  | "super"
  | "squad"
  | "fixtures"
  | "table"
  | "world"
  | "manager"
  | "managersPool"
  | "youth"
  | "training"
  | "trophies"
  | "achievements"
  | "records"
  | "career"
  | "market"
  | "squadStats"
  | "squadGoals"
  | "leaders"
  | "chart"
  | "inbox"
  | "settings"
  | "medical"
  | "rivals"
  | "history"
  | "finHistory"
  | "tactics"
  | "clubList"
  | "highscores"
  | "about";

export type BudgetMode = "max" | "normal" | "cautious" | "strict" | "zero";
/** 1 = Premier League … 5 = National League */
export type LeagueTier = 1 | 2 | 3 | 4 | 5;

export type FanMood = "Popular" | "OK" | "Unsure" | "Unpopular";

export type ClubManager = {
  name: string;
  m: number;
  c: number;
  t: number;
  formation: FormationId;
  style: Philosophy;
  wage: number;
  happiness: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  hiredSeason: number;
  hiredWeek: number;
  fanMood?: FanMood;
  compensation?: number;
  avatar?: number;
};

export type MatchFinance = {
  tickets: number;
  boxes: number;
  food: number;
  merch: number;
  tv: number;
  sponsor: number;
  wages: number;
  ground: number;
  academy: number;
  training: number;
  bonus: number;
  result: number;
  interest: number;
  feesIn: number;
  feesOut: number;
  net: number;
};

export type NewsCard =
  | { id: string; kind: "continue"; title: string; body: string; cta?: string }
  | {
      id: string;
      kind: "sponsor";
      title: string;
      body: string;
      options: { name: string; fee: number; untilSeason: number }[];
    }
  | { id: string; kind: "tickets"; title: string; body: string; min: number; max: number; suggested: number }
  | { id: string; kind: "bonus"; title: string; body: string; wages: number; recommended: number }
  | {
      id: string;
      kind: "bid";
      title: string;
      body: string;
      playerId: string;
      fee: number;
      from: string;
      keep: boolean;
    }
  | {
      id: string;
      kind: "contract";
      title: string;
      body: string;
      playerId: string;
      wages: number[];
      years: number[];
      suggestedWage: number;
      suggestedYears: number;
      wageBill: number;
      recommendedBill: number;
    }
  | {
      id: string;
      kind: "weekFinance";
      title: string;
      body?: string;
      finance: MatchFinance;
    };

export type Outlets = {
  burger: number;
  counter: number;
  cafe: number;
  merch: number;
};

export type Achievement = { id: string; earnedAt: string };
export type Trophy = { id: string; season: number; label: string };
export type ClubRecords = {
  biggestCrowd: number;
  biggestCrowdLabel: string;
  heaviestDefeat: string;
  heaviestDefeatLabel: string;
  longestManagerGames: number;
  longestManagerName: string;
};
export type Phase =
  | "title"
  | "create"
  | "hub"
  | "press"
  | "match"
  | "report"
  | "season"
  | "sacked"
  | "negotiate";
export type PressTone = "bold" | "measured" | "deflect";
export type CupStage = "r16" | "qf" | "sf" | "final" | null;

export type MatchScene = {
  minute: number;
  kind:
    | "build"
    | "cross"
    | "shot"
    | "goal"
    | "save"
    | "miss"
    | "tackle"
    | "card"
    | "foul"
    | "offside"
    | "corner"
    | "penalty"
    | "freekick"
    | "throwin"
    | "kickoff"
    | "goalkick";
  text: string;
  actorId: string;
  mateId?: string;
  keeperId?: string;
  side: "home" | "away";
  freeze: boolean;
  /** How the chance was created — drives set-piece posing on the pitch. */
  via?: "open" | "penalty" | "freekick" | "corner";
  /** Ball starts here and flies toward `LiveMatch.ball` during the kick anim. */
  ballFrom?: { x: number; y: number };
};

export type Playoff = {
  round: "sf" | "final";
  otherId: string;
} | null;

export type Attrs = {
  pace: number;
  shoot: number;
  pass: number;
  dribble: number;
  defense: number;
  physical: number;
  gk: number;
};

export type CompKind = "league" | "cup" | "playoff" | "friendly";

export type CompBucket = {
  goals: number;
  assists: number;
  played: number;
  yellows: number;
  reds: number;
  cleanSheets: number;
};

export type PlayerComp = Record<CompKind, CompBucket>;

export type Player = {
  id: string;
  name: string;
  age: number;
  pos: Position;
  alt: Position[];
  attrs: Attrs;
  pot: number;
  morale: number;
  fitness: number;
  growth: number;
  wage: number;
  contract: number;
  nationality: string;
  injured: number;
  yellows: number;
  reds: number;
  cleanSheets: number;
  banned: number;
  clubId: string;
  loan: "in" | "out" | null;
  /** Listed on the transfer market (awaiting bids) — not sold yet. */
  listed: boolean;
  fee: number;
  played: number;
  goals: number;
  assists: number;
  ratingSum: number;
  ratingN: number;
  /** Season totals split by competition. */
  byComp: PlayerComp;
  /** Career totals (survive season resets). */
  careerGoals: number;
  careerAssists: number;
};

export type Club = {
  id: string;
  name: string;
  short: string;
  city: string;
  primary: string;
  secondary: string;
  stadium: string;
  reputation: number;
  style: Philosophy;
};

export type Facilities = {
  stadium: number;
  training: number;
  academy: number;
  medical: number;
};

export type Staff = { coach: number; scout: number; physio: number };

export type Fixture = {
  id: string;
  competition: "league" | "cup" | "playoff" | "friendly";
  homeId: string;
  awayId: string;
  homeScore: number | null;
  awayScore: number | null;
  attendance?: number | null;
};

export type Week = {
  label: string;
  kind: "league" | "cup" | "playoff" | "friendly";
  cupStage: CupStage;
  fixtures: Fixture[];
};

export type Message = {
  id: string;
  week: number;
  title: string;
  body: string;
  tag: string;
};

export type Scorer = {
  name: string;
  minute: number;
  side: "home" | "away";
  playerId: string;
  assistId?: string;
};

export type LogLine = {
  minute: number;
  text: string;
  kind: "goal" | "card" | "chance" | "info" | "sub";
};

export type LiveMatch = {
  seed: number;
  minute: number;
  homeId: string;
  awayId: string;
  competition: "league" | "cup" | "playoff" | "friendly";
  weekLabel: string;
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  shotsH: number;
  shotsA: number;
  onH: number;
  onA: number;
  xgH: number;
  xgA: number;
  possH: number;
  attackSide: "home" | "away";
  homeXi: string[];
  awayXi: string[];
  homeBench: string[];
  awayBench: string[];
  homeForm: FormationId;
  awayForm: FormationId;
  homeMentality: Mentality;
  awayMentality: Mentality;
  stamina: Record<string, number>;
  ratings: Record<string, number>;
  yellow: Record<string, number>;
  off: string[];
  hurt: { id: string; weeks: number }[];
  scorers: Scorer[];
  log: LogLine[];
  ball: { x: number; y: number };
  dots: Record<string, { x: number; y: number }>;
  scene: MatchScene | null;
  finished: boolean;
  subsH: number;
  subsA: number;
  cameOn: Record<string, number>;
  wentOff: Record<string, number>;
  spirit: number;
  pressTone: PressTone;
  paused: boolean;
  speed: 1 | 2 | 3;
  shouts: string[];
  userSide: "home" | "away";
  period: MatchPeriod;
  penHome: number;
  penAway: number;
  penKicks: PenKick[];
  penNext: "home" | "away";
  /** Pre-match / half-time ceremony while the manager runs the side. */
  stage: MatchStage;
  htTalk: string | null;
  htPlan: { offId: string; onId: string; reason: string }[] | null;
  /** Conceding side kicks off after a goal (real restart). */
  restartSide: "home" | "away" | null;
  /** Previous open-play beat — chains build → cross → shot like real attacks. */
  phaseChain: MatchScene["kind"] | null;
  /** Added time at the end of a half (stoppage). */
  addedTime: number;
};

export type MatchStage =
  | "tunnel"
  | "lineups"
  | "tactics"
  | "live"
  | "ht-talk"
  | "ht-changes";

export type Report = {
  homeId: string;
  awayId: string;
  homeScore: number;
  awayScore: number;
  competition: "league" | "cup" | "playoff" | "friendly";
  label: string;
  scorers: Scorer[];
  ratings: { id: string; name: string; pos: Position; rating: number; clubId: string }[];
  motm: string;
  gate: number;
  wages: number;
  sponsor: number;
  broadcast?: number;
  other: { homeId: string; awayId: string; hs: number; as: number }[];
  boardDelta: number;
  fanDelta: number;
  notes: string[];
  xgH: number;
  xgA: number;
  finance?: MatchFinance;
};

export type ManagerTarget = { playerId: string; reason: string };

export type StandJob = { stand: StandId; weeks: number; toTier: number } | null;

export type TableRow = {
  id: string;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  pts: number;
};

export type SeasonReview = {
  pos: number;
  prize: number;
  cup: string;
  move: "up" | "down" | "stay";
  objectiveHit: boolean;
  table: TableRow[];
  tier: LeagueTier;
  awards: string;
};

export type Offer = { playerId: string; fee: number; from: string } | null;

export type DealSpeaker = "chairman" | "manager" | "player" | "agent";

export type DealLine = {
  who: DealSpeaker;
  text: string;
};

export type MarketDeal = {
  playerId: string;
  askFee: number;
  askWage: number;
  offerFee: number;
  offerWage: number;
  round: number;
  script: DealLine[];
  mood: "open" | "tense" | "warm" | "done" | "walked";
  beat: number;
} | null;

export type PenKick = {
  side: "home" | "away";
  scored: boolean;
  name: string;
};

export type MatchPeriod = "regulation" | "et" | "pens";

export type SaveData = {
  version: number;
  seed: number;
  active: boolean;
  phase: Phase;
  screen: Screen;
  managerName: string;
  chairmanName: string;
  userClubId: string;
  tier: LeagueTier;
  nationId: string;
  season: number;
  weekIndex: number;
  cash: number;
  debt: number;
  board: number;
  fans: number;
  fanMgrHappy: number;
  fanChairHappy: number;
  philosophy: Philosophy;
  formation: FormationId;
  mentality: Mentality;
  tempo: number;
  pressing: number;
  width: number;
  line: LineHeight;
  build: BuildUp;
  training: TrainingFocus;
  facilities: Facilities;
  stands: Stands;
  staff: Staff & { assistant?: number };
  sponsorName: string;
  sponsorBoost: number;
  sponsorUntil: number;
  ticketPrice: number;
  winBonusPct: 0 | 10 | 20;
  chairmanAvatar: number;
  kitId: number;
  rivalClubId: string;
  stadiumName: string;
  feesPaid: number;
  feesReceived: number;
  managersHired: number;
  newsQueue: NewsCard[];
  clubs: Club[];
  players: Player[];
  weeks: Week[];
  xi: string[];
  bench: string[];
  inbox: Message[];
  live: LiveMatch | null;
  report: Report | null;
  review: SeasonReview | null;
  playoff: Playoff;
  transferFocus: Position | null;
  targets: ManagerTarget[];
  standJob: StandJob;
  offer: Offer;
  deal: MarketDeal;
  history: { season: number; tier: number; pos: number; pts: number }[];
  userCup: "in" | "out" | "winner";
  objective: string;
  muted: boolean;
  /** Display currency for money in the UI (values stay GBP-based internally). */
  currency: "GBP" | "EUR" | "USD";
  manager: ClubManager;
  managerPool: ClubManager[];
  transferBudgetMode: BudgetMode;
  outlets: Outlets;
  pitchQuality: number;
  superStadium: boolean;
  form: string;
  /** League table position after each completed league week (1 = top). */
  posTrail: number[];
  achievements: Achievement[];
  trophies: Trophy[];
  records: ClubRecords;
  seasonProfit: number;
  /** Transfer window currently open. */
  windowOpen: boolean;
  /** Fees spent across the division this window (user + simulated AI). */
  leagueSpend: number;
};

export type CreateInput = {
  managerName: string;
  clubName: string;
  short: string;
  city: string;
  stadiumName: string;
  primary: string;
  secondary: string;
  philosophy: Philosophy;
  formation: FormationId;
  chairmanAvatar: number;
  kitId: number;
  rivalClubId: string;
  manager: ClubManager;
  nationId: string;
  startTier?: LeagueTier;
};
