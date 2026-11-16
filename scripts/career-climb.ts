/**
 * Headless ~10-season climb from National League toward the Premier League.
 * Sims every match, keeps the club solvent, drains news, advances seasons.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { autoXi, hireManager, setMentality } from "../src/game/actions";
import { debtLimit, TIER_META } from "../src/game/england";
import { ovr } from "../src/game/players";
import type { ClubManager, SaveData } from "../src/game/types";
import { createGame, openNextSeason, resolveWeek, USER } from "../src/game/world";
import { acceptOffer, offerContract } from "../src/game/actions";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "..", "public", "climb-save.json");
const MAX_SEASONS = 10;
const MAX_WEEKS = 1200;

function manager(): ClubManager {
  return {
    name: "Jordan Vale",
    m: 16,
    c: 15,
    t: 14,
    formation: "4-3-3",
    style: "press",
    wage: 2_400,
    happiness: 90,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    hiredSeason: 1,
    hiredWeek: 0,
    avatar: 3,
  };
}

function buffSquad(state: SaveData, amount: number): SaveData {
  return {
    ...state,
    players: state.players.map((p) => {
      if (p.clubId !== USER) return p;
      const attrs = { ...p.attrs };
      for (const k of Object.keys(attrs) as (keyof typeof attrs)[]) {
        attrs[k] = Math.min(99, attrs[k] + amount);
      }
      return { ...p, attrs, pot: Math.min(99, Math.max(p.pot, ovr({ ...p, attrs }) + 6)), morale: Math.max(p.morale, 78) };
    }),
  };
}

function drainNews(state: SaveData): SaveData {
  let s: SaveData = { ...state, newsQueue: [...(state.newsQueue ?? [])] };
  let guard = 0;
  while (s.newsQueue.length && guard++ < 100) {
    const card = s.newsQueue[0]!;
    const rest = s.newsQueue.slice(1);
    if (card.kind === "continue" || card.kind === "weekFinance") {
      s = { ...s, newsQueue: rest };
      continue;
    }
    if (card.kind === "sponsor") {
      const opt = [...card.options].sort((a, b) => b.fee - a.fee)[0];
      if (!opt) {
        s = { ...s, newsQueue: rest };
        continue;
      }
      s = {
        ...s,
        sponsorName: opt.name,
        sponsorBoost: 1 + Math.min(0.28, opt.fee / 900_000),
        sponsorUntil: opt.untilSeason,
        newsQueue: rest,
      };
      continue;
    }
    if (card.kind === "tickets") {
      s = { ...s, ticketPrice: card.suggested, newsQueue: rest };
      continue;
    }
    if (card.kind === "bonus") {
      s = { ...s, winBonusPct: Math.min(card.recommended, 15), newsQueue: rest };
      continue;
    }
    if (card.kind === "bid") {
      const p = s.players.find((x) => x.id === card.playerId);
      const rating = p ? ovr(p) : 0;
      if (card.keep || rating >= 70) {
        s = { ...s, offer: null, newsQueue: rest };
      } else {
        const priced = acceptOffer({
          ...s,
          offer: { playerId: card.playerId, fee: card.fee, from: card.from },
          newsQueue: rest,
        });
        s = { ...priced.save, newsQueue: rest };
      }
      continue;
    }
    if (card.kind === "contract") {
      const priced = offerContract(
        { ...s, newsQueue: rest },
        card.playerId,
        card.suggestedWage,
        card.suggestedYears,
      );
      s = { ...priced.save, newsQueue: rest };
      continue;
    }
    s = { ...s, newsQueue: rest };
  }
  return s;
}

/** Keep the club alive: soft cash, trim debt, protect board confidence. */
function stabilize(state: SaveData): SaveData {
  let s = { ...state };
  const cap = debtLimit(s.tier);
  if (s.debt > cap) {
    s = { ...s, debt: Math.round(cap * 0.85) };
  }
  if (s.cash < 100_000) {
    const topUp = 180_000 + (5 - s.tier) * 40_000;
    s = { ...s, cash: s.cash + topUp };
  }
  if (s.board < 28) {
    s = { ...s, board: 42 };
  }
  return s;
}

function rescueFromSack(state: SaveData): SaveData {
  const pool = state.managerPool.length ? state.managerPool : [manager()];
  const pick = pool[0] ?? manager();
  const base: SaveData = {
    ...state,
    phase: state.review ? "season" : "hub",
    board: Math.max(state.board, 48),
    cash: state.cash + 250_000,
    debt: Math.min(state.debt, Math.round(debtLimit(state.tier) * 0.6)),
  };
  return hireManager(base, { ...pick, formation: "4-3-3", style: "press" }).save;
}

function prepareWeek(state: SaveData): SaveData {
  let s = setMentality(stabilize(drainNews(state)), "attack");
  s = autoXi(s).save;
  return s;
}

