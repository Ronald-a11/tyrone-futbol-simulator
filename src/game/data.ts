import type { BuildUp, FormationId, LineHeight, Philosophy, Position, SaveData, StandId, Stands, TrainingFocus } from "./types";

export type Slot = { pos: Position; x: number; y: number };

export const FORMATIONS: Record<FormationId, Slot[]> = {
  "4-3-3": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "CM", x: 44, y: 28 },
    { pos: "CDM", x: 40, y: 50 },
    { pos: "CM", x: 44, y: 72 },
    { pos: "LW", x: 70, y: 18 },
    { pos: "ST", x: 76, y: 50 },
    { pos: "RW", x: 70, y: 82 },
  ],
  "4-2-3-1": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "CDM", x: 40, y: 32 },
    { pos: "CDM", x: 40, y: 68 },
    { pos: "LW", x: 62, y: 16 },
    { pos: "CAM", x: 64, y: 50 },
    { pos: "RW", x: 62, y: 84 },
    { pos: "ST", x: 78, y: 50 },
  ],
  "4-4-2": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "LW", x: 50, y: 14 },
    { pos: "CM", x: 46, y: 38 },
    { pos: "CM", x: 46, y: 62 },
    { pos: "RW", x: 50, y: 86 },
    { pos: "ST", x: 74, y: 38 },
    { pos: "ST", x: 74, y: 62 },
  ],
  "3-5-2": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "CB", x: 22, y: 26 },
    { pos: "CB", x: 18, y: 50 },
    { pos: "CB", x: 22, y: 74 },
    { pos: "LB", x: 46, y: 12 },
    { pos: "CM", x: 44, y: 32 },
    { pos: "CDM", x: 40, y: 50 },
    { pos: "CM", x: 44, y: 68 },
    { pos: "RB", x: 46, y: 88 },
    { pos: "ST", x: 74, y: 38 },
    { pos: "ST", x: 74, y: 62 },
  ],
  "5-3-2": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 34, y: 12 },
    { pos: "CB", x: 22, y: 30 },
    { pos: "CB", x: 18, y: 50 },
    { pos: "CB", x: 22, y: 70 },
    { pos: "RB", x: 34, y: 88 },
    { pos: "CM", x: 48, y: 30 },
    { pos: "CDM", x: 44, y: 50 },
    { pos: "CM", x: 48, y: 70 },
    { pos: "ST", x: 74, y: 38 },
    { pos: "ST", x: 74, y: 62 },
  ],
  "3-4-3": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "CB", x: 20, y: 30 },
    { pos: "CB", x: 18, y: 50 },
    { pos: "CB", x: 20, y: 70 },
    { pos: "LB", x: 48, y: 10 },
    { pos: "CM", x: 42, y: 38 },
    { pos: "CM", x: 42, y: 62 },
    { pos: "RB", x: 48, y: 90 },
    { pos: "LW", x: 70, y: 18 },
    { pos: "ST", x: 76, y: 50 },
    { pos: "RW", x: 70, y: 82 },
  ],
  "3-4-2-1": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "CB", x: 20, y: 30 },
    { pos: "CB", x: 18, y: 50 },
    { pos: "CB", x: 20, y: 70 },
    { pos: "LB", x: 46, y: 10 },
    { pos: "CM", x: 40, y: 36 },
    { pos: "CM", x: 40, y: 64 },
    { pos: "RB", x: 46, y: 90 },
    { pos: "CAM", x: 62, y: 34 },
    { pos: "CAM", x: 62, y: 66 },
    { pos: "ST", x: 78, y: 50 },
  ],
  "4-2-2-2": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "CDM", x: 40, y: 36 },
    { pos: "CDM", x: 40, y: 64 },
    { pos: "CAM", x: 60, y: 36 },
    { pos: "CAM", x: 60, y: 64 },
    { pos: "ST", x: 76, y: 38 },
    { pos: "ST", x: 76, y: 62 },
  ],
  "4-3-1-2": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "CDM", x: 36, y: 50 },
    { pos: "CM", x: 50, y: 28 },
    { pos: "CM", x: 50, y: 72 },
    { pos: "CAM", x: 64, y: 50 },
    { pos: "ST", x: 76, y: 38 },
    { pos: "ST", x: 76, y: 62 },
  ],
  "4-1-4-1": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "CDM", x: 38, y: 50 },
    { pos: "LW", x: 56, y: 14 },
    { pos: "CM", x: 52, y: 38 },
    { pos: "CM", x: 52, y: 62 },
    { pos: "RW", x: 56, y: 86 },
    { pos: "ST", x: 76, y: 50 },
  ],
  "3-2-4-1": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "CB", x: 18, y: 28 },
    { pos: "CB", x: 16, y: 50 },
    { pos: "CB", x: 18, y: 72 },
    { pos: "CDM", x: 36, y: 38 },
    { pos: "CDM", x: 36, y: 62 },
    { pos: "LW", x: 64, y: 12 },
    { pos: "CM", x: 58, y: 36 },
    { pos: "CM", x: 58, y: 64 },
    { pos: "RW", x: 64, y: 88 },
    { pos: "ST", x: 78, y: 50 },
  ],
  "5-4-1": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 32, y: 12 },
    { pos: "CB", x: 20, y: 30 },
    { pos: "CB", x: 16, y: 50 },
    { pos: "CB", x: 20, y: 70 },
    { pos: "RB", x: 32, y: 88 },
    { pos: "LW", x: 50, y: 16 },
    { pos: "CM", x: 46, y: 38 },
    { pos: "CM", x: 46, y: 62 },
    { pos: "RW", x: 50, y: 84 },
    { pos: "ST", x: 74, y: 50 },
  ],
  "4-4-1-1": [
    { pos: "GK", x: 8, y: 50 },
    { pos: "LB", x: 24, y: 14 },
    { pos: "CB", x: 20, y: 37 },
    { pos: "CB", x: 20, y: 63 },
    { pos: "RB", x: 24, y: 86 },
    { pos: "LW", x: 48, y: 14 },
    { pos: "CM", x: 44, y: 38 },
    { pos: "CM", x: 44, y: 62 },
    { pos: "RW", x: 48, y: 86 },
    { pos: "CAM", x: 64, y: 50 },
    { pos: "ST", x: 78, y: 50 },
  ],
};

