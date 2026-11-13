import { create } from "zustand";
import {
  acceptDeal,
  acceptOffer,
  autoXi,
  borrow,
  bumpPitch,
  buyPlayer,
  buySuperStadium,
  counterDeal,
  counterOffer,
  declineOffer,
  hireManager,
  loanIn,
  loanOut,
  openDeal,
  recall,
  renegotiate,
  renew,
  repay,
  sackManager,
  sellPlayer,
  setBudgetMode,
  setFacilityTarget,
  setFormation,
  setMentality,
  setPhilosophy,
  setTraining,
  shout,
  sub,
  swapIds,
  upgradeFacility,
  upgradeOutlet,
  upgradeStaff,
  upgradeStand,
  walkDeal,
  clearInbox,
  dismissInbox,
} from "./actions";
import type { BudgetMode, ClubManager } from "./types";
import {
  bumpCrowd,
  cardNoise,
  goalNoise,
  setMuted,
  startCrowd,
  stopCrowd,
  unlockAudio,
  whistleNoise,
} from "./audio";
import { stepMatch } from "./match";
import { ACTIVE_KEY, exportSave, importSave, loadFromSlot, saveToSlot, writeActive } from "./saves";
import type { BuildUp, CreateInput, FormationId, LineHeight, Mentality, Philosophy, SaveData, Screen, StandId, TrainingFocus } from "./types";
import {
  beginLive,
  blankSave,
  createGame,
  ensureXi,
  normalize,
  openNextSeason,
  resolveWeek,
} from "./world";

type Store = SaveData & {
  booted: boolean;
  notice: string | null;
  boot: () => void;
  saveNow: () => void;
  clearNotice: () => void;
  goCreate: () => void;
  backTitle: () => void;
  startClub: (input: CreateInput) => void;
  abandon: () => void;
  setScreen: (screen: Screen) => void;
  act: (result: { save: SaveData; notice: string }) => void;
  buy: (id: string) => void;
  openTalks: (id: string) => void;
  counterTalks: (fee: number, wage: number) => void;
  acceptTalks: () => void;
  walkTalks: () => void;
  loan: (id: string) => void;
  sell: (id: string) => void;
  loanAway: (id: string) => void;
  recallPlayer: (id: string) => void;
  renewPlayer: (id: string) => void;
  takeOffer: () => void;
  rejectOffer: () => void;
  bumpOffer: () => void;
  liftFacility: (key: "stadium" | "training" | "academy" | "medical") => void;
  liftStand: (id: StandId) => void;
  liftStaff: (key: "coach" | "scout" | "physio") => void;
  takeLoan: () => void;
  payDebt: () => void;
  newSponsor: () => void;
  shape: (formation: FormationId) => void;
  place: (a: string, b: string) => void;
  bestXi: () => void;
  focus: (training: TrainingFocus) => void;
  idea: (philosophy: Philosophy) => void;
  mind: (mentality: Mentality) => void;
  tune: (key: "tempo" | "pressing" | "width", value: number) => void;
  setLine: (line: LineHeight) => void;
  setBuild: (build: BuildUp) => void;
  toPress: () => void;
  pickPress: (tone: "bold" | "measured" | "deflect") => void;
  quickSim: () => void;
  advanceBye: () => void;
  stepMinute: () => void;
  togglePause: () => void;
  setSpeed: (speed: 1 | 2 | 3) => void;
  yell: (kind: "encourage" | "demand" | "calm") => void;
  makeSub: (offId: string, onId: string) => void;
  toReport: () => void;
  leaveReport: () => void;
  nextSeason: () => void;
  toggleMute: () => void;
  stashSlot: (id: number, label?: string) => void;
  resumeSlot: (id: number) => void;
  exportCareer: () => string | null;
  importCareer: (raw: string) => void;
  setBudget: (mode: BudgetMode) => void;
  sackMgr: () => void;
  hireMgr: (mgr: ClubManager) => void;
  liftOutlet: (key: "burger" | "counter" | "cafe" | "merch") => void;
  buySuper: () => void;
  setFacTarget: (key: "training" | "academy", target: number) => void;
  setPitch: (delta: number) => void;
  dismissMail: (id: string) => void;
  clearMail: () => void;
  advanceNews: () => void;
  pickSponsor: (name: string, fee: number, untilSeason: number) => void;
  setTickets: (price: number) => void;
  setWinBonus: (pct: 0 | 10 | 20) => void;
};