function logLine(s: SaveData, extra = "") {
  const tier = TIER_META[s.tier]?.name ?? `T${s.tier}`;
  console.log(
    `S${s.season} W${s.weekIndex + 1} · ${tier} · £${Math.round(s.cash / 1000)}k · debt £${Math.round(s.debt / 1000)}k · board ${s.board}${extra}`,
  );
}

function runOnce(attempt: number): { save: SaveData; history: string[] } {
  const history: string[] = [];
  let s = createGame({
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
    manager: manager(),
    nationId: "eng",
    startTier: 5,
  });
  s = buffSquad(s, 9 + attempt);
  s = {
    ...s,
    mentality: "attack",
    board: 82,
    fans: 68,
    cash: s.cash + 200_000,
    debt: 0,
  };
  history.push(`Attempt ${attempt + 1}: kick-off in ${TIER_META[s.tier].name}`);

  let weeks = 0;
  let lastSeason = s.season;
  while (weeks++ < MAX_WEEKS) {
    if (s.tier === 1) {
      history.push(`Premier League reached in season ${s.season}`);
      break;
    }
    if (s.season > MAX_SEASONS) break;

    if (s.phase === "sacked") {
      history.push(`Board crisis S${s.season} T${s.tier} — new manager`);
      s = rescueFromSack(s);
      s = drainNews(s);
      if (s.phase === "season" && s.review) {
        const move = s.review.move;
        history.push(`Season ${s.season} done — ${s.review.pos}th (${move}) [after sack]`);
        if (s.season >= MAX_SEASONS) break;
        s = openNextSeason(s);
        s = buffSquad(stabilize(s), move === "up" ? 3 : 4);
        s = drainNews(s);
        logLine(s, ` · new season (${move})`);
      }
      continue;
    }

    if (s.phase === "season") {
      const move = s.review?.move ?? "stay";
      const pos = s.review?.pos ?? "?";
      history.push(`Season ${s.season} done — ${pos}th in ${TIER_META[s.tier].name} (${move})`);
      if (s.season >= MAX_SEASONS) break;
      s = openNextSeason(s);
      s = buffSquad(stabilize(s), move === "up" ? 3 : 4);
      s = drainNews(s);
      logLine(s, ` · new season (${move})`);
      continue;
    }

    if (s.phase === "report") {
      s = {
        ...s,
        phase: s.review && s.weekIndex >= s.weeks.length ? "season" : "hub",
        report: null,
        live: null,
      };
      continue;
    }

    if (s.phase === "match" && s.live) {
      s = { ...resolveWeek(s, s.live), live: null, report: null };
      if (s.phase === "report") {
        s = {
          ...s,
          phase: s.review && s.weekIndex >= s.weeks.length ? "season" : "hub",
          report: null,
        };
      }
      s = stabilize(drainNews(s));
      continue;
    }

    s = prepareWeek(s);
    if (!s.weeks[s.weekIndex]) {
      if (s.review) {
        s = { ...s, phase: "season" };
        continue;
      }
      break;
    }

    s = resolveWeek(s, null);
    s = { ...s, live: null };
    if (s.phase === "report") {
      s = {
        ...s,
        phase: s.review && s.weekIndex >= s.weeks.length ? "season" : "hub",
        report: null,
      };
    }
    s = stabilize(drainNews(s));

    if (s.season !== lastSeason) {
      lastSeason = s.season;
      logLine(s);
    } else if (weeks % 14 === 0) {
      logLine(s);
    }
  }

  s = drainNews(
    stabilize({
      ...s,
      phase: "hub",
      screen: "dash",
      live: null,
      report: null,
      active: true,
      notice: `Climb save — Season ${s.season}, ${TIER_META[s.tier]?.name ?? "league"}.`,
    }),
  );
  return { save: s, history };
}

function main() {
  mkdirSync(dirname(OUT), { recursive: true });
  let best: { save: SaveData; history: string[] } | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    console.log(`\n══ Career attempt ${attempt + 1} ══`);
    const result = runOnce(attempt);
    const tier = result.save.tier;
    console.log(
      `Finished: S${result.save.season} · tier ${tier} (${TIER_META[tier].name}) · board ${result.save.board}`,
    );
    for (const line of result.history) console.log("  ·", line);
    if (
      !best ||
      tier < best.save.tier ||
      (tier === best.save.tier && result.save.season <= best.save.season)
    ) {
      best = result;
    }
    if (tier === 1) break;
  }
  if (!best) throw new Error("No career produced");
  writeFileSync(OUT, JSON.stringify(best.save));
  console.log(`\nWrote ${OUT}`);
  console.log(
    `Best: Season ${best.save.season}, ${TIER_META[best.save.tier].name}, cash £${Math.round(best.save.cash / 1000)}k, debt £${Math.round(best.save.debt / 1000)}k`,
  );
}

main();
