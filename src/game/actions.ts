import { SHAPES, SPONSORS, debtLimit, nextBuild, stadiumLevel, standsOf, upgradeCost, staffCost } from "./data";
import {
  SUPER_STADIUM_COST,
  facilityStepCost,
  makeManagerPool,
  outletUpgradeCost,
  transferCap,
  upgradeStepCost,
  weeklyFacilityCost,
} from "./fc";
import { liveReorderXi, userSubstitute } from "./match";
import { ovr, pickXi, valueFor, wageFor } from "./players";
import type { BudgetMode, ClubManager, FormationId, Mentality, Player, SaveData, StandId, TrainingFocus } from "./types";
import { clamp, money, unit } from "./util";
import { USER, leagueTable, sponsorWeekly, userPlayers, wageBill } from "./world";

export type Result = { save: SaveData; notice: string };

function squadCount(state: SaveData) {
  return userPlayers(state).filter((p) => p.loan !== "out").length;
}

function afford(state: SaveData, cost: number) {
  return state.cash >= cost;
}

export function openDeal(state: SaveData, id: string): Result {
  const player = state.players.find((p) => p.id === id);
  if (!player || player.clubId !== "market") return { save: state, notice: "That player has already moved." };
  if (squadCount(state) >= 24) return { save: state, notice: "The squad is full at 24." };
  if (state.deal) return { save: state, notice: "Finish the deal on the table first." };
  const cap = transferCap(state);
  if (player.fee > cap) return { save: state, notice: `Transfer budget is ${money(cap)}. Raise it or pick a cheaper name.` };
  const askFee = player.fee;
  const askWage = Math.max(player.wage, wageFor(ovr(player), player.age));
  const offerFee = Math.round((askFee * 0.82) / 5000) * 5000;
  const offerWage = Math.round(askWage * 0.92);
  return {
    save: {
      ...state,
      deal: { playerId: id, askFee, askWage, offerFee, offerWage, round: 0 },
    },
    notice: `${player.name}'s people open at ${money(askFee)} and £${askWage.toLocaleString("en-GB")} a week.`,
  };
}

export function counterDeal(state: SaveData, fee: number, wage: number): Result {
  const deal = state.deal;
  if (!deal) return { save: state, notice: "No deal open." };
  const player = state.players.find((p) => p.id === deal.playerId && p.clubId === "market");
  if (!player) return { save: { ...state, deal: null }, notice: "That player has already moved." };
  if (deal.round >= 3) return { save: state, notice: "They won't talk further. Accept or walk." };
  const feeN = Math.max(0, Math.round(fee / 5000) * 5000);
  const wageN = Math.max(500, Math.round(wage));
  const feeGap = (deal.askFee - feeN) / Math.max(1, deal.askFee);
  const wageGap = (deal.askWage - wageN) / Math.max(1, deal.askWage);
  const stubborn = 0.35 + unit(state.seed, state.weekIndex, deal.round + 4) * 0.25;
  let askFee = deal.askFee;
  let askWage = deal.askWage;
  if (feeGap < stubborn) askFee = Math.round(((deal.askFee + feeN) / 2) / 5000) * 5000;
  else askFee = Math.round((deal.askFee * 0.96) / 5000) * 5000;
  if (wageGap < stubborn + 0.1) askWage = Math.round((deal.askWage + wageN) / 2);
  else askWage = Math.round(deal.askWage * 0.97);
  askFee = Math.max(feeN, Math.min(player.fee * 1.15, askFee));
  askWage = Math.max(wageN, Math.round(askWage));
  return {
    save: {
      ...state,
      deal: {
        ...deal,
        offerFee: feeN,
        offerWage: wageN,
        askFee,
        askWage,
        round: deal.round + 1,
      },
    },
    notice: `They come back at ${money(askFee)} and £${askWage.toLocaleString("en-GB")} a week.`,
  };
}