let hooked = false;

function write(state: Store) {
  const {
    booted: _b,
    notice: _n,
    boot: _boot,
    saveNow: _s,
    clearNotice: _c,
    goCreate: _g,
    backTitle: _bt,
    startClub: _sc,
    abandon: _a,
    setScreen: _ss,
    act: _act,
    buy: _buy,
    openTalks: _ot,
    counterTalks: _ct,
    acceptTalks: _at,
    walkTalks: _wt,
    loan: _loan,
    sell: _sell,
    loanAway: _la,
    recallPlayer: _rp,
    renewPlayer: _rn,
    takeOffer: _to,
    rejectOffer: _ro,
    bumpOffer: _bo,
    liftFacility: _lf,
    liftStand: _lst,
    liftStaff: _ls,
    takeLoan: _tl,
    payDebt: _pd,
    newSponsor: _ns,
    shape: _sh,
    place: _pl,
    bestXi: _bx,
    focus: _f,
    idea: _i,
    mind: _m,
    tune: _t,
    setLine: _sl,
    setBuild: _sb,
    toPress: _tp,
    pickPress: _pp,
    quickSim: _q,
    advanceBye: _ab,
    stepMinute: _sm,
    togglePause: _pau,
    setSpeed: _sp,
    yell: _y,
    makeSub: _ms,
    toReport: _tr,
    leaveReport: _lr,
    nextSeason: _nx,
    toggleMute: _tm,
    stashSlot: _sslot,
    resumeSlot: _rslot,
    exportCareer: _ex,
    importCareer: _im,
    setBudget: _sbud,
    sackMgr: _sack,
    hireMgr: _hire,
    liftOutlet: _out,
    buySuper: _sup,
    setFacTarget: _sft,
    setPitch: _spit,
    dismissMail: _dm,
    clearMail: _cm,
    advanceNews: _an,
    pickSponsor: _ps,
    setTickets: _stix,
    setWinBonus: _swb,
    ...data
  } = state;
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(data));
  } catch {
    /* private mode or quota */
  }
}