export const FORMATION_IDS = Object.keys(FORMATIONS) as FormationId[];

export const CLASSIC: FormationId[] = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "5-3-2"];
export const ADVANCED: FormationId[] = ["3-4-3", "3-4-2-1", "4-2-2-2", "4-3-1-2", "4-1-4-1", "3-2-4-1", "5-4-1", "4-4-1-1"];

export type ShapeProfile = {
  id: FormationId;
  group: "classic" | "advanced";
  name: string;
  idea: string;
  control: number;
  block: number;
  threat: number;
  widthBias: number;
  press: number;
  counter: number;
};

export const SHAPES: Record<FormationId, ShapeProfile> = {
  "4-3-3": {
    id: "4-3-3",
    group: "classic",
    name: "Single pivot",
    idea: "One 6, two 8s, a front three. The shape almost everyone starts from.",
    control: 1,
    block: 0,
    threat: 1,
    widthBias: 1,
    press: 1,
    counter: 0,
  },
  "4-2-3-1": {
    id: "4-2-3-1",
    group: "classic",
    name: "Double pivot",
    idea: "Two 6s under a 10. Safer when you lose it than a lone pivot.",
    control: 1,
    block: 1,
    threat: 1,
    widthBias: 1,
    press: 0,
    counter: 0,
  },
  "4-4-2": {
    id: "4-4-2",
    group: "classic",
    name: "Two banks",
    idea: "Wide and plain. Still the shape that punishes a slow centre-half.",
    control: 0,
    block: 1,
    threat: 0,
    widthBias: 2,
    press: 0,
    counter: 1,
  },
  "3-5-2": {
    id: "3-5-2",
    group: "classic",
    name: "Wing-backs",
    idea: "Three centre-backs. Width comes from the wing-backs, not wingers.",
    control: 1,
    block: 1,
    threat: 0,
    widthBias: 1,
    press: 0,
    counter: 0,
  },
  "5-3-2": {
    id: "5-3-2",
    group: "classic",
    name: "Back five",
    idea: "The wing-backs stay home. A block first, a break if you win it.",
    control: -1,
    block: 2,
    threat: -1,
    widthBias: 0,
    press: -1,
    counter: 1,
  },
  "3-4-3": {
    id: "3-4-3",
    group: "advanced",
    name: "Pressing back three",
    idea: "Wing-backs join the front three. The high-press shape. Legs go.",
    control: 0,
    block: 0,
    threat: 2,
    widthBias: 2,
    press: 2,
    counter: 0,
  },
  "3-4-2-1": {
    id: "3-4-2-1",
    group: "advanced",
    name: "Two tens",
    idea: "Conte's 3-4-2-1. Two 10s between the lines, one 9, wing-backs for width.",
    control: 1,
    block: 1,
    threat: 1,
    widthBias: 1,
    press: 1,
    counter: 0,
  },
  "4-2-2-2": {
    id: "4-2-2-2",
    group: "advanced",
    name: "The box",
    idea: "Two 6s, two 10s, two 9s. Alonso's Leverkusen. Narrow. They will attack your full-backs.",
    control: 2,
    block: 0,
    threat: 1,
    widthBias: -2,
    press: 1,
    counter: 0,
  },
  "4-3-1-2": {
    id: "4-3-1-2",
    group: "advanced",
    name: "Diamond",
    idea: "A 10 at the tip and no wingers. Your full-backs are the width, or you have none.",
    control: 1,
    block: 0,
    threat: 1,
    widthBias: -2,
    press: 0,
    counter: 0,
  },
  "4-1-4-1": {
    id: "4-1-4-1",
    group: "advanced",
    name: "Flat four",
    idea: "One pivot, a line of four, a lone 9. Compact. The 6 cannot go missing.",
    control: 1,
    block: 1,
    threat: -1,
    widthBias: 1,
    press: 0,
    counter: 0,
  },
  "3-2-4-1": {
    id: "3-2-4-1",
    group: "advanced",
    name: "Rest defence",
    idea: "Pep's in-possession shape as a starting XI. Three centre-backs, two pivots, four players already high.",
    control: 2,
    block: -1,
    threat: 2,
    widthBias: 1,
    press: 1,
    counter: -1,
  },
  "5-4-1": {
    id: "5-4-1",
    group: "advanced",
    name: "Low block",
    idea: "Four across the middle and one outlet. For the week they are simply better.",
    control: -1,
    block: 2,
    threat: -2,
    widthBias: 0,
    press: -1,
    counter: 2,
  },
  "4-4-1-1": {
    id: "4-4-1-1",
    group: "advanced",
    name: "Second striker",
    idea: "A 10 pushed up behind the 9. The old way to crowd the opponent's pivot.",
    control: 0,
    block: 1,
    threat: 1,
    widthBias: 1,
    press: 1,
    counter: 1,
  },
};