export function acceptDeal(state: SaveData): Result {
  const deal = state.deal;
  if (!deal) return { save: state, notice: "No deal open." };
  const player = state.players.find((p) => p.id === deal.playerId && p.clubId === "market");
  if (!player) return { save: { ...state, deal: null }, notice: "That player has already moved." };
  if (squadCount(state) >= 24) return { save: state, notice: "The squad is full at 24." };
  const fee = deal.askFee;
  const wage = deal.askWage;
  if (!afford(state, fee)) return { save: state, notice: "The account can't cover that fee." };
  if (fee > transferCap(state)) return { save: state, notice: "That fee is over the transfer budget the chairman set." };
  const next: Player = { ...player, clubId: USER, loan: null, contract: 3, fee: 0, wage };
  return {
    save: {
      ...state,
      cash: state.cash - fee,
      deal: null,
      players: state.players.map((p) => (p.id === player.id ? next : p)),
    },
    notice: `${player.name} signs for ${money(fee)}. Wage £${wage.toLocaleString("en-GB")} a week.`,
  };
}

export function walkDeal(state: SaveData): Result {
  if (!state.deal) return { save: state, notice: "No deal open." };
  const player = state.players.find((p) => p.id === state.deal?.playerId);
  return { save: { ...state, deal: null }, notice: player ? `Talks with ${player.name} collapse.` : "Talks collapse." };
}

export function buyPlayer(state: SaveData, id: string): Result {
  return openDeal(state, id);
}

export function counterOffer(state: SaveData): Result {
  if (!state.offer) return { save: state, notice: "No offer on the table." };
  const player = state.players.find((p) => p.id === state.offer?.playerId);
  if (!player) return { save: { ...state, offer: null }, notice: "The player is already gone." };
  const bump = Math.round((state.offer.fee * 1.18) / 10000) * 10000;
  const accept = unit(state.seed, state.weekIndex, 41) > 0.42;
  if (accept) {
    return {
      save: { ...state, offer: { ...state.offer, fee: bump } },
      notice: `${state.offer.from} raise to ${money(bump)}.`,
    };
  }
  return {
    save: { ...state, offer: null },
    notice: `${state.offer.from} walk away from ${player.name}.`,
  };
}

export function loanIn(state: SaveData, id: string): Result {
  const player = state.players.find((p) => p.id === id);
  if (!player || player.clubId !== "market") return { save: state, notice: "That player has already moved." };
  if (squadCount(state) >= 24) return { save: state, notice: "The squad is full at 24." };
  const next: Player = { ...player, clubId: USER, loan: "in", contract: 1, fee: 0 };
  return {
    save: { ...state, players: state.players.map((p) => (p.id === id ? next : p)) },
    notice: `${player.name} arrives on loan until the season ends. You pay the wage.`,
  };
}

export function sellPlayer(state: SaveData, id: string): Result {
  const player = state.players.find((p) => p.id === id && p.clubId === USER);
  if (!player) return { save: state, notice: "Not your player." };
  if (player.loan === "in") return { save: state, notice: "Loanees go back, they don't get sold." };
  if (userPlayers(state).filter((p) => p.loan !== "out").length <= 16) {
    return { save: state, notice: "The board won't let the squad drop below 16." };
  }
  const fee = Math.round((valueFor(player) * (0.84 + state.fans / 500)) / 10000) * 10000;
  let players = state.players.filter((p) => p.id !== id);
  let xi = state.xi.filter((x) => x !== id);
  let bench = state.bench.filter((x) => x !== id);
  if (xi.length < 11) {
    const picked = pickXi(players, USER, state.formation);
    xi = picked.xi;
    bench = picked.bench;
  }
  const offer = state.offer?.playerId === id ? null : state.offer;
  return {
    save: { ...state, players, xi, bench, cash: state.cash + fee, offer },
    notice: `${player.name} sold for £${Math.round(fee / 1000)}k.`,
  };
}

