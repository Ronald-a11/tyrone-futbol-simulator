import { FORMATION_IDS, FORMATIONS, lineOf, ordersForStyle, tacticMods } from "./data";
import type { BuildUp, FormationId, LineHeight } from "./types";
import { dutyFit, ovr, pickXi } from "./players";
import type {
  LiveMatch,
  Mentality,
  Player,
  Position,
  PressTone,
  SaveData,
  Scorer,
} from "./types";
import { clamp, unit } from "./util";

const MAX_SUBS = 5;

function byId(players: Player[]) {
  return new Map(players.map((p) => [p.id, p]));
}

function dutyScore(p: Player, slot: Position, stamina: number, youthBoost: boolean) {
  const a = p.attrs;
  const duty = lineOf(slot);
  let skill =
    slot === "GK"
      ? a.gk * 0.78 + a.defense * 0.12 + a.physical * 0.1
      : duty === "atk"
        ? a.shoot * 0.4 + a.pace * 0.24 + a.dribble * 0.22 + a.pass * 0.14
        : duty === "mid"
          ? a.pass * 0.34 + a.dribble * 0.18 + a.defense * 0.16 + a.pace * 0.16 + a.physical * 0.16
          : a.defense * 0.42 + a.physical * 0.24 + a.pace * 0.16 + a.pass * 0.18;
  if (youthBoost && p.age <= 21) skill *= 1.07;
  const cond = (0.6 + 0.4 * (stamina / 100)) * (0.78 + 0.22 * (p.morale / 100));
  return skill * dutyFit(p, slot) * cond;
}

function sideProfile(
  ids: string[],
  formation: LiveMatch["homeForm"],
  map: Map<string, Player>,
  stamina: Record<string, number>,
  off: string[],
  mentality: Mentality,
  style: SaveData["philosophy"],
  spirit: number,
  home: boolean,
) {
  const slots = FORMATIONS[formation];
  let def = 0;
  let mid = 0;
  let atk = 0;
  let defN = 0;
  let midN = 0;
  let atkN = 0;
  const attackers: { id: string; skill: number; pass: number }[] = [];
  const mids: { id: string; skill: number; pass: number }[] = [];
  const youthBoost = style === "youth";
  ids.forEach((id, i) => {
    const p = map.get(id);
    const slot = slots[i];
    if (!p || !slot || off.includes(id)) return;
    const sc = dutyScore(p, slot.pos, stamina[id] ?? p.fitness, youthBoost);
    const duty = slot.pos === "GK" ? "def" : lineOf(slot.pos);
    if (duty === "def") {
      def += sc;
      defN++;
    } else if (duty === "mid") {
      mid += sc;
      midN++;
      mids.push({ id, skill: sc, pass: p.attrs.pass });
    } else {
      atk += sc;
      atkN++;
      attackers.push({ id, skill: sc, pass: p.attrs.pass });
    }
  });
  const men =
    mentality === "attack" ? { a: 1.08, d: 0.93 } : mentality === "defend" ? { a: 0.92, d: 1.08 } : { a: 1, d: 1 };
  let atkM = men.a;
  let defM = men.d;
  let midM = 1;
  if (style === "possession") midM += 0.06;
  if (style === "press") {
    atkM += 0.04;
    defM += 0.02;
  }
  if (style === "counter" && mentality !== "attack") atkM += 0.05;
  if (style === "direct") atkM += 0.04;
  if (style === "youth") {
    midM += 0.035;
    atkM += 0.03;
    defM -= 0.015;
  }
  if (home) {
    defM += 0.03;
    midM += 0.02;
  }
  const avg = (sum: number, n: number) => (n ? sum / n : 55);
  return {
    defAvg: avg(def, defN) * defM,
    midAvg: avg(mid, midN) * midM + spirit * 0.35,
    atkAvg: avg(atk, atkN) * atkM + spirit * 0.45,
    attackers: attackers.length ? attackers : mids,
    creators: [...attackers, ...mids],
    gk: ids
      .map((id, i) => ({ id, slot: slots[i]?.pos }))
      .find((x) => x.slot === "GK" && !off.includes(x.id))?.id,
  };
}