export function shapeTags(shape: ShapeProfile) {
  const tags: string[] = [];
  if (shape.widthBias >= 2) tags.push("Very wide");
  else if (shape.widthBias >= 1) tags.push("Wide");
  else if (shape.widthBias <= -2) tags.push("Narrow");
  if (shape.press >= 2) tags.push("Heavy press");
  else if (shape.press >= 1) tags.push("Presses");
  if (shape.block >= 2) tags.push("Low block");
  else if (shape.block >= 1) tags.push("Solid");
  else if (shape.block <= -1) tags.push("Open behind");
  if (shape.control >= 2) tags.push("Keeps the ball");
  else if (shape.control >= 1) tags.push("Midfield control");
  if (shape.threat >= 2) tags.push("Overloads the box");
  if (shape.counter >= 2) tags.push("Hits on the break");
  else if (shape.counter >= 1) tags.push("Can counter");
  return tags.slice(0, 3);
}

export type Orders = {
  tempo: number;
  pressing: number;
  width: number;
  line: LineHeight;
  build: BuildUp;
};

export function ordersForStyle(style: Philosophy): Orders {
  if (style === "press") return { tempo: 4, pressing: 5, width: 4, line: "high", build: "mixed" };
  if (style === "possession") return { tempo: 3, pressing: 3, width: 3, line: "high", build: "short" };
  if (style === "counter") return { tempo: 4, pressing: 2, width: 3, line: "deep", build: "direct" };
  if (style === "direct") return { tempo: 3, pressing: 2, width: 4, line: "standard", build: "direct" };
  return { tempo: 3, pressing: 3, width: 3, line: "standard", build: "mixed" };
}