export function acceptOffer(state: SaveData): Result {
  if (!state.offer) return { save: state, notice: "No offer on the table." };
  const priced = sellPlayer(state, state.offer.playerId);
  if (priced.notice.startsWith("The board") || priced.notice.startsWith("Not") || priced.notice.startsWith("Loanees")) {
    return priced;
  }
  const player = state.players.find((p) => p.id === state.offer?.playerId);
  const fee = state.offer.fee;
  if (!player) return { save: { ...state, offer: null }, notice: "The player is already gone." };
  let players = state.players.filter((p) => p.id !== player.id);
  let xi = state.xi.filter((x) => x !== player.id);
  let bench = state.bench.filter((x) => x !== player.id);
  if (xi.length < 11) {
    const picked = pickXi(players, USER, state.formation);
    xi = picked.xi;
    bench = picked.bench;
  }
  return {
    save: { ...state, players, xi, bench, cash: state.cash + fee, offer: null },
    notice: `${state.offer.from} pay £${Math.round(fee / 1000)}k for ${player.name}.`,
  };
}

export function declineOffer(state: SaveData): Result {
  return { save: { ...state, offer: null }, notice: "Offer declined." };
}

export function loanOut(state: SaveData, id: string): Result {
  const player = state.players.find((p) => p.id === id && p.clubId === USER);
  if (!player) return { save: state, notice: "Not your player." };
  if (player.loan === "in") return { save: state, notice: "You can't loan out a loanee." };
  if (state.xi.includes(id)) return { save: state, notice: "Take them out of the XI first." };
  return {
    save: {
      ...state,
      players: state.players.map((p) => (p.id === id ? { ...p, loan: "out" } : p)),
      bench: state.bench.filter((x) => x !== id),
    },
    notice: `${player.name} leaves on loan. You cover 40% of the wage.`,
  };
}

export function recall(state: SaveData, id: string): Result {
  const player = state.players.find((p) => p.id === id);
  if (!player || player.loan !== "out") return { save: state, notice: "They are not out on loan." };
  return {
    save: { ...state, players: state.players.map((p) => (p.id === id ? { ...p, loan: null } : p)) },
    notice: `${player.name} is recalled.`,
  };
}

export function renew(state: SaveData, id: string): Result {
  const player = state.players.find((p) => p.id === id && p.clubId === USER);
  if (!player) return { save: state, notice: "Not your player." };
  if (player.loan === "in") return { save: state, notice: "Loans end with the season." };
  const cost = player.wage * 10;
  if (state.cash < cost) return { save: state, notice: "Signing-on fee is ten weeks' wages. Not enough cash." };
  const wage = wageFor(Math.max(ovr(player), 40), player.age);
  const nextWage = Math.max(player.wage, Math.round(wage * 1.08));
  return {
    save: {
      ...state,
      cash: state.cash - cost,
      players: state.players.map((p) => (p.id === id ? { ...p, contract: 3, wage: nextWage } : p)),
    },
    notice: `${player.name} signs for three seasons at £${nextWage.toLocaleString("en-GB")} a week.`,
  };
}

export function upgradeFacility(state: SaveData, key: "stadium" | "training" | "academy" | "medical"): Result {
  if (key === "stadium") return { save: state, notice: "The ground is built stand by stand." };
  const level = state.facilities[key];
  if (level >= 5) return { save: state, notice: "Already at the top level." };
  const cost = upgradeCost(key, level);
  if (state.cash < cost) return { save: state, notice: "The build needs more cash." };
  return {
    save: {
      ...state,
      cash: state.cash - cost,
      facilities: { ...state.facilities, [key]: level + 1 },
    },
    notice: `${labelFac(key)} is now level ${level + 1}.`,
  };
}

function labelFac(key: string) {
  if (key === "stadium") return "The ground";
  if (key === "training") return "The training ground";
  if (key === "academy") return "The academy";
  return "The medical wing";
}

export function upgradeStand(state: SaveData, id: StandId): Result {
  const stands = standsOf(state);
  const tier = stands[id];
  const job = nextBuild(id, tier);
  if (!job) return { save: state, notice: "That stand is finished." };
  if (state.cash < job.cost) return { save: state, notice: `${job.name} needs ${money(job.cost)}. The account is short.` };
  const next = { ...stands, [id]: tier + 1 };
  const boxes = job.boxes > 0 ? ` ${job.boxes} of them are boxes.` : "";
  return {
    save: {
      ...state,
      cash: state.cash - job.cost,
      stands: next,
      facilities: { ...state.facilities, stadium: stadiumLevel(next) },
    },
    notice: `${job.name} goes up. ${job.seats.toLocaleString("en-GB")} seats added.${boxes}`,
  };
}