function placeDots(live: LiveMatch, attacking: "home" | "away" | "mid") {
  const dots: Record<string, { x: number; y: number }> = {};
  const ball =
    attacking === "home"
      ? { x: 68 + unit(live.seed, live.minute, 1) * 18, y: 18 + unit(live.seed, live.minute, 2) * 64 }
      : attacking === "away"
        ? { x: 14 + unit(live.seed, live.minute, 1) * 18, y: 18 + unit(live.seed, live.minute, 2) * 64 }
        : { x: 42 + unit(live.seed, live.minute, 1) * 16, y: 30 + unit(live.seed, live.minute, 2) * 40 };
  const paint = (ids: string[], form: LiveMatch["homeForm"], side: "home" | "away") => {
    const slots = FORMATIONS[form];
    ids.forEach((id, i) => {
      const slot = slots[i];
      if (!slot || live.off.includes(id)) return;
      const x0 = side === "home" ? slot.x : 100 - slot.x;
      const y0 = slot.y;
      const jx = (unit(live.seed, live.minute, i, side === "home" ? 3 : 4) - 0.5) * 7;
      const jy = (unit(live.seed, live.minute, i, 5) - 0.5) * 8;
      dots[id] = {
        x: clamp(x0 * 0.82 + ball.x * 0.18 + jx, 5, 95),
        y: clamp(y0 * 0.78 + ball.y * 0.22 + jy, 7, 93),
      };
    });
  };
  paint(live.homeXi, live.homeForm, "home");
  paint(live.awayXi, live.awayForm, "away");
  return { dots, ball };
}

function pickWeighted(seed: number, minute: number, salt: number, rows: { id: string; skill: number }[]) {
  const total = rows.reduce((s, r) => s + r.skill, 0) || 1;
  let roll = unit(seed, minute, salt) * total;
  for (const row of rows) {
    roll -= row.skill;
    if (roll <= 0) return row.id;
  }
  return rows[rows.length - 1]?.id ?? "";
}

function tickRatings(
  next: LiveMatch,
  map: Map<string, Player>,
  attackSide: "home" | "away",
  homeForm: FormationId,
  awayForm: FormationId,
) {
  const bumpSide = (ids: string[], form: FormationId, attacking: boolean) => {
    ids.forEach((id, i) => {
      if (next.off.includes(id)) return;
      const slot = FORMATIONS[form][i];
      if (!slot) return;
      const duty = slot.pos === "GK" ? "def" : lineOf(slot.pos);
      let bump = 0.0035;
      if (attacking) {
        if (duty === "atk") bump += 0.005;
        else if (duty === "mid") bump += 0.004;
        else bump += 0.002;
      } else {
        if (duty === "def" || slot.pos === "GK") bump += 0.0045;
        else if (duty === "mid") bump += 0.003;
        else bump += 0.0015;
      }
      const st = next.stamina[id] ?? 80;
      if (st < 55) bump *= 0.7;
      const p = map.get(id);
      if (p && p.age <= 21) bump += 0.0008;
      next.ratings[id] = clamp((next.ratings[id] ?? 6.3) + bump, 3, 9.6);
    });
  };
  bumpSide(next.homeXi, homeForm, attackSide === "home");
  bumpSide(next.awayXi, awayForm, attackSide === "away");
}