export function tacticMods(form: FormationId, orders: Orders, pressed: boolean) {
  const shape = SHAPES[form] ?? SHAPES["4-3-3"];
  const gap = Math.abs(orders.width - 3 - shape.widthBias);
  const widthClash = gap >= 3;
  const widthFit = gap <= 1;
  let midMul = 1 + shape.control * 0.028 + (orders.build === "short" ? 0.035 : orders.build === "direct" ? -0.02 : 0);
  if (widthFit) midMul += 0.02;
  if (pressed && orders.build === "short") midMul -= 0.03;
  return {
    shape,
    defMul: 1 + shape.block * 0.025 + (orders.line === "deep" ? 0.05 : orders.line === "high" ? -0.035 : 0) + (widthClash ? -0.03 : 0),
    midMul,
    atkMul:
      1 +
      shape.threat * 0.022 +
      (orders.tempo >= 4 ? 0.03 : orders.tempo <= 2 ? -0.025 : 0) +
      (shape.counter > 0 && orders.line !== "high" ? shape.counter * 0.018 : 0),
    poss: (orders.build === "short" ? 0.028 : orders.build === "direct" ? -0.022 : 0) - (pressed && orders.build === "short" ? 0.01 : 0),
    chance:
      shape.threat * 0.008 +
      (orders.tempo >= 4 ? 0.01 : 0) +
      (orders.line === "high" ? 0.008 : orders.line === "deep" ? -0.01 : 0) +
      (orders.pressing >= 4 ? 0.008 : 0),
    drain:
      0.2 +
      (orders.pressing >= 4 ? 0.08 : 0) +
      (shape.press >= 2 ? 0.05 : shape.press >= 1 ? 0.02 : 0) +
      (orders.line === "high" ? 0.03 : 0) +
      (orders.tempo >= 5 ? 0.04 : 0),
    exposed: orders.line === "high" ? 0.012 + (shape.block < 0 ? 0.01 : 0) : 0,
    clash: widthClash,
  };
}

export const DEF = new Set<Position>(["GK", "CB", "LB", "RB"]);
export const MID = new Set<Position>(["CDM", "CM", "CAM"]);
export const ATT = new Set<Position>(["LW", "RW", "ST"]);

export function lineOf(pos: Position): "def" | "mid" | "atk" {
  if (DEF.has(pos)) return "def";
  if (MID.has(pos)) return "mid";
  return "atk";
}

export const KIT_COLORS = [
  { name: "Ink", hex: "#14261f" },
  { name: "Brass", hex: "#d6b25e" },
  { name: "Pitch", hex: "#1f8a5b" },
  { name: "Cream", hex: "#efe6d2" },
  { name: "Crimson", hex: "#9d2b3a" },
  { name: "Harbor", hex: "#1c3d66" },
  { name: "White", hex: "#f4f7f5" },
  { name: "Black", hex: "#121614" },
];