export const useGame = create<Store>((set, get) => ({
  ...blankSave(),
  booted: false,
  notice: null,
  boot: () => {
    if (get().booted) return;
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        if (
          (parsed?.version === 1 || parsed?.version === 2 || parsed?.version === 3 || parsed?.version === 4) &&
          parsed.active &&
          Array.isArray(parsed.players) &&
          Array.isArray(parsed.weeks)
        ) {
          const save = normalize(parsed);
          setMuted(!!save.muted);
          set({ ...save, booted: true, notice: null });
        } else set({ booted: true });
      } else set({ booted: true });
    } catch {
      set({ booted: true });
    }
    if (!hooked) {
      hooked = true;
      useGame.subscribe((state, prev) => {
        if (!state.booted) return;
        if (!state.active) {
          try {
            localStorage.removeItem(ACTIVE_KEY);
          } catch {
            /* ignore */
          }
          return;
        }
        if (state.phase === "match" && state.live && prev.live) {
          const minuteMoved = state.live.minute !== prev.live.minute;
          const score =
            state.live.homeScore !== prev.live.homeScore || state.live.awayScore !== prev.live.awayScore;
          const mindChanged =
            state.live.homeMentality !== prev.live.homeMentality ||
            state.live.awayMentality !== prev.live.awayMentality;
          const xiChanged = state.live.homeXi.join() !== prev.live.homeXi.join();
          if (
            minuteMoved &&
            !score &&
            !mindChanged &&
            !xiChanged &&
            state.live.minute % 5 !== 0 &&
            !state.live.finished &&
            state.live.period !== "pens"
          ) {
            return;
          }
        }
        write(state);
      });
    }
  },
  saveNow: () => {
    const state = get();
    if (state.booted && state.active) write(state);
  },
  clearNotice: () => set({ notice: null }),
  goCreate: () => set({ phase: "create", notice: null }),
  backTitle: () => set({ phase: "title" }),
  startClub: (input) => set({ ...createGame(input), booted: true, notice: null }),
  abandon: () => {
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* ignore */
    }
    stopCrowd();
    set({ ...blankSave(), booted: true, notice: null });
  },
  setScreen: (screen) => set({ screen, notice: null }),
  act: (result) => set({ ...result.save, notice: result.notice ? result.notice : null }),
  buy: (id) => get().act(buyPlayer(get(), id)),
  openTalks: (id) => get().act(openDeal(get(), id)),
  counterTalks: (fee, wage) => get().act(counterDeal(get(), fee, wage)),
  acceptTalks: () => get().act(acceptDeal(get())),
  walkTalks: () => get().act(walkDeal(get())),
  loan: (id) => get().act(loanIn(get(), id)),
  sell: (id) => get().act(sellPlayer(get(), id)),
  loanAway: (id) => get().act(loanOut(get(), id)),
  recallPlayer: (id) => get().act(recall(get(), id)),
  renewPlayer: (id) => get().act(renew(get(), id)),
  takeOffer: () => get().act(acceptOffer(get())),
  rejectOffer: () => get().act(declineOffer(get())),
  bumpOffer: () => get().act(counterOffer(get())),
  liftFacility: (key) => get().act(upgradeFacility(get(), key)),
  liftStand: (id) => get().act(upgradeStand(get(), id)),
  liftStaff: (key) => get().act(upgradeStaff(get(), key)),
  takeLoan: () => get().act(borrow(get())),
  payDebt: () => get().act(repay(get())),
  newSponsor: () => get().act(renegotiate(get())),
  shape: (formation) => get().act(setFormation(get(), formation)),
  place: (a, b) => get().act(swapIds(get(), a, b)),
  bestXi: () => get().act(autoXi(get())),
  focus: (training) => set({ ...setTraining(get(), training) }),
  idea: (philosophy) => get().act(setPhilosophy(get(), philosophy)),
  mind: (mentality) => set(setMentality(get(), mentality)),
  tune: (key, value) => set({ [key]: value }),
  setLine: (line) => set({ line }),
  setBuild: (build) => set({ build }),
  toPress: () => {
    const state = ensureXi(get());
    set({ ...state, phase: "press", notice: null });
  },
  pickPress: (tone) => {
    unlockAudio();
    setMuted(get().muted);
    const state = ensureXi(get());
    const next = beginLive(state, tone);
    if (!get().muted) {
      startCrowd();
      whistleNoise();
    }
    set({ ...next, notice: null });
  },
  quickSim: () => {
    const state = ensureXi(get());
    stopCrowd();
    set({ ...resolveWeek(state, null), notice: null });
  },
  advanceBye: () => set({ ...resolveWeek(get(), null), notice: null }),
  stepMinute: () => {
    const state = get();
    if (!state.live || state.live.finished || state.live.paused) return;
    const prev = state.live;
    const next = stepMatch(state.live, state);
    if ((next.minute === 45 || next.minute === 105) && next.period !== "pens") {
      next.paused = true;
      whistleNoise();
    }
    if (next.period === "et" && prev.period === "regulation") whistleNoise();
    if (next.period === "pens" && prev.period !== "pens") whistleNoise();
    const scored = next.homeScore !== prev.homeScore || next.awayScore !== prev.awayScore;
    const carded = next.log.length > prev.log.length && next.log[next.log.length - 1]?.kind === "card";
    const penGoal =
      next.period === "pens" &&
      next.penKicks.length > prev.penKicks.length &&
      next.penKicks[next.penKicks.length - 1]?.scored;
    set({ live: next });
    if (scored || penGoal) {
      goalNoise();
      bumpCrowd(1.2);
    } else if (carded) cardNoise();
    if (next.finished) {
      whistleNoise();
      stopCrowd();
    }
  },
  togglePause: () => {
    const live = get().live;
    if (!live || live.finished) return;
    const paused = !live.paused;
    if (!paused && !get().muted) startCrowd();
    if (paused) whistleNoise();
    set({ live: { ...live, paused } });
  },
  setSpeed: (speed) => {
    const live = get().live;
    if (!live) return;
    if (!get().muted) startCrowd();
    set({ live: { ...live, speed, paused: false } });
  },
  yell: (kind) => get().act(shout(get(), kind)),
  makeSub: (offId, onId) => get().act(sub(get(), offId, onId)),
  toReport: () => {
    const state = get();
    if (!state.live) return;
    stopCrowd();
    set({ ...resolveWeek(state, state.live), notice: null });
  },
  leaveReport: () => {
    const state = get();
    if (state.review && state.weekIndex >= state.weeks.length) set({ phase: "season" });
    else set({ phase: "hub", report: null, screen: "dash" });
  },
  nextSeason: () => set({ ...openNextSeason(get()), notice: null }),
  setBudget: (mode) => get().act(setBudgetMode(get(), mode)),
  sackMgr: () => get().act(sackManager(get())),
  hireMgr: (mgr) => get().act(hireManager(get(), mgr)),
  liftOutlet: (key) => get().act(upgradeOutlet(get(), key)),
  buySuper: () => get().act(buySuperStadium(get())),
  setFacTarget: (key, target) => get().act(setFacilityTarget(get(), key, target)),
  setPitch: (delta) => get().act(bumpPitch(get(), delta)),
  dismissMail: (id) => get().act(dismissInbox(get(), id)),
  clearMail: () => get().act(clearInbox(get())),
  advanceNews: () => {
    const q = get().newsQueue.slice(1);
    set({ newsQueue: q, notice: null });
  },
  pickSponsor: (name, fee, untilSeason) => {
    const state = get();
    const rest = state.newsQueue.slice(1);
    const unveil = {
      id: `sponsor-out-${state.season}`,
      kind: "continue" as const,
      title: "New shirt sponsor",
      body: `${name} are on the chest. ${Math.round(fee / 1000)}k a season through season ${untilSeason}.`,
      cta: "Continue",
    };
    set({
      sponsorName: name,
      sponsorBoost: 1 + Math.min(0.25, fee / 1_000_000),
      sponsorUntil: untilSeason,
      newsQueue: [unveil, ...rest],
      notice: `${name} signed.`,
    });
  },
  setTickets: (price) => {
    const state = get();
    const p = Math.max(3, Math.min(7, Math.round(price)));
    const rest = state.newsQueue.slice(1);
    const mood =
      p <= 4 ? "The terrace loves the cheap tickets." : p >= 7 ? "Grumbles about the gate price." : "Ticket prices feel fair.";
    const react = {
      id: `ticket-react-${state.season}`,
      kind: "continue" as const,
      title: "Fans react to ticket prices",
      body: `${mood} Matchday tickets are £${p}.`,
      cta: "Continue",
    };
    set({
      ticketPrice: p,
      fans: Math.max(8, Math.min(99, state.fans + (p <= 4 ? 2 : p >= 7 ? -2 : 0))),
      newsQueue: [react, ...rest],
      notice: `Tickets set to £${p}.`,
    });
  },
  setWinBonus: (pct) => {
    const state = get();
    const rest = state.newsQueue.slice(1);
    const react = {
      id: `bonus-react-${state.season}`,
      kind: "continue" as const,
      title: pct > 0 ? "Players delighted by bonus" : "Players accept no bonus",
      body:
        pct > 0
          ? `A ${pct}% win bonus is agreed. Morale lifts in the dressing room.`
          : "No win bonus this season. The squad stays professional.",
      cta: "Continue",
    };
    set({
      winBonusPct: pct,
      newsQueue: [react, ...rest],
      notice: `Win bonus ${pct}%.`,
    });
  },
  toggleMute: () => {
    const muted = !get().muted;
    setMuted(muted);
    const live = get().live;
    if (muted) stopCrowd();
    else if (get().phase === "match" && live && !live.finished) {
      unlockAudio();
      startCrowd();
    }
    set({ muted });
  },
  stashSlot: (id, label) => {
    const state = get();
    if (!state.active) return;
    const meta = saveToSlot(state, id, label);
    set({ notice: meta ? `Saved to slot ${id}: ${meta.label}.` : "Could not write that slot." });
  },
  resumeSlot: (id) => {
    const save = loadFromSlot(id);
    if (!save) {
      set({ notice: "That slot is empty." });
      return;
    }
    setMuted(!!save.muted);
    writeActive(save);
    set({ ...save, booted: true, phase: "hub", screen: "dash", notice: `Loaded ${save.clubs.find((c) => c.id === save.userClubId)?.name ?? "career"}.` });
  },
  exportCareer: () => {
    const state = get();
    if (!state.active) return null;
    return exportSave(state);
  },
  importCareer: (raw) => {
    const save = importSave(raw);
    if (!save) {
      set({ notice: "That file is not a Tyrone save." });
      return;
    }
    setMuted(!!save.muted);
    writeActive(save);
    set({ ...save, booted: true, phase: "hub", screen: "dash", notice: "Career imported." });
  },
}));