export function upgradeStaff(state: SaveData, key: "coach" | "scout" | "physio"): Result {
  const level = state.staff[key];
  if (level >= 5) return { save: state, notice: "That desk is as good as it gets." };
  const cost = staffCost(level);
  if (state.cash < cost) return { save: state, notice: "Hiring better staff takes cash." };
  return {
    save: { ...state, cash: state.cash - cost, staff: { ...state.staff, [key]: level + 1 } },
    notice: `New ${key} appointed. Quality ${level + 1}.`,
  };
}

export function borrow(state: SaveData): Result {
  const cap = debtLimit(state.tier);
  if (state.debt >= cap) return { save: state, notice: `The overdraft stops at ${money(cap)} in this division.` };
  const take = Math.min(500_000, cap - state.debt);
  return {
    save: { ...state, cash: state.cash + take, debt: state.debt + take },
    notice: `${money(take)} on the overdraft. It costs 0.35% a week — about 20% a year, the rate a club pays when the bank has already refused.`,
  };
}

export function repay(state: SaveData): Result {
  if (state.debt <= 0) return { save: state, notice: "No debt on the books." };
  const amount = Math.min(250_000, state.debt, Math.max(0, state.cash - 80_000));
  if (amount < 10_000) return { save: state, notice: "Keep a cash reserve. The bank can wait." };
  return {
    save: { ...state, cash: state.cash - amount, debt: state.debt - amount },
    notice: `Repaid £${Math.round(amount / 1000)}k.`,
  };
}

export function renegotiate(state: SaveData): Result {
  const table = leagueTable(state);
  const pos = Math.max(1, table.findIndex((t) => t.id === USER) + 1);
  const boost = clamp(0.84 + (9 - pos) * 0.035 + state.fans / 500, 0.8, 1.4);
  const name = SPONSORS[Math.floor(unit(state.seed, state.weekIndex + 3, state.season + 2) * SPONSORS.length)] ?? "Brassline";
  const save = { ...state, sponsorName: name, sponsorBoost: Math.round(boost * 100) / 100 };
  return { save, notice: `${name} offer ${sponsorWeekly(save).toLocaleString("en-GB")} a week.` };
}

export function setFormation(state: SaveData, formation: FormationId): Result {
  if (state.phase === "match" && state.live && !state.live.finished && state.live.period !== "pens") {
    if (!state.live.paused) return { save: state, notice: "Pause the match before changing shape." };
    const live = liveReorderXi(state.live, state.players, formation, state.live.userSide);
    return {
      save: { ...state, formation, live },
      notice: `${formation} for the restart.`,
    };
  }
  const picked = pickXi(state.players, USER, formation);
  return { save: { ...state, formation, xi: picked.xi, bench: picked.bench }, notice: `${formation}. ${SHAPES[formation].name}.` };
}

export function swapIds(state: SaveData, a: string, b: string): Result {
  if (a === b) return { save: state, notice: "" };
  const pa = state.players.find((p) => p.id === a);
  const pb = state.players.find((p) => p.id === b);
  if (!pa || !pb) return { save: state, notice: "Pick two of your players." };
  const xi = state.xi.slice();
  const bench = state.bench.slice();
  const ia = xi.indexOf(a);
  const ib = xi.indexOf(b);
  const slotOf = (index: number) => index;
  if (ia >= 0 && ib >= 0) {
    const ga = slotGk(state, ia);
    const gb = slotGk(state, ib);
    if (ga !== gb && (pa.pos === "GK" || pb.pos === "GK")) {
      return { save: state, notice: "Keep the goalkeeper in the gloves." };
    }
    xi[ia] = b;
    xi[ib] = a;
    return { save: { ...state, xi }, notice: "" };
  }
  if (ia >= 0 && bench.includes(b)) {
    if (slotGk(state, ia) && pb.pos !== "GK") return { save: state, notice: "Only a goalkeeper starts in goal." };
    if (!slotGk(state, ia) && pb.pos === "GK") return { save: state, notice: "Don't throw the goalkeeper upfield." };
    xi[ia] = b;
    const nextBench = bench.filter((id) => id !== b);
    nextBench.unshift(a);
    return { save: { ...state, xi, bench: nextBench.slice(0, 7) }, notice: "" };
  }
  if (ib >= 0 && bench.includes(a)) return swapIds(state, b, a);
  void slotOf;
  return { save: state, notice: "Select a starter, then a replacement." };
}