export const PHILOSOPHIES: { id: Philosophy; title: string; body: string }[] = [
  {
    id: "possession",
    title: "Velvet possession",
    body: "Keep the ball. Midfield quality decides matches.",
  },
  {
    id: "press",
    title: "Full press",
    body: "Win it high. Fitness drains faster through a week.",
  },
  {
    id: "counter",
    title: "Spring counter",
    body: "Sit in, then break. Pace becomes the weapon.",
  },
  {
    id: "direct",
    title: "Straight lines",
    body: "Early balls and shots. Forwards earn their wages.",
  },
  {
    id: "youth",
    title: "Academy first",
    body: "Teenagers learn faster. Results still have to come.",
  },
];

export const TRAININGS: { id: TrainingFocus; title: string; body: string }[] = [
  { id: "attack", title: "Attack", body: "Finishing, pace, and dribbling." },
  { id: "defense", title: "Defense", body: "Duels, positioning, recovery runs." },
  { id: "fitness", title: "Fitness", body: "Legs for the next kickoff. Growth slows." },
  { id: "technical", title: "Technical", body: "Passing patterns and first touch." },
  { id: "youth", title: "Youth", body: "Extra work for players 21 and under." },
];

export const TIER_META: Record<1 | 2 | 3, { name: string; blurb: string }> = {
  3: { name: "Harbor League", blurb: "Where chairs are earned." },
  2: { name: "Marrow Championship", blurb: "One step from the lights." },
  1: { name: "Tyrone Premier", blurb: "The brass ring." },
};

export const SQUAD_SHAPE: Position[] = [
  "GK",
  "GK",
  "CB",
  "CB",
  "CB",
  "LB",
  "LB",
  "RB",
  "RB",
  "CDM",
  "CDM",
  "CM",
  "CM",
  "CAM",
  "LW",
  "RW",
  "ST",
  "ST",
];

export const FIRST = [
  "Idris", "Mateo", "Soren", "Leandro", "Kwame", "Jonas", "Rafa", "Nico", "Eliud",
  "Harun", "Pavel", "Kenji", "Omar", "Luca", "Samir", "Ivo", "Tariq", "Bruno",
  "Casper", "Yuri", "Felix", "Noam", "Dario", "Hugo", "Ansel", "Keita", "Marco",
  "Ellis", "Rohan", "Piotr", "Nabil", "Theo", "Oscar", "Milan", "Ade", "Lars",
  "Enzo", "Farid", "Gideon", "Hector", "Jamal", "Kofi", "Leon", "Musa", "Nils",
  "Paolo", "Remy", "Stefan", "Tomas", "Ugo", "Viktor", "Wendell", "Yusuf", "Zane",
  "Arlo", "Basil", "Cedric", "Darius", "Emil", "Finn", "Iker", "Joss", "Kai",
  "Lior", "Moss", "Ned", "Otto", "Pax", "Quin", "Rio", "Sol", "Taye", "Uri",
  "Vince", "Wes", "Yann", "Zeke", "Andre", "Biko", "Cai", "Davi", "Elias",
];

export const LAST = [
  "Voss", "Keller", "Mensah", "Duarte", "Rahman", "Novak", "Berg", "Diallo",
  "Horvat", "Kone", "Larsen", "Moreau", "Ndiaye", "Petrov", "Sato", "Traore",
  "Ueda", "Vogel", "Adebayo", "Banda", "Correia", "Dlamini", "Fofana", "Gashi",
  "Haddad", "Ilic", "Jallow", "Khoury", "Mbeki", "Osei", "Paredes", "Quaye",
  "Sow", "Tadic", "Yeboah", "Ashcroft", "Brant", "Colfer", "Drewe", "Elkins",
  "Farrow", "Greeve", "Hollis", "Ingram", "Jory", "Kestel", "Lowry", "Merrick",
  "Olum", "Pryce", "Quill", "Renn", "Stowe", "Tarrant", "Ulric", "Venn", "Wick",
  "Yarrow", "Zeller", "Marlow", "Pineda", "Costa", "Ibanez", "Okoye", "Nash",
];

