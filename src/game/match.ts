import { FORMATION_IDS, FORMATIONS, lineOf, ordersForStyle, tacticMods } from "./data";
import type { BuildUp, FormationId, LineHeight } from "./types";
import { dutyFit, ovr, pickXi } from "./players";
import type {
  LiveMatch,
  MatchScene,
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
  const ages = ids.map((id) => map.get(id)?.age ?? 0).filter((age) => age > 0);
  const old = ages.filter((age) => age >= 33).length;
  const kids = ages.filter((age) => age <= 20).length;
  const prime = ages.filter((age) => age >= 24 && age <= 30).length;
  let ageMul = 1;
  if (old >= 4) ageMul -= 0.045;
  if (kids >= 6) ageMul -= 0.03;
  if (prime >= 6) ageMul += 0.035;
  return {
    defAvg: avg(def, defN) * defM * ageMul,
    midAvg: avg(mid, midN) * midM * ageMul + spirit * 0.35,
    atkAvg: avg(atk, atkN) * atkM * ageMul + spirit * 0.45,
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
      ? { x: 70 + unit(live.seed, live.minute, 1) * 20, y: 16 + unit(live.seed, live.minute, 2) * 68 }
      : attacking === "away"
        ? { x: 10 + unit(live.seed, live.minute, 1) * 20, y: 16 + unit(live.seed, live.minute, 2) * 68 }
        : { x: 42 + unit(live.seed, live.minute, 1) * 16, y: 30 + unit(live.seed, live.minute, 2) * 40 };
  const paint = (ids: string[], form: LiveMatch["homeForm"], side: "home" | "away") => {
    const slots = FORMATIONS[form];
    const lean = attacking === side ? 0.38 : attacking === "mid" ? 0.16 : 0.1;
    const push = attacking === "home" ? (side === "home" ? 8 : -4) : attacking === "away" ? (side === "away" ? -8 : 4) : 0;
    ids.forEach((id, i) => {
      const slot = slots[i];
      if (!slot || live.off.includes(id)) return;
      const x0 = side === "home" ? slot.x : 100 - slot.x;
      const y0 = slot.y;
      const jx = (unit(live.seed, live.minute, i, side === "home" ? 3 : 4) - 0.5) * 7;
      const jy = (unit(live.seed, live.minute, i, 5) - 0.5) * 8;
      dots[id] = {
        x: clamp(x0 * (1 - lean) + ball.x * lean + jx + push, 5, 95),
        y: clamp(y0 * (1 - lean * 0.7) + ball.y * lean * 0.7 + jy, 7, 93),
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
    possH: 50,
    attackSide: "home",
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
        text: `The teams emerge at ${homeClub?.stadium ?? "the ground"}. ${homeClub?.name ?? "Home"} against ${awayClub?.name ?? "Away"}.`,
      },
    ],
    ball: { x: 50, y: 50 },
    dots: {},
    scene: null,
    finished: false,
    subsH: 0,
    subsA: 0,
    cameOn,
    wentOff,
    spirit: tone === "bold" ? 2.4 : tone === "deflect" ? 1 : 0.4,
    pressTone: tone,
    paused: true,
    speed: 1,
    shouts: [],
    userSide,
    period: "regulation",
    stage: "tunnel",
    htTalk: null,
    htPlan: null,
    penHome: 0,
    penAway: 0,
    penKicks: [],
    penNext: "home",
    restartSide: null,
    phaseChain: null,
    addedTime: 0,
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
  next.restartSide = null;
  next.stage = "live";
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

  const map = byId(state.players);
  /* Centre restart after a goal — same as real football */
  if (live.restartSide && !live.finished) {
    const restarted = applyKickOffScene({ ...live, restartSide: null, paused: false }, live.restartSide);
    return { ...restarted, restartSide: null, phaseChain: "kickoff" };
  }

  const hardCap =
    live.period === "et" ? 120 + Math.max(live.addedTime || 0, 0) : 90 + Math.max(live.addedTime || 0, 0);
  if (live.minute >= hardCap && (live.period !== "regulation" || (live.addedTime || 0) > 0 || live.minute > 90)) {
    return live;
  }

  const minute = live.minute + 1;
  const next = cloneLive(live);
  next.minute = minute;
  next.scene = null;
  if (next.restartSide == null) next.restartSide = null;
  if (next.phaseChain === undefined) next.phaseChain = null;
  if (next.addedTime == null) next.addedTime = 0;

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
  /* Keep the ball more often — teams recycle possession like real matches */
  const keepBall = unit(next.seed, minute, 6) < 0.62;
  let attackSide: "home" | "away" =
    keepBall && live.attackSide ? live.attackSide : unit(next.seed, minute, 7) < pHome ? "home" : "away";
  /* After a kick-off / goal-kick, that side builds from the back */
  if (live.phaseChain === "kickoff" || live.phaseChain === "goalkick") {
    attackSide = live.attackSide;
  }
  next.attackSide = attackSide;
  const prevHomeTicks = (next.possH / 100) * (minute - 1);
  const homeTicks = prevHomeTicks + (attackSide === "home" ? 1 : 0);
  next.possH = Math.round((homeTicks / minute) * 100);
  const atk = attackSide === "home" ? home : away;
  const defAvg = attackSide === "home" ? away.defAvg : home.defAvg;
  const atkMods = attackSide === "home" ? homeMods : awayMods;
  const defMods = attackSide === "home" ? awayMods : homeMods;
  const chain = live.phaseChain;
  const chainBoost =
    chain === "build" || chain === "cross" || chain === "shot" ? 0.08 : chain === "kickoff" || chain === "goalkick" ? 0.04 : 0;
  const chanceP = clamp(0.1 + (atk.atkAvg - defAvg) / 170 + atkMods.chance + defMods.exposed + chainBoost, 0.05, 0.32);
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
      const gkId = attackSide === "home" ? away.gk : home.gk;
      const strikeX = attackSide === "home" ? 82 : 18;
      const netX = attackSide === "home" ? 97.5 : 2.5;
      const netY = 42 + unit(next.seed, minute, 41) * 16;
      next.scene = {
        minute,
        kind: "goal",
        text: `GOAL. ${nameOf(map, shooter)}`,
        actorId: shooter,
        mateId: assistId,
        keeperId: gkId,
        side: attackSide,
        freeze: true,
        via: "open",
        ballFrom: { x: strikeX + (attackSide === "home" ? 3 : -3), y: 50 },
      };
      next.ball = { x: netX, y: netY };
      /* Conceding team restarts from the centre circle */
      next.restartSide = attackSide === "home" ? "away" : "home";
      next.phaseChain = "goal";
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
      next.scene = {
        minute,
        kind: "save",
        text: gk ? `${nameOf(map, gk)} saves` : "Saved",
        actorId: shooter,
        keeperId: gk,
        side: attackSide,
        freeze: true,
      };
      next.ball = attackSide === "home" ? { x: 86, y: 48 } : { x: 14, y: 52 };
      next.phaseChain = "save";
    } else {
      next.ratings[shooter] = clamp((next.ratings[shooter] ?? 6.3) + 0.04, 3, 10);
      pushLog(`${nameOf(map, shooter)} leans back and misses the target.`, "chance");
      next.scene = {
        minute,
        kind: "miss",
        text: `${nameOf(map, shooter)} misses`,
        actorId: shooter,
        side: attackSide,
        freeze: false,
      };
      next.ball = attackSide === "home" ? { x: 80, y: unit(next.seed, minute, 13) > 0.5 ? 10 : 90 } : { x: 20, y: 50 };
      next.phaseChain = "miss";
    }
  } else if (roll < chanceP + 0.045) {
    // Foul / free kick / penalty / cards — whistle always blows
    const pool = attackSide === "home" ? next.awayXi : next.homeXi;
    const form = attackSide === "home" ? next.awayForm : next.homeForm;
    const candidates = pool
      .map((id, i) => ({ id, pos: form ? FORMATIONS[form][i]?.pos : undefined }))
      .filter((x) => x.pos && x.pos !== "GK" && !next.off.includes(x.id));
    const fouler = candidates[Math.floor(unit(next.seed, minute, 14) * candidates.length)];
    const atkIds = attackSide === "home" ? next.homeXi : next.awayXi;
    const victimId = atk.attackers[0]?.id ?? atkIds[Math.floor(unit(next.seed, minute, 23) * atkIds.length)] ?? "";
    const foulSide: "home" | "away" = attackSide === "home" ? "away" : "home";
    const inBox = unit(next.seed, minute, 24) < 0.14;
    if (fouler && inBox) {
      const takerId = victimId || fouler.id;
      const gkId = attackSide === "home" ? away.gk : home.gk;
      const spotX = attackSide === "home" ? 88 : 12;
      const netX = attackSide === "home" ? 97.5 : 2.5;
      pushLog(`Penalty. ${nameOf(map, fouler.id)} brings ${nameOf(map, victimId)} down in the area.`, "chance");
      const penXg = 0.76;
      if (attackSide === "home") {
        next.shotsH += 1;
        next.onH += 1;
        next.xgH = Math.round((next.xgH + penXg) * 100) / 100;
      } else {
        next.shotsA += 1;
        next.onA += 1;
        next.xgA = Math.round((next.xgA + penXg) * 100) / 100;
      }
      if (unit(next.seed, minute, 25) < penXg) {
        if (attackSide === "home") next.homeScore += 1;
        else next.awayScore += 1;
        next.scorers = [
          ...next.scorers,
          { name: nameOf(map, takerId), minute, side: attackSide, playerId: takerId },
        ];
        next.ratings[takerId] = clamp((next.ratings[takerId] ?? 6.3) + 0.9, 3, 10);
        pushLog(`${nameOf(map, takerId)} scores from the spot. ${next.homeScore}–${next.awayScore}.`, "goal");
        const netY = 44 + unit(next.seed, minute, 42) * 12;
        next.scene = {
          minute,
          kind: "goal",
          text: `GOAL from the spot. ${nameOf(map, takerId)}`,
          actorId: takerId,
          mateId: fouler.id,
          keeperId: gkId,
          side: attackSide,
          freeze: true,
          via: "penalty",
          ballFrom: { x: spotX, y: 50 },
        };
        next.ball = { x: netX, y: netY };
        next.restartSide = attackSide === "home" ? "away" : "home";
        next.phaseChain = "goal";
      } else {
        if (gkId) next.ratings[gkId] = clamp((next.ratings[gkId] ?? 6.3) + 0.35, 3, 10);
        pushLog(gkId ? `${nameOf(map, gkId)} saves the penalty.` : "Penalty missed.", "chance");
        next.scene = {
          minute,
          kind: "save",
          text: gkId ? `${nameOf(map, gkId)} saves the penalty` : "Penalty missed",
          actorId: takerId,
          mateId: fouler.id,
          keeperId: gkId,
          side: attackSide,
          freeze: true,
          via: "penalty",
          ballFrom: { x: spotX, y: 50 },
        };
        next.ball = { x: attackSide === "home" ? 93 : 7, y: 48 + unit(next.seed, minute, 43) * 8 };
        next.phaseChain = "save";
      }
      const y = (next.yellow[fouler.id] ?? 0) + 1;
      next.yellow[fouler.id] = y;
      if (y >= 2 || unit(next.seed, minute, 26) < 0.2) {
        next.off = [...next.off, fouler.id];
        next.wentOff[fouler.id] = minute;
        pushLog(`Red card. ${nameOf(map, fouler.id)} is sent off.`, "card");
      } else {
        pushLog(`Yellow card for ${nameOf(map, fouler.id)}.`, "card");
      }
    } else if (fouler) {
      const fkX = attackSide === "home" ? 62 + unit(next.seed, minute, 27) * 12 : 38 - unit(next.seed, minute, 27) * 12;
      const fkY = 28 + unit(next.seed, minute, 44) * 44;
      const kicker =
        victimId ||
        atk.creators[0]?.id ||
        atk.attackers[0]?.id ||
        (attackSide === "home" ? next.homeXi[7] : next.awayXi[7]) ||
        "";
      const y = (next.yellow[fouler.id] ?? 0) + 1;
      next.yellow[fouler.id] = y;
      if (y >= 2 || unit(next.seed, minute, 15) < 0.045) {
        next.off = [...next.off, fouler.id];
        next.wentOff[fouler.id] = minute;
        next.ratings[fouler.id] = clamp((next.ratings[fouler.id] ?? 6.3) - 0.7, 3, 10);
        pushLog(`Red card. ${nameOf(map, fouler.id)} is off.`, "card");
        next.scene = {
          minute,
          kind: "card",
          text: `Red card. ${nameOf(map, fouler.id)}`,
          actorId: fouler.id,
          mateId: kicker || undefined,
          side: foulSide,
          freeze: true,
        };
        next.ball = { x: fkX, y: fkY };
      } else {
        if (unit(next.seed, minute, 16) < 0.55) {
          next.ratings[fouler.id] = clamp((next.ratings[fouler.id] ?? 6.3) - 0.28, 3, 10);
          pushLog(`Foul and yellow. ${nameOf(map, fouler.id)}. Free kick.`, "card");
        } else {
          pushLog(`Free kick. ${nameOf(map, fouler.id)} is spoken to.`, "info");
        }
        const targetX = attackSide === "home" ? 92 : 8;
        const targetY = 40 + unit(next.seed, minute, 45) * 20;
        next.scene = {
          minute,
          kind: "freekick",
          text: `Free kick. ${nameOf(map, kicker)}`,
          actorId: kicker,
          mateId: fouler.id,
          keeperId: attackSide === "home" ? away.gk : home.gk,
          side: attackSide,
          freeze: true,
          via: "freekick",
          ballFrom: { x: fkX, y: fkY },
        };
        next.ball = { x: targetX, y: targetY };
      }
    }
  } else if (roll < chanceP + 0.062) {
    // Offside
    const flagId = atk.attackers[0]?.id ?? (attackSide === "home" ? next.homeXi[9] : next.awayXi[9]) ?? "";
    pushLog(`Offside. Flag up against ${nameOf(map, flagId)}.`, "info");
    next.scene = {
      minute,
      kind: "offside",
      text: `Offside. ${nameOf(map, flagId)}`,
      actorId: flagId,
      side: attackSide,
      freeze: true,
    };
    next.ball = attackSide === "home" ? { x: 78, y: 45 } : { x: 22, y: 55 };
  } else if (roll < chanceP + 0.08) {
    // Corner
    const kicker = atk.creators[0]?.id ?? atk.attackers[0]?.id ?? "";
    const nearFlag = unit(next.seed, minute, 28) > 0.5;
    const cornerY = nearFlag ? 6 : 94;
    const boxY = nearFlag ? 38 : 62;
    pushLog(`Corner to ${attackSide === "home" ? "the home side" : "the visitors"}.`, "chance");
    next.scene = {
      minute,
      kind: "corner",
      text: `Corner. ${nameOf(map, kicker)}`,
      actorId: kicker,
      mateId: atk.attackers[0]?.id,
      keeperId: attackSide === "home" ? away.gk : home.gk,
      side: attackSide,
      freeze: true,
      via: "corner",
      ballFrom: { x: attackSide === "home" ? 98 : 2, y: cornerY },
    };
    next.ball = { x: attackSide === "home" ? 88 : 12, y: boxY };
  } else if (roll < chanceP + 0.095) {
    // Throw-in
    const pool = attackSide === "home" ? next.homeXi : next.awayXi;
    const form = attackSide === "home" ? next.homeForm : next.awayForm;
    const throwers = pool
      .map((id, i) => ({ id, pos: FORMATIONS[form][i]?.pos }))
      .filter((x) => x.pos && x.pos !== "GK" && !next.off.includes(x.id));
    const thrower = throwers[Math.floor(unit(next.seed, minute, 46) * throwers.length)]?.id ?? pool[2] ?? "";
    const top = unit(next.seed, minute, 47) > 0.5;
    const tx = 25 + unit(next.seed, minute, 48) * 50;
    const ty = top ? 3 : 97;
    pushLog(`Throw-in. ${nameOf(map, thrower)}.`, "info");
    next.scene = {
      minute,
      kind: "throwin",
      text: `Throw-in. ${nameOf(map, thrower)}`,
      actorId: thrower,
      mateId: atk.creators[0]?.id ?? atk.attackers[0]?.id,
      side: attackSide,
      freeze: true,
      ballFrom: { x: tx, y: ty },
    };
    next.ball = {
      x: clamp(tx + (attackSide === "home" ? 8 : -8), 12, 88),
      y: top ? 18 : 82,
    };
  } else if (roll < chanceP + 0.105) {
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
      next.scene = {
        minute,
        kind: "foul",
        text: `Injury stoppage. Whistle.`,
        actorId: hit.id,
        side,
        freeze: true,
      };
      if (forced) {
        pushLog(`${nameOf(map, hit.id)} is hurt. ${nameOf(map, forced)} comes on.`, "sub");
      } else {
        pushLog(`${nameOf(map, hit.id)} is hurt and the side is down a player.`, "card");
      }
    }
  }

  if (minute === 45) {
    next.paused = true;
    next.stage = "ht-talk";
    next.addedTime = 0;
    next.restartSide = null;
    const plan = buildHalfTimePlan(next, map, state);
    next.htPlan = plan.changes;
    next.htTalk = plan.talk;
    pushLog(`Half-time. ${next.homeScore}–${next.awayScore}. ${state.manager.name} gathers the side.`, "info");
  }

  /* Stoppage time at ninety, then full time / extra time */
  if (minute === 90 && next.period === "regulation" && !next.addedTime) {
    next.addedTime = 1 + Math.floor(unit(next.seed, minute, 90) * 4);
    pushLog(`Minimum ${next.addedTime} minute${next.addedTime === 1 ? "" : "s"} of added time.`, "info");
  }
  const regEnd = 90 + (next.period === "regulation" ? next.addedTime : 0);
  if (next.period === "regulation" && minute >= regEnd && minute >= 90 && next.addedTime > 0) {
    if ((next.competition === "cup" || next.competition === "playoff") && next.homeScore === next.awayScore) {
      next.period = "et";
      next.paused = true;
      next.addedTime = 0;
      pushLog(`Level after ninety. Extra time.`, "info");
    } else {
      finishMatch(next, pushLog);
    }
  } else if (minute === 90 && next.period === "regulation" && next.addedTime === 0) {
    /* safety: no stoppage rolled */
    if ((next.competition === "cup" || next.competition === "playoff") && next.homeScore === next.awayScore) {
      next.period = "et";
      next.paused = true;
      pushLog(`Level at ninety. Extra time.`, "info");
    } else {
      finishMatch(next, pushLog);
    }
  }

  if (minute === 105 && next.period === "et") {
    next.paused = true;
    next.addedTime = 0;
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
  next.dots = placed.dots;

  /* Goal kick for the defending keeper after a save / miss */
  if (!next.scene && (chain === "save" || chain === "miss")) {
    const defSide: "home" | "away" = attackSide === "home" ? "away" : "home";
    const def = defSide === "home" ? home : away;
    const gkId = def.gk ?? (defSide === "home" ? next.homeXi[0] : next.awayXi[0]) ?? "";
    const outX = defSide === "home" ? 28 : 72;
    pushLog(`Goal kick. ${nameOf(map, gkId)} restarts.`, "info");
    next.scene = {
      minute,
      kind: "goalkick",
      text: `Goal kick. ${nameOf(map, gkId)}`,
      actorId: gkId,
      keeperId: gkId,
      side: defSide,
      freeze: true,
      ballFrom: { x: defSide === "home" ? 6 : 94, y: 50 },
    };
    next.ball = { x: outX, y: 35 + unit(next.seed, minute, 51) * 30 };
    next.attackSide = defSide;
    next.phaseChain = "goalkick";
  }

  if (!next.scene) {
    const ids = attackSide === "home" ? next.homeXi : next.awayXi;
    const creators = atk.creators.map((c) => c.id);
    const attackers = atk.attackers.map((a) => a.id);
    let kind: MatchScene["kind"] = "build";
    let actorId = ids[Math.floor(unit(next.seed, minute, 21) * ids.length)] ?? ids[0] ?? "";
    /* Attack progression: build → wide cross → shot */
    if (chain === "build" || chain === "goalkick" || chain === "kickoff") {
      kind = unit(next.seed, minute, 22) < 0.45 ? "cross" : unit(next.seed, minute, 22) < 0.75 ? "build" : "shot";
      actorId =
        kind === "cross"
          ? creators[0] ?? actorId
          : kind === "shot"
            ? attackers[0] ?? actorId
            : creators[0] ?? actorId;
    } else if (chain === "cross") {
      kind = unit(next.seed, minute, 22) < 0.55 ? "shot" : "build";
      actorId = kind === "shot" ? attackers[0] ?? actorId : creators[0] ?? actorId;
    } else if (chain === "shot") {
      kind = "build";
      actorId = creators[0] ?? actorId;
    } else {
      kind = unit(next.seed, minute, 22) > 0.7 ? "cross" : "build";
      actorId = kind === "cross" ? creators[0] ?? actorId : actorId;
    }
    const text =
      kind === "cross"
        ? "Ball switched wide — cross coming in."
        : kind === "shot"
          ? "Shot brewing at the edge of the box."
          : "Recycled through midfield.";
    next.scene = {
      minute,
      kind,
      text,
      actorId,
      mateId: kind === "shot" ? creators[0] : attackers[0],
      keeperId: attackSide === "home" ? away.gk : home.gk,
      side: attackSide,
      freeze: kind === "shot",
    };
    next.phaseChain = kind;
  } else if (!next.phaseChain) {
    next.phaseChain = next.scene.kind;
  }
  if (!next.ball) next.ball = placed.ball;
  layScene(next);
  return next;
}

function layScene(next: LiveMatch) {
  const scene = next.scene;
  if (!scene) return;
  const homeAtt = scene.side === "home";
  const boxX = homeAtt ? 82 : 18;
  const goalX = homeAtt ? 94 : 6;
  const put = (id: string | undefined, x: number, y: number) => {
    if (!id || !next.dots[id]) return;
    next.dots[id] = { x, y };
  };
  const wallIds = (defending: "home" | "away", n: number) => {
    const xi = defending === "home" ? next.homeXi : next.awayXi;
    return xi.filter((id) => id !== scene.keeperId && !next.off.includes(id)).slice(0, n);
  };

  if (scene.kind === "kickoff") {
    put(scene.actorId, 49.2, 50);
    put(scene.mateId, 52.5, 47);
    const homeXi = next.homeXi.filter((id) => id !== scene.actorId && id !== scene.mateId && !next.off.includes(id));
    const awayXi = next.awayXi.filter((id) => id !== scene.actorId && id !== scene.mateId && !next.off.includes(id));
    homeXi.forEach((id, i) => {
      if (next.dots[id]) next.dots[id] = { x: 28 + (i % 5) * 4.5, y: 18 + Math.floor(i / 5) * 28 };
    });
    awayXi.forEach((id, i) => {
      if (next.dots[id]) next.dots[id] = { x: 58 + (i % 5) * 4.5, y: 18 + Math.floor(i / 5) * 28 };
    });
    if (!scene.ballFrom) scene.ballFrom = { x: 50, y: 50 };
    next.ball = { x: homeAtt ? 56 : 44, y: 48 };
  } else if (scene.kind === "build") {
    put(scene.actorId, homeAtt ? 58 : 42, 48);
    next.ball = { x: homeAtt ? 63 : 37, y: 50 };
  } else if (scene.kind === "cross") {
    put(scene.actorId, homeAtt ? 74 : 26, 16);
    next.ball = { x: homeAtt ? 78 : 22, y: 18 };
  } else if (scene.kind === "foul" || scene.kind === "card" || scene.kind === "tackle") {
    put(scene.actorId, homeAtt ? 55 : 45, 46);
    put(scene.mateId, homeAtt ? 60 : 40, 42);
    next.ball = { x: homeAtt ? 58 : 42, y: 50 };
  } else if (scene.kind === "offside") {
    put(scene.actorId, homeAtt ? 82 : 18, 42);
    next.ball = { x: homeAtt ? 78 : 22, y: 48 };
  } else if (scene.kind === "corner") {
    const from = scene.ballFrom ?? { x: homeAtt ? 98 : 2, y: 8 };
    put(scene.actorId, from.x > 50 ? 96 : 4, from.y < 50 ? 8 : 92);
    put(scene.mateId, homeAtt ? 86 : 14, 48);
    put(scene.keeperId, goalX, 50);
    const pack = (homeAtt ? next.homeXi : next.awayXi).filter((id) => id !== scene.actorId && !next.off.includes(id)).slice(0, 4);
    pack.forEach((id, i) => put(id, homeAtt ? 84 + (i % 2) * 4 : 16 - (i % 2) * 4, 36 + Math.floor(i / 2) * 14));
    if (!scene.ballFrom) scene.ballFrom = { ...from };
  } else if (scene.kind === "penalty" || (scene.kind === "goal" && scene.via === "penalty") || (scene.kind === "save" && scene.via === "penalty")) {
    const spotX = homeAtt ? 88 : 12;
    put(scene.actorId, spotX - (homeAtt ? 2.5 : -2.5), 50);
    put(scene.keeperId, goalX, 50);
    /* clear the box — wall stays out */
    wallIds(homeAtt ? "away" : "home", 4).forEach((id, i) => {
      put(id, homeAtt ? 70 - i * 2 : 30 + i * 2, 30 + i * 12);
    });
    if (!scene.ballFrom) scene.ballFrom = { x: spotX, y: 50 };
    if (scene.kind === "penalty") next.ball = { x: spotX, y: 50 };
  } else if (scene.kind === "freekick") {
    const from = scene.ballFrom ?? { x: homeAtt ? 68 : 32, y: 45 };
    put(scene.actorId, from.x - (homeAtt ? 2 : -2), from.y);
    put(scene.keeperId, goalX, 50);
    wallIds(homeAtt ? "away" : "home", 4).forEach((id, i) => {
      put(id, homeAtt ? from.x + 10 + i * 0.6 : from.x - 10 - i * 0.6, from.y - 6 + i * 4);
    });
    put(scene.mateId, homeAtt ? from.x - 6 : from.x + 6, from.y + 8);
    if (!scene.ballFrom) scene.ballFrom = { ...from };
  } else if (scene.kind === "throwin") {
    const from = scene.ballFrom ?? { x: 40, y: 3 };
    put(scene.actorId, from.x, from.y < 50 ? 5 : 95);
    put(scene.mateId, homeAtt ? from.x + 6 : from.x - 6, from.y < 50 ? 22 : 78);
    if (!scene.ballFrom) scene.ballFrom = { x: from.x, y: from.y < 50 ? 3 : 97 };
  } else if (scene.kind === "goalkick") {
    const from = scene.ballFrom ?? { x: homeAtt ? 6 : 94, y: 50 };
    put(scene.actorId, from.x, 50);
    put(scene.keeperId, from.x, 50);
    if (!scene.ballFrom) scene.ballFrom = { ...from };
  } else if (scene.kind === "miss") {
    put(scene.actorId, boxX, 40);
    if (!scene.ballFrom) scene.ballFrom = { x: boxX + (homeAtt ? 2 : -2), y: 44 };
    next.ball = { x: homeAtt ? 88 : 12, y: 10 };
  } else if (scene.kind === "goal") {
    put(scene.actorId, boxX, 48);
    put(scene.mateId, homeAtt ? 68 : 32, 24);
    put(scene.keeperId, goalX, 42);
    if (!scene.ballFrom) scene.ballFrom = { x: boxX + (homeAtt ? 3 : -3), y: 50 };
    if (!next.ball || Math.abs(next.ball.x - 50) < 30) {
      next.ball = { x: homeAtt ? 97.5 : 2.5, y: 48 };
    }
  } else if (scene.kind === "save") {
    put(scene.actorId, boxX, 48);
    put(scene.keeperId, goalX, 50);
    if (!scene.ballFrom) scene.ballFrom = { x: boxX + (homeAtt ? 4 : -4), y: 50 };
    next.ball = { x: homeAtt ? 90 : 10, y: 46 };
  } else if (scene.kind === "shot") {
    put(scene.actorId, boxX, 48);
    put(scene.keeperId, goalX, 50);
    next.ball = { x: homeAtt ? 90 : 10, y: 50 };
  } else {
    put(scene.actorId, boxX, 48);
    put(scene.mateId, homeAtt ? 68 : 32, 24);
    put(scene.keeperId, goalX, 50);
  }
}

/** Centre-circle kick-off (match start or second-half restart). */
export function applyKickOffScene(live: LiveMatch, side: "home" | "away"): LiveMatch {
  const next: LiveMatch = {
    ...live,
    dots: { ...live.dots },
    ball: { x: 50, y: 50 },
    attackSide: side,
  };
  const xi = side === "home" ? next.homeXi : next.awayXi;
  const taker = xi.find((id) => !next.off.includes(id) && next.dots[id]) ?? xi[9] ?? xi[8] ?? xi[0] ?? "";
  const mate =
    xi.find((id) => id !== taker && !next.off.includes(id)) ??
    (side === "home" ? next.homeXi[8] : next.awayXi[8]) ??
    "";
  const placed = placeDots(next, "mid");
  next.dots = placed.dots;
  next.scene = {
    minute: next.minute,
    kind: "kickoff",
    text: next.minute >= 45 ? "Second-half kick-off" : "Kick-off",
    actorId: taker,
    mateId: mate,
    side,
    freeze: true,
    ballFrom: { x: 50, y: 50 },
  };
  next.ball = { x: side === "home" ? 56 : 44, y: 48 };
  next.restartSide = null;
  next.phaseChain = "kickoff";
  next.attackSide = side;
  layScene(next);
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
  const from = live.dots[offId];
  if (from) {
    live.dots[onId] = { x: from.x, y: from.y };
    delete live.dots[offId];
  }
  if (!live.off.includes(offId)) live.off = live.off.filter((id) => id !== offId);
}

/** Build manager half-time talk + proposed changes for the user's side. */
export function buildHalfTimePlan(
  live: LiveMatch,
  map: Map<string, Player>,
  state: SaveData,
): { talk: string; changes: { offId: string; onId: string; reason: string }[] } {
  const side = live.userSide;
  const xi = side === "home" ? live.homeXi : live.awayXi;
  const bench = side === "home" ? live.homeBench : live.awayBench;
  const form = side === "home" ? live.homeForm : live.awayForm;
  const ahead =
    (side === "home" ? live.homeScore - live.awayScore : live.awayScore - live.homeScore) > 0;
  const behind =
    (side === "home" ? live.homeScore - live.awayScore : live.awayScore - live.homeScore) < 0;
  const talk = behind
    ? `${state.manager.name}: "We're a goal down. Heads up — I want more from the middle and a fresh pair of legs up top."`
    : ahead
      ? `${state.manager.name}: "Good first half. Keep the shape, don't gift them a way back. One change to keep us sharp."`
      : `${state.manager.name}: "Level at the break. Stay compact, win the second balls. I'm making a change."`;

  const changes: { offId: string; onId: string; reason: string }[] = [];
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
  if (worst >= 0 && worstSt < 78) {
    const offId = xi[worst]!;
    const offP = map.get(offId);
    const on = bench.find((id) => {
      const p = map.get(id);
      if (!p || live.off.includes(id)) return false;
      if (offP?.pos === "GK") return p.pos === "GK";
      return p.pos !== "GK";
    });
    if (on) {
      changes.push({
        offId,
        onId: on,
        reason: worstSt < 55 ? "Spent — legs gone" : behind ? "Need a spark" : "Fresh legs",
      });
    }
  }
  return { talk, changes };
}

function aiSub(live: LiveMatch, map: Map<string, Player>, side: "home" | "away", minute: number) {
  // Manager runs both benches in watch mode (user watches the game).
  if (minute !== 58 && minute !== 60 && minute !== 72 && minute !== 82 && minute !== 100 && minute !== 110) return;
  const subs = side === "home" ? live.subsH : live.subsA;
  if (subs >= 3) return;
  if (live.userSide === side && live.htPlan?.length && minute < 58) return;
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