function slotGk(state: SaveData, index: number) {
  return state.formation === "4-3-3" || state.formation
    ? index === 0
    : index === 0;
}

export function autoXi(state: SaveData): Result {
  const picked = pickXi(state.players, USER, state.formation);
  return { save: { ...state, xi: picked.xi, bench: picked.bench }, notice: "Best available XI pencilled in." };
}

export function setTraining(state: SaveData, training: TrainingFocus): SaveData {
  return { ...state, training };
}

export function setPhilosophy(state: SaveData, philosophy: SaveData["philosophy"]): Result {
  if (philosophy === state.philosophy) return { save: state, notice: "" };
  return {
    save: { ...state, philosophy, board: clamp(state.board - 2, 0, 100) },
    notice: "The board grumbles about another change of idea.",
  };
}

export function setMentality(state: SaveData, mentality: Mentality): SaveData {
  if (state.phase === "match" && state.live) {
    const side = state.live.userSide;
    return {
      ...state,
      mentality,
      live: {
        ...state.live,
        homeMentality: side === "home" ? mentality : state.live.homeMentality,
        awayMentality: side === "away" ? mentality : state.live.awayMentality,
      },
    };
  }
  return { ...state, mentality };
}

export function shout(state: SaveData, kind: "encourage" | "demand" | "calm"): Result {
  if (!state.live || state.live.finished) return { save: state, notice: "No match running." };
  if (state.live.shouts.length >= 2) return { save: state, notice: "The players have heard enough." };
  if (state.live.shouts.includes(kind)) return { save: state, notice: "You already used that shout." };
  const spirit = state.live.spirit + (kind === "demand" ? 2.2 : kind === "encourage" ? 1.4 : 0.4);
  const text =
    kind === "demand" ? "You demand more. The press will hear if it fails." : kind === "encourage" ? "You urge them on." : "You calm the tempo.";
  return {
    save: {
      ...state,
      live: {
        ...state.live,
        spirit,
        shouts: [...state.live.shouts, kind],
        log: [...state.live.log, { minute: state.live.minute, kind: "info", text }],
      },
    },
    notice: "",
  };
}

export function sub(state: SaveData, offId: string, onId: string): Result {
  if (!state.live) return { save: state, notice: "No match running." };
  const result = userSubstitute(state.live, state.players, offId, onId);
  if (typeof result === "string") return { save: state, notice: result };
  return { save: { ...state, live: result }, notice: "" };
}

export function wageLine(state: SaveData) {
  return { wages: wageBill(state), sponsor: sponsorWeekly(state) };
}

export function setBudgetMode(state: SaveData, mode: BudgetMode): Result {
  const mood =
    mode === "max" ? 4 : mode === "normal" ? 1 : mode === "cautious" ? -2 : mode === "strict" ? -5 : -8;
  const manager = {
    ...state.manager,
    happiness: clamp(state.manager.happiness + mood, 20, 99),
  };
  const note =
    mood >= 0
      ? `${manager.name} likes the ${mode} transfer budget.`
      : `${manager.name} is unhappy with a ${mode} transfer budget.`;
  return {
    save: { ...state, transferBudgetMode: mode, manager },
    notice: `Transfer budget set to ${mode}. ${note}`,
  };
}

export function dismissInbox(state: SaveData, id: string): Result {
  return { save: { ...state, inbox: state.inbox.filter((m) => m.id !== id) }, notice: "" };
}

export function clearInbox(state: SaveData): Result {
  return { save: { ...state, inbox: [] }, notice: "Inbox cleared." };
}