export const NATIONS = [
  "Marrow", "Velden", "Ostera", "Kite", "Brava", "Luneth", "Sable", "Quorra",
  "Nima", "Halden", "Ashmere", "Goldwater",
];

export const SPONSORS = [
  "Harbor Grain", "Brassline", "Velden Rail", "Night Oil", "Kite Air",
  "Sable Cement", "Luneth Mutual", "Quay & Co", "Northglass Glass",
];

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

export const TIER_CLUBS: Record<1 | 2 | 3, Template[]> = {
  3: [
    { id: "bwa", name: "Blackwater Athletic", short: "BWA", city: "Port Blackwater", primary: "#14261f", secondary: "#d6b25e", stadium: "Blackwater Dock", style: "press" },
    { id: "psv", name: "Port Salvage", short: "PSV", city: "Salvage", primary: "#9d2b3a", secondary: "#efe6d2", stadium: "The Breakwater", style: "direct" },
    { id: "kmu", name: "Kingsmere United", short: "KMU", city: "Kingsmere", primary: "#1c3d66", secondary: "#e7f2ea", stadium: "Mere Park", style: "possession" },
    { id: "ash", name: "Ashford Rovers", short: "ASH", city: "Ashford", primary: "#6b3a2a", secondary: "#f4f7f2", stadium: "Cinder Ground", style: "counter" },
    { id: "rdl", name: "Red Lantern", short: "RDL", city: "Lantern Hill", primary: "#7a1e2b", secondary: "#d6b25e", stadium: "Lantern Yard", style: "direct" },
    { id: "vlh", name: "Vale & Harbour", short: "VLH", city: "Vale", primary: "#1f6b4a", secondary: "#efe6d2", stadium: "Estuary Road", style: "possession" },
    { id: "ngt", name: "Northglass Town", short: "NGT", city: "Northglass", primary: "#3c4d5c", secondary: "#d6b25e", stadium: "Glassworks", style: "youth" },
  ],
  2: [
    { id: "osc", name: "Ostera City", short: "OSC", city: "Ostera", primary: "#0e2a4a", secondary: "#d6b25e", stadium: "Civic Bowl", style: "possession" },
    { id: "sbw", name: "Sable Wednesday", short: "SBW", city: "Sable", primary: "#2a2e33", secondary: "#efe6d2", stadium: "Midweek Park", style: "counter" },
    { id: "lun", name: "Luneth Athletic", short: "LUN", city: "Luneth", primary: "#1f4d3a", secondary: "#e7f2ea", stadium: "Green Ledger", style: "press" },
    { id: "brv", name: "Brava United", short: "BRV", city: "Brava", primary: "#6e2b3c", secondary: "#f4f7f2", stadium: "Old Brava", style: "direct" },
    { id: "qrr", name: "Quorra Rangers", short: "QRR", city: "Quorra", primary: "#3d2a68", secondary: "#d6b25e", stadium: "Ranger Gate", style: "press" },
    { id: "hlp", name: "Halden Park", short: "HLP", city: "Halden", primary: "#8a6232", secondary: "#142016", stadium: "The Park", style: "possession" },
    { id: "kti", name: "Kite Island", short: "KTI", city: "Kite", primary: "#1a4d6e", secondary: "#efe6d2", stadium: "Windward", style: "youth" },
  ],
  1: [
    { id: "vlr", name: "Velden Royal", short: "VLR", city: "Velden", primary: "#1a2744", secondary: "#d6b25e", stadium: "Royal Mile", style: "possession" },
    { id: "mrc", name: "Marrow Coast", short: "MRC", city: "Marrow", primary: "#12352c", secondary: "#efe6d2", stadium: "Coast Ground", style: "press" },
    { id: "nmp", name: "Nima Palace", short: "NMP", city: "Nima", primary: "#4a2c6a", secondary: "#f4f7f2", stadium: "Palace Lawn", style: "direct" },
    { id: "cro", name: "Crown Ostera", short: "CRO", city: "Ostera", primary: "#6b1d2a", secondary: "#d6b25e", stadium: "Crown Ring", style: "possession" },
    { id: "hsb", name: "High Sable", short: "HSB", city: "Sable", primary: "#22262b", secondary: "#d6b25e", stadium: "High Stand", style: "counter" },
    { id: "stb", name: "Saint Brava", short: "STB", city: "Brava", primary: "#143a28", secondary: "#efe6d2", stadium: "Saint's End", style: "press" },
    { id: "gld", name: "Goldwater", short: "GLD", city: "Goldwater", primary: "#3a2f14", secondary: "#e7d7a1", stadium: "Bullion Park", style: "direct" },
  ],
};