export function createLive(state: SaveData, fixtureId: string, tone: PressTone): LiveMatch {
  const week = state.weeks[state.weekIndex];
  const fixture = week?.fixtures.find((f) => f.id === fixtureId);
  if (!week || !fixture) throw new Error("Fixture missing");
  const homeClub = state.clubs.find((c) => c.id === fixture.homeId);
  const awayClub = state.clubs.find((c) => c.id === fixture.awayId);
  const userSide: "home" | "away" = fixture.homeId === state.userClubId ? "home" : "away";
  const homePick =
    fixture.homeId === state.userClubId && state.xi.length === 11
      ? { xi: state.xi.slice(), bench: state.bench.slice() }
      : pickXi(state.players, fixture.homeId, fixture.homeId === state.userClubId ? state.formation : awayForm(state.seed, fixture.homeId));
  const awayFormId =
    fixture.awayId === state.userClubId ? state.formation : awayForm(state.seed, fixture.awayId);
  const homeForm = fixture.homeId === state.userClubId ? state.formation : awayForm(state.seed, fixture.homeId);
  const awayPick =
    fixture.awayId === state.userClubId && state.xi.length === 11
      ? { xi: state.xi.slice(), bench: state.bench.slice() }
      : pickXi(state.players, fixture.awayId, awayFormId);
  const stamina: Record<string, number> = {};
  const ratings: Record<string, number> = {};
  const cameOn: Record<string, number> = {};
  const wentOff: Record<string, number> = {};
  for (const id of [...homePick.xi, ...awayPick.xi]) {
    const p = state.players.find((x) => x.id === id);
    stamina[id] = p?.fitness ?? 80;
    ratings[id] = 6.3;
    cameOn[id] = 0;
    wentOff[id] = 90;
  }
  const extra = [...fixture.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const seed = mixSeed(state.seed, state.season, state.weekIndex, extra);
  const draft: LiveMatch = {
    seed,
    minute: 0,
    homeId: fixture.homeId,
    awayId: fixture.awayId,
    competition: fixture.competition,
    weekLabel: week.label,
    fixtureId: fixture.id,
    homeScore: 0,
    awayScore: 0,
    shotsH: 0,
    shotsA: 0,
    onH: 0,
    onA: 0,
    xgH: 0,
    xgA: 0,
    possH: 0,
    homeXi: homePick.xi,
    awayXi: awayPick.xi,
    homeBench: homePick.bench,
    awayBench: awayPick.bench,
    homeForm,
    awayForm: awayFormId,
    homeMentality: userSide === "home" ? state.mentality : "balanced",
    awayMentality: userSide === "away" ? state.mentality : "balanced",
    stamina,
    ratings,
    yellow: {},
    off: [],
    hurt: [],
    scorers: [],
    log: [
      {
        minute: 0,
        kind: "info",
        text: `Kickoff at ${homeClub?.stadium ?? "the ground"}. ${homeClub?.name ?? "Home"} against ${awayClub?.name ?? "Away"}.`,
      },
    ],
    ball: { x: 50, y: 50 },
    dots: {},
    finished: false,
    subsH: 0,
    subsA: 0,
    cameOn,
    wentOff,
    spirit: tone === "bold" ? 2.4 : tone === "deflect" ? 1 : 0.4,
    pressTone: tone,
    paused: false,
    speed: 1,
    shouts: [],
    userSide,
    period: "regulation",
    penHome: 0,
    penAway: 0,
    penKicks: [],
    penNext: "home",
  };
  const placed = placeDots(draft, "mid");
  draft.dots = placed.dots;
  draft.ball = placed.ball;
  return draft;
}

function awayForm(seed: number, clubId: string): LiveMatch["homeForm"] {
  const n = clubId.split("").reduce((s, ch) => s + ch.charCodeAt(0), 0);
  return FORMATION_IDS[Math.floor(unit(seed, n, 2) * FORMATION_IDS.length)] ?? "4-3-3";
}

function mixSeed(seed: number, season: number, week: number, extra: number) {
  return Math.floor(unit(seed, season + 3, week + 9, extra) * 1_000_000_000);
}

function nameOf(map: Map<string, Player>, id: string) {
  return map.get(id)?.name ?? "A player";
}

function cloneLive(live: LiveMatch): LiveMatch {
  return {
    ...live,
    stamina: { ...live.stamina },
    ratings: { ...live.ratings },
    yellow: { ...live.yellow },
    off: live.off.slice(),
    hurt: live.hurt.slice(),
    scorers: live.scorers.slice(),
    log: live.log.slice(-48),
    cameOn: { ...live.cameOn },
    wentOff: { ...live.wentOff },
    homeXi: live.homeXi.slice(),
    awayXi: live.awayXi.slice(),
    homeBench: live.homeBench.slice(),
    awayBench: live.awayBench.slice(),
    shouts: live.shouts.slice(),
    penKicks: live.penKicks.slice(),
  };
}

function finishMatch(next: LiveMatch, pushLog: (text: string, kind: LiveMatch["log"][number]["kind"]) => void) {
  next.finished = true;
  next.paused = true;
  if (next.period === "pens") {
    pushLog(
      `Penalties over. ${next.homeScore}–${next.awayScore} after ${next.penHome}–${next.penAway} on spot kicks.`,
      "info",
    );
  } else {
    pushLog(`Full time. ${next.homeScore}–${next.awayScore}.`, "info");
  }
}

function stepPenalty(live: LiveMatch, state: SaveData): LiveMatch {
  const next = cloneLive(live);
  const map = byId(state.players);
  const pushLog = (text: string, kind: LiveMatch["log"][number]["kind"]) => {
    next.log = [...next.log, { minute: 120, text, kind }].slice(-50);
  };
  const taken = next.penKicks.length;
  if (taken === 0) {
    pushLog("Penalties. Five each, then sudden death.", "info");
  }
  const side = next.penNext;
  const xi = side === "home" ? next.homeXi : next.awayXi;
  const form = side === "home" ? next.homeForm : next.awayForm;
  const takers = xi
    .map((id, i) => {
      const slot = FORMATIONS[form][i];
      const p = map.get(id);
      if (!p || !slot || next.off.includes(id) || slot.pos === "GK") return null;
      return { id, skill: p.attrs.shoot * 0.7 + p.attrs.pace * 0.15 + p.attrs.physical * 0.15 };
    })
    .filter((x): x is { id: string; skill: number } => !!x)
    .sort((a, b) => b.skill - a.skill);
  const used = new Set(next.penKicks.filter((k) => k.side === side).map((k) => k.name));
  const pick =
    takers.find((t) => !used.has(nameOf(map, t.id))) ??
    takers[taken % Math.max(1, takers.length)] ??
    { id: xi[10] ?? xi[0] ?? "", skill: 60 };
  const gkSide = side === "home" ? "away" : "home";
  const gkXi = gkSide === "home" ? next.homeXi : next.awayXi;
  const gkForm = gkSide === "home" ? next.homeForm : next.awayForm;
  const gkId =
    gkXi.map((id, i) => ({ id, pos: FORMATIONS[gkForm][i]?.pos })).find((x) => x.pos === "GK" && !next.off.includes(x.id))
      ?.id ?? gkXi[0];
  const gk = map.get(gkId ?? "");
  const shoot = map.get(pick.id);
  const shootSkill = shoot ? shoot.attrs.shoot * 0.75 + shoot.attrs.physical * 0.25 : 62;
  const gkSkill = gk ? gk.attrs.gk * 0.85 + gk.attrs.pace * 0.15 : 60;
  const chance = clamp(0.58 + (shootSkill - gkSkill) / 140, 0.38, 0.82);
  const scored = unit(next.seed, 120, taken + 3, side === "home" ? 1 : 2) < chance;
  const name = nameOf(map, pick.id);
  next.penKicks = [...next.penKicks, { side, scored, name }];
  if (side === "home") next.penHome += scored ? 1 : 0;
  else next.penAway += scored ? 1 : 0;
  pushLog(scored ? `${name} scores from the spot.` : `${name} misses. ${nameOf(map, gkId ?? "")} saves.`, scored ? "goal" : "chance");
  next.penNext = side === "home" ? "away" : "home";

  const homeTaken = next.penKicks.filter((k) => k.side === "home").length;
  const awayTaken = next.penKicks.filter((k) => k.side === "away").length;
  const hLeft = Math.max(0, 5 - homeTaken);
  const aLeft = Math.max(0, 5 - awayTaken);
  if (homeTaken >= 5 && awayTaken >= 5) {
    if (next.penHome !== next.penAway && homeTaken === awayTaken) {
      if (next.penHome > next.penAway) next.homeScore += 1;
      else next.awayScore += 1;
      finishMatch(next, pushLog);
      return next;
    }
  } else if (homeTaken >= 1 && awayTaken >= 1) {
    if (next.penHome > next.penAway + aLeft) {
      next.homeScore += 1;
      finishMatch(next, pushLog);
      return next;
    }
    if (next.penAway > next.penHome + hLeft) {
      next.awayScore += 1;
      finishMatch(next, pushLog);
      return next;
    }
  }
  const placed = placeDots(next, "mid");
  next.dots = placed.dots;
  next.ball = side === "home" ? { x: 92, y: 50 } : { x: 8, y: 50 };
  return next;
}

export function stepMatch(live: LiveMatch, state: SaveData): LiveMatch {
  if (live.finished) return live;
  if (live.period === "pens") return stepPenalty(live, state);

  const cap = live.period === "et" ? 120 : 90;
  if (live.minute >= cap) return live;

  const minute = live.minute + 1;
  const map = byId(state.players);
  const next = cloneLive(live);
  next.minute = minute;

  if (minute > 58) {
    if (next.userSide !== "away") {
      if (next.awayScore + 1 < next.homeScore) next.awayMentality = "attack";
      else if (minute > 72 && next.awayScore > next.homeScore) next.awayMentality = "defend";
    }
    if (next.userSide !== "home") {
      if (next.homeScore + 1 < next.awayScore) next.homeMentality = "attack";
      else if (minute > 72 && next.homeScore > next.awayScore) next.homeMentality = "defend";
    }
  }

  const homeClub = state.clubs.find((c) => c.id === next.homeId);
  const awayClub = state.clubs.find((c) => c.id === next.awayId);
  const homeStyle = next.homeId === state.userClubId ? state.philosophy : (homeClub?.style ?? "possession");
  const awayStyle = next.awayId === state.userClubId ? state.philosophy : (awayClub?.style ?? "direct");
  const homeOrders =
    next.homeId === state.userClubId
      ? {
          tempo: state.tempo ?? 3,
          pressing: state.pressing ?? 3,
          width: state.width ?? 3,
          line: (state.line ?? "standard") as LineHeight,
          build: (state.build ?? "mixed") as BuildUp,
        }
      : ordersForStyle(homeStyle);
  const awayOrders =
    next.awayId === state.userClubId
      ? {
          tempo: state.tempo ?? 3,
          pressing: state.pressing ?? 3,
          width: state.width ?? 3,
          line: (state.line ?? "standard") as LineHeight,
          build: (state.build ?? "mixed") as BuildUp,
        }
      : ordersForStyle(awayStyle);
  const homeMods = tacticMods(next.homeForm, homeOrders, awayOrders.pressing >= 4);
  const awayMods = tacticMods(next.awayForm, awayOrders, homeOrders.pressing >= 4);
  const home = sideProfile(
    next.homeXi,
    next.homeForm,
    map,
    next.stamina,
    next.off,
    next.homeMentality,
    homeStyle,
    next.userSide === "home" ? next.spirit : 0,
    true,
  );
  const away = sideProfile(
    next.awayXi,
    next.awayForm,
    map,
    next.stamina,
    next.off,
    next.awayMentality,
    awayStyle,
    next.userSide === "away" ? next.spirit : 0,
    false,
  );
  home.defAvg *= homeMods.defMul;
  home.midAvg *= homeMods.midMul;
  home.atkAvg *= homeMods.atkMul;
  away.defAvg *= awayMods.defMul;
  away.midAvg *= awayMods.midMul;
  away.atkAvg *= awayMods.atkMul;

  const drain = (ids: string[], drop: number) => {
    for (const id of ids) {
      if (next.off.includes(id)) continue;
      next.stamina[id] = clamp((next.stamina[id] ?? 80) - drop, 38, 100);
    }
  };
  const etFactor = next.period === "et" ? 1.15 : 1;
  drain(next.homeXi, clamp(homeMods.drain * etFactor, 0.16, 0.48));
  drain(next.awayXi, clamp(awayMods.drain * etFactor, 0.16, 0.48));

  let pHome = 0.5 + (home.midAvg - away.midAvg) / 220 + homeMods.poss - awayMods.poss;
  if (next.homeMentality === "attack") pHome += 0.035;
  if (next.homeMentality === "defend") pHome -= 0.03;
  if (next.awayMentality === "attack") pHome -= 0.03;
  pHome = clamp(pHome, 0.34, 0.66);
  const attackSide: "home" | "away" = unit(next.seed, minute, 7) < pHome ? "home" : "away";
  if (attackSide === "home") next.possH += 1;
  const atk = attackSide === "home" ? home : away;
  const defAvg = attackSide === "home" ? away.defAvg : home.defAvg;
  const atkMods = attackSide === "home" ? homeMods : awayMods;
  const defMods = attackSide === "home" ? awayMods : homeMods;
  const chanceP = clamp(0.12 + (atk.atkAvg - defAvg) / 170 + atkMods.chance + defMods.exposed, 0.06, 0.26);
  const roll = unit(next.seed, minute, 8);

  const pushLog = (text: string, kind: LiveMatch["log"][number]["kind"]) => {
    next.log = [...next.log, { minute, text, kind }].slice(-50);
  };

  tickRatings(next, map, attackSide, next.homeForm, next.awayForm);

  if (roll < chanceP && atk.attackers.length) {
    const shooter = pickWeighted(next.seed, minute, 9, atk.attackers);
    const shooterP = map.get(shooter);
    const shootSkill = shooterP ? (shooterP.pos === "GK" ? 40 : shooterP.attrs.shoot * 0.7 + shooterP.attrs.pace * 0.3) : 60;
    const xg = clamp(0.18 + (shootSkill - defAvg) / 150, 0.07, 0.42);
    if (attackSide === "home") {
      next.shotsH += 1;
      next.xgH = Math.round((next.xgH + xg) * 100) / 100;
    } else {
      next.shotsA += 1;
      next.xgA = Math.round((next.xgA + xg) * 100) / 100;
    }
    const onTarget = unit(next.seed, minute, 10) < 0.62;
    if (onTarget) {
      if (attackSide === "home") next.onH += 1;
      else next.onA += 1;
    }
    const goal = onTarget && unit(next.seed, minute, 11) < xg / 0.62;
    if (goal) {
      if (attackSide === "home") next.homeScore += 1;
      else next.awayScore += 1;
      let assistId: string | undefined;
      if (unit(next.seed, minute, 12) < 0.62) {
        const mates = atk.creators.filter((c) => c.id !== shooter);
        if (mates.length) assistId = [...mates].sort((a, b) => b.pass - a.pass)[0]?.id;
      }
      const scorer: Scorer = {
        name: nameOf(map, shooter),
        minute,
        side: attackSide,
        playerId: shooter,
        assistId,
      };
      next.scorers = [...next.scorers, scorer];
      next.ratings[shooter] = clamp((next.ratings[shooter] ?? 6.3) + 1.05, 3, 10);
      if (assistId) next.ratings[assistId] = clamp((next.ratings[assistId] ?? 6.3) + 0.55, 3, 10);
      const concedeIds = attackSide === "home" ? next.awayXi : next.homeXi;
      const concedeForm = attackSide === "home" ? next.awayForm : next.homeForm;
      concedeIds.forEach((id, i) => {
        const slot = FORMATIONS[concedeForm][i];
        if (!slot || next.off.includes(id)) return;
        const hit = slot.pos === "GK" ? 0.22 : lineOf(slot.pos) === "def" ? 0.12 : 0;
        if (hit) next.ratings[id] = clamp((next.ratings[id] ?? 6.3) - hit, 3, 10);
      });
      const hs = next.homeScore;
      const as = next.awayScore;
      const assistName = assistId ? nameOf(map, assistId) : "";
      pushLog(
        `${nameOf(map, shooter)} scores${assistName ? `, ${assistName} with the pass` : ""}. ${hs}–${as}.`,
        "goal",
      );
      next.ball = attackSide === "home" ? { x: 92, y: 50 } : { x: 8, y: 50 };
    } else if (onTarget) {
      next.ratings[shooter] = clamp((next.ratings[shooter] ?? 6.3) + 0.12, 3, 10);
      const gk = attackSide === "home" ? away.gk : home.gk;
      if (gk) next.ratings[gk] = clamp((next.ratings[gk] ?? 6.3) + 0.08, 3, 10);
      pushLog(
        gk
          ? `${nameOf(map, gk)} keeps out ${nameOf(map, shooter)}.`
          : `${nameOf(map, shooter)} forces a save.`,
        "chance",
      );
      next.ball = attackSide === "home" ? { x: 86, y: 48 } : { x: 14, y: 52 };
    } else {
      next.ratings[shooter] = clamp((next.ratings[shooter] ?? 6.3) + 0.04, 3, 10);
      pushLog(`${nameOf(map, shooter)} leans back and misses the target.`, "chance");
      next.ball = attackSide === "home" ? { x: 80, y: unit(next.seed, minute, 13) > 0.5 ? 10 : 90 } : { x: 20, y: 50 };
    }
  } else if (roll < chanceP + 0.018) {
    const pool = attackSide === "home" ? next.awayXi : next.homeXi;
    const form = attackSide === "home" ? next.awayForm : next.homeForm;
    const candidates = pool
      .map((id, i) => ({ id, pos: form ? FORMATIONS[form][i]?.pos : undefined }))
      .filter((x) => x.pos && x.pos !== "GK" && !next.off.includes(x.id));
    const fouler = candidates[Math.floor(unit(next.seed, minute, 14) * candidates.length)];
    if (fouler) {
      const y = (next.yellow[fouler.id] ?? 0) + 1;
      next.yellow[fouler.id] = y;
      if (y >= 2 || unit(next.seed, minute, 15) < 0.045) {
        next.off = [...next.off, fouler.id];
        next.wentOff[fouler.id] = minute;
        next.ratings[fouler.id] = clamp((next.ratings[fouler.id] ?? 6.3) - 0.7, 3, 10);
        pushLog(`Red card. ${nameOf(map, fouler.id)} is off.`, "card");
      } else if (unit(next.seed, minute, 16) < 0.55) {
        next.ratings[fouler.id] = clamp((next.ratings[fouler.id] ?? 6.3) - 0.28, 3, 10);
        pushLog(`Yellow card for ${nameOf(map, fouler.id)}.`, "card");
      } else {
        pushLog(`Free kick. ${nameOf(map, fouler.id)} is spoken to.`, "info");
      }
    }
  } else if (roll < chanceP + 0.022) {
    const ids = attackSide === "home" ? next.homeXi : next.awayXi;
    const form = attackSide === "home" ? next.homeForm : next.awayForm;
    const victim = ids
      .map((id, i) => ({ id, pos: FORMATIONS[form][i]?.pos }))
      .filter((x) => x.pos && x.pos !== "GK" && !next.off.includes(x.id));
    const hit = victim[Math.floor(unit(next.seed, minute, 17) * victim.length)];
    if (hit && unit(next.seed, minute, 18) < 0.55) {
      const weeks = 1 + Math.floor(unit(next.seed, minute, 19) * 3);
      next.hurt = [...next.hurt, { id: hit.id, weeks }];
      next.off = [...next.off, hit.id];
      next.wentOff[hit.id] = minute;
      const side = attackSide;
      const bench = side === "home" ? next.homeBench : next.awayBench;
      const subs = side === "home" ? next.subsH : next.subsA;
      const forced = forceSub(next, map, side, hit.id, bench, subs, minute);
      if (forced) {
        pushLog(`${nameOf(map, hit.id)} is hurt. ${nameOf(map, forced)} comes on.`, "sub");
      } else {
        pushLog(`${nameOf(map, hit.id)} is hurt and the side is down a player.`, "card");
      }
    }
  }

  if (minute === 45) {
    next.paused = true;
    pushLog(`Half-time. ${next.homeScore}–${next.awayScore}.`, "info");
  }
  if (minute === 90) {
    if (next.competition === "cup" && next.homeScore === next.awayScore) {
      next.period = "et";
      next.paused = true;
      pushLog(`Level at ninety. Extra time.`, "info");
    } else {
      finishMatch(next, pushLog);
    }
  }
  if (minute === 105 && next.period === "et") {
    next.paused = true;
    pushLog(`Extra-time break. ${next.homeScore}–${next.awayScore}.`, "info");
  }
  if (minute === 120 && next.period === "et") {
    if (next.homeScore === next.awayScore) {
      next.period = "pens";
      next.paused = false;
      next.penHome = 0;
      next.penAway = 0;
      next.penKicks = [];
      next.penNext = "home";
      pushLog(`Still level. Penalties decide it.`, "info");
    } else {
      finishMatch(next, pushLog);
    }
  }

  aiSub(next, map, "home", minute);
  aiSub(next, map, "away", minute);

  const placed = placeDots(next, attackSide);
  if (!next.ball || next.ball.x === live.ball.x) next.ball = placed.ball;
  next.dots = placed.dots;
  return next;
}

function forceSub(
  live: LiveMatch,
  map: Map<string, Player>,
  side: "home" | "away",
  offId: string,
  bench: string[],
  subs: number,
  minute: number,
) {
  if (subs >= MAX_SUBS) return "";
  const xi = side === "home" ? live.homeXi : live.awayXi;
  const idx = xi.indexOf(offId);
  if (idx < 0) return "";
  const slot = FORMATIONS[side === "home" ? live.homeForm : live.awayForm][idx];
  const on = bench
    .map((id) => map.get(id))
    .filter((p): p is Player => !!p)
    .sort((a, b) => (slot ? dutyFit(b, slot.pos) * ovr(b) - dutyFit(a, slot.pos) * ovr(a) : 0))[0];
  if (!on || !slot) return "";
  applySub(live, side, offId, on.id, minute);
  return on.id;
}

function applySub(live: LiveMatch, side: "home" | "away", offId: string, onId: string, minute: number) {
  const xi = side === "home" ? live.homeXi : live.awayXi;
  const idx = xi.indexOf(offId);
  if (idx < 0) return;
  xi[idx] = onId;
  if (side === "home") {
    live.homeBench = live.homeBench.filter((id) => id !== onId);
    live.subsH += 1;
  } else {
    live.awayBench = live.awayBench.filter((id) => id !== onId);
    live.subsA += 1;
  }
  live.wentOff[offId] = minute;
  live.cameOn[onId] = minute;
  live.wentOff[onId] = live.period === "et" ? 120 : 90;
  const pStamina = 78;
  live.stamina[onId] = pStamina;
  live.ratings[onId] = 6.3;
  if (!live.off.includes(offId)) live.off = live.off.filter((id) => id !== offId);
}

function aiSub(live: LiveMatch, map: Map<string, Player>, side: "home" | "away", minute: number) {
  if (live.userSide === side) return;
  if (minute !== 60 && minute !== 72 && minute !== 82 && minute !== 100 && minute !== 110) return;
  const subs = side === "home" ? live.subsH : live.subsA;
  if (subs >= 3) return;
  const xi = side === "home" ? live.homeXi : live.awayXi;
  const form = side === "home" ? live.homeForm : live.awayForm;
  let worst = -1;
  let worstSt = 999;
  xi.forEach((id, i) => {
    const slot = FORMATIONS[form][i];
    if (!slot || slot.pos === "GK" || live.off.includes(id)) return;
    const st = live.stamina[id] ?? 100;
    if (st < worstSt) {
      worstSt = st;
      worst = i;
    }
  });
  if (worst < 0 || worstSt > 62) return;
  const offId = xi[worst];
  if (!offId) return;
  const bench = side === "home" ? live.homeBench : live.awayBench;
  const on = forceSub(live, map, side, offId, bench, subs, minute);
  if (on) {
    live.log = [
      ...live.log,
      { minute, kind: "sub" as const, text: `${nameOf(map, on)} replaces ${nameOf(map, offId)}.` },
    ];
  }
}

export function userSubstitute(live: LiveMatch, players: Player[], offId: string, onId: string): LiveMatch | string {
  if (live.finished || live.period === "pens") return "The match is over.";
  const side = live.userSide;
  const subs = side === "home" ? live.subsH : live.subsA;
  if (subs >= MAX_SUBS) return "No substitutions left.";
  if (live.off.includes(offId)) return "That player is already off.";
  const xi = side === "home" ? live.homeXi : live.awayXi;
  const bench = side === "home" ? live.homeBench : live.awayBench;
  if (!xi.includes(offId) || !bench.includes(onId)) return "Pick a starter and a substitute.";
  const idx = xi.indexOf(offId);
  const slot = FORMATIONS[side === "home" ? live.homeForm : live.awayForm][idx];
  const on = players.find((p) => p.id === onId);
  if (slot?.pos === "GK" && on && on.pos !== "GK") return "Only a goalkeeper can take the gloves.";
  if (slot && on && slot.pos !== "GK" && on.pos === "GK") return "Don't put the goalkeeper outfield.";
  const next = cloneLive(live);
  applySub(next, side, offId, onId, live.minute);
  next.log = [
    ...next.log,
    {
      minute: live.minute,
      kind: "sub",
      text: `${on?.name ?? "Sub"} replaces ${players.find((p) => p.id === offId)?.name ?? "starter"}.`,
    },
  ];
  return next;
}

export function liveReorderXi(
  live: LiveMatch,
  players: Player[],
  formation: FormationId,
  userSide: "home" | "away",
): LiveMatch {
  if (live.finished || live.period === "pens") return live;
  const next = cloneLive(live);
  if (userSide === "home") next.homeForm = formation;
  else next.awayForm = formation;
  const xi = (userSide === "home" ? next.homeXi : next.awayXi).slice();
  const slots = FORMATIONS[formation];
  const pool = xi.map((id) => players.find((p) => p.id === id)).filter((p): p is Player => !!p);
  const ordered: string[] = [];
  const used = new Set<string>();
  for (const slot of slots) {
    let best: Player | null = null;
    let bestScore = -1;
    for (const p of pool) {
      if (used.has(p.id) || next.off.includes(p.id)) continue;
      const sc = dutyFit(p, slot.pos) * ovr(p);
      if (sc > bestScore) {
        bestScore = sc;
        best = p;
      }
    }
    if (best) {
      ordered.push(best.id);
      used.add(best.id);
    }
  }
  for (const p of pool) if (!used.has(p.id)) ordered.push(p.id);
  if (ordered.length === 11) {
    if (userSide === "home") next.homeXi = ordered;
    else next.awayXi = ordered;
  }
  next.log = [
    ...next.log,
    { minute: live.minute, kind: "info", text: `Shape changed to ${formation}.` },
  ];
  const placed = placeDots(next, "mid");
  next.dots = placed.dots;
  next.ball = placed.ball;
  return next;
}

export function simulateLive(state: SaveData, fixtureId: string, tone: PressTone) {
  let live = createLive(state, fixtureId, tone);
  let guard = 0;
  while (!live.finished && guard < 220) {
    if (live.paused) live = { ...live, paused: false };
    live = stepMatch(live, state);
    guard++;
  }
  return live;
}