export function sackManager(state: SaveData): Result {
  const cost = state.manager.wage * 20;
  if (state.cash < cost) return { save: state, notice: `Sacking costs ${money(cost)} in compensation.` };
  const pool = state.managerPool.length
    ? state.managerPool
    : makeManagerPool(state.seed + state.weekIndex, state.manager.name);
  return {
    save: {
      ...state,
      cash: state.cash - cost,
      managerPool: pool,
      board: clamp(state.board - 4, 0, 100),
      screen: "managersPool",
    },
    notice: `${state.manager.name} is gone. Compensation ${money(cost)}.`,
  };
}

export function hireManager(state: SaveData, mgr: ClubManager): Result {
  const hired: ClubManager = {
    ...mgr,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    happiness: 78,
    hiredSeason: state.season,
    hiredWeek: state.weekIndex,
  };
  const picked = pickXi(state.players, USER, hired.formation);
  return {
    save: {
      ...state,
      manager: hired,
      managerName: hired.name,
      philosophy: hired.style,
      formation: hired.formation,
      xi: picked.xi,
      bench: picked.bench,
      managerPool: makeManagerPool(state.seed + state.season * 9, hired.name),
      screen: "manager",
      board: clamp(state.board + 2, 0, 100),
    },
    notice: `${hired.name} takes the dugout. ${hired.formation} · ${hired.style}.`,
  };
}

export function upgradeOutlet(
  state: SaveData,
  key: "burger" | "counter" | "cafe" | "merch",
): Result {
  const level = state.outlets[key];
  if (level >= 4) return { save: state, notice: "That outlet is maxed." };
  const cost = outletUpgradeCost(level);
  if (state.cash < cost) return { save: state, notice: `Needs ${money(cost)}.` };
  return {
    save: {
      ...state,
      cash: state.cash - cost,
      outlets: { ...state.outlets, [key]: level + 1 },
    },
    notice: `${key} is now level ${level + 1}.`,
  };
}

export function buySuperStadium(state: SaveData): Result {
  if (state.superStadium) return { save: state, notice: "You already have the super stadium." };
  if (state.cash < SUPER_STADIUM_COST) return { save: state, notice: `Needs ${money(SUPER_STADIUM_COST)}.` };
  return {
    save: {
      ...state,
      cash: state.cash - SUPER_STADIUM_COST,
      superStadium: true,
      stands: { west: 4, east: 4, north: 4, south: 4 },
      facilities: { ...state.facilities, stadium: 5 },
      pitchQuality: Math.max(state.pitchQuality, 85),
    },
    notice: "Super stadium open. 120,000 capacity dream — Tyrone scale stands maxed, running costs cut.",
  };
}

export function setFacilityTarget(
  state: SaveData,
  key: "training" | "academy",
  target: number,
): Result {
  const current = state.facilities[key];
  const to = clamp(Math.round(target), 1, 5);
  if (to <= current) return { save: state, notice: "Already at or above that level." };
  const cost = facilityStepCost(current, to);
  if (state.cash < cost) return { save: state, notice: `Upgrade needs ${money(cost)}.` };
  return {
    save: {
      ...state,
      cash: state.cash - cost,
      facilities: { ...state.facilities, [key]: to },
    },
    notice: `${key === "academy" ? "Youth coaching" : "Training"} now level ${to}. Weekly cost about £${weeklyFacilityCost(to * 5)}.`,
  };
}

export function bumpPitch(state: SaveData, delta: number): Result {
  const next = clamp(state.pitchQuality + delta, 1, 99);
  if (next === state.pitchQuality) return { save: state, notice: "" };
  const steps = Math.abs(next - state.pitchQuality);
  const cost = steps * upgradeStepCost(Math.floor(state.pitchQuality / 20));
  if (next > state.pitchQuality && state.cash < cost) return { save: state, notice: `Pitch work needs ${money(cost)}.` };
  return {
    save: {
      ...state,
      cash: next > state.pitchQuality ? state.cash - cost : state.cash,
      pitchQuality: next,
    },
    notice: `Pitch quality ${next}/99.`,
  };
}