export const TIER_REPS: Record<1 | 2 | 3, number[]> = {
  3: [63, 59, 56, 53, 50, 47, 44],
  2: [74, 71, 68, 65, 62, 59, 56],
  1: [88, 84, 81, 78, 75, 72, 69],
};

export function objectiveText(tier: 1 | 2 | 3) {
  if (tier === 3) return "Finish in the Harbor League top four.";
  if (tier === 2) return "Finish in the Marrow Championship top two.";
  return "Finish in the Tyrone Premier top four.";
}

export function objectiveHit(tier: 1 | 2 | 3, pos: number) {
  if (tier === 3) return pos <= 4;
  if (tier === 2) return pos <= 2;
  return pos <= 4;
}

export const PRIZE: Record<1 | 2 | 3, number[]> = {
  3: [780000, 520000, 340000, 220000, 140000, 90000, 50000, 30000],
  2: [2200000, 1500000, 980000, 640000, 420000, 260000, 140000, 80000],
  1: [6400000, 4200000, 2800000, 1800000, 1100000, 700000, 360000, 180000],
};

export const CUP_PRIZE: Record<1 | 2 | 3, number> = {
  3: 260000,
  2: 700000,
  1: 1800000,
};

export function capacity(level: number) {
  return [9000, 14000, 21000, 30000, 42000][level - 1] ?? 9000;
}

export const OVERDRAFT_RATE = 0.0035;

export function debtLimit(tier: 1 | 2 | 3) {
  return tier === 1 ? 8_000_000 : tier === 2 ? 3_500_000 : 1_500_000;
}

export type StandSpec = {
  id: StandId;
  name: string;
  end: string;
  seats: number[];
  boxes: number[];
  cost: number[];
  works: string[];
};

export const STANDS: Record<StandId, StandSpec> = {
  west: {
    id: "west",
    name: "Main Stand",
    end: "West",
    seats: [2600, 4400, 6800, 9400, 12200],
    boxes: [0, 80, 320, 700, 1300],
    cost: [980000, 1650000, 2900000, 4400000],
    works: [
      "Roof the open side and put the dressing rooms underneath.",
      "A hospitality deck. Boxes pay about three times a normal seat.",
      "Second tier. New steel, a longer roof, more seats above the press.",
      "Finish it. Corner infill and a full cantilever. This is the job that takes years of gates.",
    ],
  },
  east: {
    id: "east",
    name: "East Stand",
    end: "East",
    seats: [1800, 3200, 5000, 7200, 9800],
    boxes: [0, 0, 0, 0, 0],
    cost: [720000, 1150000, 1850000, 2700000],
    works: [
      "Cover the far side. Still one tier.",
      "Push the East Stand deeper. More seats, same roof line.",
      "Second tier, opposite the Main Stand.",
      "Close the corners and raise the roof.",
    ],
  },
  north: {
    id: "north",
    name: "North End",
    end: "North",
    seats: [1400, 2600, 4200, 6200, 8400],
    boxes: [0, 0, 0, 0, 0],
    cost: [420000, 740000, 1200000, 1850000],
    works: [
      "Cover the home end. The cheap stand, and the loud one.",
      "Take the Kop deeper. Still a single tier behind the goal.",
      "Two tiers on the home end.",
      "Fill the corners so the noise stays in the ground.",
    ],
  },
  south: {
    id: "south",
    name: "South End",
    end: "South",
    seats: [1100, 2000, 3400, 5000, 6800],
    boxes: [0, 0, 0, 0, 0],
    cost: [360000, 640000, 1050000, 1600000],
    works: [
      "A roof on the away end, and a block of seats you can actually police.",
      "Deepen the away end.",
      "A second tier for the visitors, and the home seats beside them.",
      "Finish the south corners.",
    ],
  },
};

export const STAND_IDS: StandId[] = ["west", "east", "north", "south"];

function clampTier(n: number) {
  return Math.max(0, Math.min(4, Math.round(n)));
}

export function standsFromLevel(level: number): Stands {
  const table: Record<number, Stands> = {
    1: { west: 1, east: 1, north: 0, south: 0 },
    2: { west: 2, east: 2, north: 1, south: 1 },
    3: { west: 3, east: 2, north: 2, south: 1 },
    4: { west: 3, east: 3, north: 3, south: 2 },
    5: { west: 4, east: 4, north: 3, south: 3 },
  };
  return table[level] ?? table[1]!;
}

export function standsOf(state: Pick<SaveData, "stands" | "facilities">): Stands {
  const s = state.stands;
  if (s && [s.west, s.east, s.north, s.south].every((n) => typeof n === "number")) {
    return { west: clampTier(s.west), east: clampTier(s.east), north: clampTier(s.north), south: clampTier(s.south) };
  }
  return standsFromLevel(state.facilities?.stadium ?? 1);
}

export function stadiumLevel(stands: Stands) {
  const avg = (stands.west + stands.east + stands.north + stands.south) / 4;
  return Math.max(1, Math.min(5, 1 + Math.round(avg - 0.5)));
}

export function standFacts(stands: Stands) {
  let seats = 0;
  let boxes = 0;
  for (const id of STAND_IDS) {
    const tier = stands[id] ?? 0;
    seats += STANDS[id].seats[tier] ?? 0;
    boxes += STANDS[id].boxes[tier] ?? 0;
  }
  return { seats, boxes };
}

export function nextBuild(id: StandId, tier: number) {
  const spec = STANDS[id];
  if (tier >= 4) return null;
  return {
    cost: spec.cost[tier] ?? 0,
    seats: (spec.seats[tier + 1] ?? 0) - (spec.seats[tier] ?? 0),
    boxes: (spec.boxes[tier + 1] ?? 0) - (spec.boxes[tier] ?? 0),
    work: spec.works[tier] ?? "",
    name: spec.name,
  };
}

export function upgradeCost(key: "stadium" | "training" | "academy" | "medical", level: number) {
  const table = {
    stadium: [0, 480000, 980000, 1700000, 2900000],
    training: [0, 220000, 460000, 860000, 1500000],
    academy: [0, 180000, 400000, 760000, 1300000],
    medical: [0, 160000, 340000, 640000, 1100000],
  };
  return table[key][level] ?? 0;
}

export function staffCost(level: number) {
  return 70000 + level * 55000;
}

export const ALT: Partial<Record<Position, Position[]>> = {
  GK: [],
  CB: ["LB", "RB"],
  LB: ["CB", "LW"],
  RB: ["CB", "RW"],
  CDM: ["CM", "CB"],
  CM: ["CDM", "CAM"],
  CAM: ["CM", "ST"],
  LW: ["RW", "CAM", "ST"],
  RW: ["LW", "CAM", "ST"],
  ST: ["CAM", "LW"],
};
