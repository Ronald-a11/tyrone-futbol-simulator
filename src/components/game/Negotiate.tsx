import { useEffect, useMemo, useState } from "react";
import { AvatarPortrait } from "@/components/game/AvatarPortrait";
import { talkNoise, unlockAudio } from "@/game/audio";
import { CHAIRMAN_AVATARS, transferCap } from "@/game/fc";
import { maskOvr, ovr } from "@/game/players";
import { useGame } from "@/game/store";
import type { DealSpeaker } from "@/game/types";
import { money } from "@/game/util";
import { USER } from "@/game/world";

function faceId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % CHAIRMAN_AVATARS.length;
  return CHAIRMAN_AVATARS[h] ?? 0;
}

const ROLE: Record<DealSpeaker, string> = {
  chairman: "Chairman",
  manager: "Manager",
  player: "Player",
  agent: "Agent",
};

export function Negotiate() {
  const deal = useGame((s) => s.deal);
  const players = useGame((s) => s.players);
  const chairmanName = useGame((s) => s.chairmanName);
  const chairmanAvatar = useGame((s) => s.chairmanAvatar);
  const manager = useGame((s) => s.manager);
  const club = useGame((s) => s.clubs.find((c) => c.id === USER));
  const scout = useGame((s) => s.staff.scout);
  const cash = useGame((s) => s.cash);
  const state = useGame();
  const counterTalks = useGame((s) => s.counterTalks);
  const acceptTalks = useGame((s) => s.acceptTalks);
  const walkTalks = useGame((s) => s.walkTalks);

  const player = players.find((p) => p.id === deal?.playerId);
  const script = deal?.script ?? [];
  const beat = deal?.beat ?? 0;
  const [lineIdx, setLineIdx] = useState(0);
  const [fee, setFee] = useState(deal?.offerFee ?? 0);
  const [wage, setWage] = useState(deal?.offerWage ?? 0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setLineIdx(0);
    if (deal) {
      setFee(deal.offerFee);
      setWage(deal.offerWage);
    }
  }, [beat, deal?.playerId]);

  useEffect(() => {
    if (!script.length || lineIdx >= script.length - 1) return;
    const t = window.setTimeout(() => setLineIdx((i) => i + 1), 2200);
    return () => window.clearTimeout(t);
  }, [lineIdx, script, beat]);

  const speaking = script[Math.min(lineIdx, Math.max(0, script.length - 1))];

  useEffect(() => {
    if (!speaking) return;
    unlockAudio();
    talkNoise(speaking.who);
  }, [speaking?.who, speaking?.text, lineIdx, beat]);
  const playing = script.length > 0 && lineIdx < script.length - 1;
  const finished = !playing && script.length > 0;
  const mood = deal?.mood ?? "open";
  const agentFace = useMemo(() => (player ? (faceId(player.id) + 7) % 28 : 4), [player?.id]);

  if (!deal || !player) {
    return (
      <div className="app-bg flex min-h-dvh items-center justify-center p-6">
        <button type="button" className="rounded-xl bg-[var(--color-fc-lime)] px-4 py-3 font-bold" onClick={() => useGame.setState({ phase: "hub", screen: "market" })}>
          Back to transfers
        </button>
      </div>
    );
  }

  const onAccept = () => {
    if (mood === "done") {
      acceptTalks();
      return;
    }
    setShake(true);
    window.setTimeout(() => setShake(false), 900);
    acceptTalks();
  };

  const onWalk = () => {
    walkTalks();
  };

  const gap = (deal.askFee - fee) / Math.max(1, deal.askFee);
  const roomTone =
    mood === "done"
      ? "from-[#1a3a24] via-[#0f2418] to-[#0a1210]"
      : mood === "walked"
        ? "from-[#3a1a1a] via-[#1a0f0f] to-[#0a0808]"
        : mood === "tense"
          ? "from-[#3a2410] via-[#1a140e] to-[#0c0a08]"
          : mood === "warm"
            ? "from-[#1a2e3a] via-[#101820] to-[#0a1014]"
            : "from-[#1c2430] via-[#12161c] to-[#0a0c10]";

  return (
    <div className={`negotiate-stage relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-gradient-to-b ${roomTone}`}>
      <div className="negotiate-grain pointer-events-none absolute inset-0" />
      <div className="negotiate-vignette pointer-events-none absolute inset-0" />

      <header className="relative z-10 px-4 pt-4 text-center">
        <div className="font-sans text-[0.7rem] font-extrabold text-white/50 uppercase">Transfer talks</div>
        <h1 className="font-display text-2xl font-bold text-white uppercase">{club?.name ?? "Boardroom"}</h1>
        <p className="mt-1 text-xs text-white/60">
          Round {Math.min(deal.round + 1, 4)} of 4 · Budget {money(transferCap(state))} · Cash {money(cash)}
        </p>
      </header>

      <div className={`relative z-10 mx-3 mt-3 flex-1 ${shake ? "negotiate-shake" : ""}`}>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#1a120c]/80 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {/* Window light */}
          <div className="absolute inset-x-8 top-0 h-16 bg-gradient-to-b from-[#8eb8d4]/25 to-transparent" />
          <div className="absolute top-3 left-1/2 h-1.5 w-24 -translate-x-1/2 rounded-full bg-[#d6b25e]/40 blur-[1px]" />

          <div className="relative px-3 pt-8 pb-4">
            {/* Far side: agent + player */}
            <div className="mb-2 grid grid-cols-2 gap-3 px-2">
              <Seat
                active={speaking?.who === "agent"}
                label="Agent"
                name="Representation"
                face={agentFace}
                side="far"
              />
              <Seat
                active={speaking?.who === "player"}
                label={player.pos}
                name={player.name}
                face={faceId(player.id)}
                side="far"
                detail={`OVR ${maskOvr(ovr(player), scout)} · ${player.age}`}
              />
            </div>

            {/* Table */}
            <div className="relative mx-auto mt-1 mb-2 h-28 max-w-[92%]">
              <div className="absolute inset-x-0 top-4 h-20 rounded-[40%] bg-gradient-to-b from-[#5c3a22] to-[#3a2414] shadow-[inset_0_8px_18px_rgba(255,255,255,0.08),0_14px_24px_rgba(0,0,0,0.45)]" />
              <div className="absolute inset-x-6 top-7 h-2 rounded-full bg-[#d6b25e]/25" />
              <div className="absolute top-10 left-1/2 h-10 w-16 -translate-x-1/2 rounded-sm bg-[#efe6d2]/90 shadow-md">
                <div className="px-1 pt-1 text-[0.55rem] leading-tight text-[#3a2414]">
                  ASK
                  <div className="font-bold">{money(deal.askFee)}</div>
                  <div>£{deal.askWage}/wk</div>
                </div>
              </div>
              <div className="absolute top-11 right-[18%] h-8 w-10 rounded-sm bg-[#efe6d2]/70 shadow" />
              <div className="absolute top-12 left-[16%] h-6 w-8 rounded-sm bg-[#1c3d66]/80" />
              {mood === "done" ? <div className="negotiate-hands absolute top-6 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-[var(--color-fc-lime)]/80" /> : null}
            </div>

            {/* Near side: chairman + manager */}
            <div className="grid grid-cols-2 gap-3 px-2">
              <Seat
                active={speaking?.who === "chairman"}
                label="You"
                name={chairmanName || "Chairman"}
                face={chairmanAvatar}
                side="near"
              />
              <Seat
                active={speaking?.who === "manager"}
                label="Manager"
                name={manager.name}
                face={manager.avatar ?? 0}
                side="near"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle / dialogue */}
      <div className="relative z-10 mx-3 mt-3 min-h-[5.5rem]">
        {speaking ? (
          <button
            type="button"
            key={`${beat}-${lineIdx}`}
            className="negotiate-line w-full rounded-2xl border border-white/10 bg-black/55 px-4 py-3 text-left text-white backdrop-blur-sm"
            onClick={() => setLineIdx((i) => Math.min(script.length - 1, i + 1))}
          >
            <div className="font-display text-[0.85rem] text-[var(--color-fc-lime)] uppercase">
              {ROLE[speaking.who]}
              {speaking.who === "player" ? ` · ${player.name}` : ""}
              {speaking.who === "manager" ? ` · ${manager.name}` : ""}
              {speaking.who === "chairman" ? ` · ${chairmanName || "You"}` : ""}
            </div>
            <p className="mt-1 text-sm leading-snug">{speaking.text}</p>
            <div className="mt-2 flex gap-1">
              {script.map((_, i) => (
                <span key={i} className={`h-1 flex-1 rounded-full ${i <= lineIdx ? "bg-[var(--color-fc-lime)]" : "bg-white/15"}`} />
              ))}
            </div>
            {playing ? <div className="mt-2 text-[0.6rem] text-white/40">Tap to skip ahead</div> : null}
          </button>
        ) : null}
      </div>

      {/* Controls after dialogue beat */}
      <div className="relative z-10 mt-auto space-y-2 px-3 pb-5 pt-2">
        {mood === "done" ? (
          <button type="button" className="press w-full rounded-2xl bg-[var(--color-fc-lime)] py-3.5 font-display text-lg font-bold text-black uppercase" onClick={onAccept} disabled={playing}>
            {finished ? "Leave with the deal" : "…"}
          </button>
        ) : mood === "walked" ? (
          <button type="button" className="press w-full rounded-2xl bg-white/90 py-3.5 font-display text-lg font-bold text-black uppercase" onClick={onWalk} disabled={playing}>
            {finished ? "Leave the room" : "…"}
          </button>
        ) : (
          <>
            <div className={`grid grid-cols-2 gap-2 rounded-2xl bg-white/95 p-3 text-black shadow ${playing ? "opacity-50" : ""}`}>
              <label className="text-[0.65rem] font-bold tracking-wide uppercase">
                Your fee
                <input
                  type="number"
                  disabled={playing}
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 font-display text-lg font-bold tabular-nums"
                  value={fee}
                  step={5000}
                  onChange={(e) => setFee(Number(e.target.value) || 0)}
                />
              </label>
              <label className="text-[0.65rem] font-bold tracking-wide uppercase">
                Weekly wage
                <input
                  type="number"
                  disabled={playing}
                  className="mt-1 w-full rounded-lg border border-black/15 bg-white px-2 py-2 font-display text-lg font-bold tabular-nums"
                  value={wage}
                  step={50}
                  onChange={(e) => setWage(Number(e.target.value) || 0)}
                />
              </label>
              <p className="col-span-2 text-[0.7rem] text-black/55">
                Their ask {money(deal.askFee)} · £{deal.askWage}/wk
                {gap > 0.2 ? " · Far apart" : gap < 0.08 ? " · Almost there" : " · Talking"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={playing || deal.round >= 3}
                className="press rounded-xl bg-white/15 py-3 text-sm font-bold text-white disabled:opacity-40"
                onClick={() => counterTalks(fee, wage)}
              >
                Counter
              </button>
              <button
                type="button"
                disabled={playing}
                className="press rounded-xl bg-[var(--color-fc-lime)] py-3 text-sm font-bold text-black"
                onClick={onAccept}
              >
                Meet ask
              </button>
              <button type="button" disabled={playing} className="press rounded-xl bg-[#a50e0e] py-3 text-sm font-bold text-white" onClick={onWalk}>
                Walk
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Seat({
  active,
  label,
  name,
  face,
  side,
  detail,
}: {
  active: boolean;
  label: string;
  name: string;
  face: number;
  side: "far" | "near";
  detail?: string;
}) {
  return (
    <div className={`negotiate-seat flex flex-col items-center ${side === "far" ? "" : "flex-col-reverse"} ${active ? "negotiate-speak" : "opacity-80"}`}>
      <div className={`relative ${active ? "scale-110" : "scale-100"} transition-transform duration-500`}>
        <div className={`rounded-full p-0.5 ${active ? "bg-[var(--color-fc-lime)] shadow-[0_0_24px_rgba(180,240,80,0.45)]" : "bg-white/20"}`}>
          <AvatarPortrait id={face} size={64} className="rounded-full" />
        </div>
        {active ? <span className="negotiate-pulse absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--color-fc-lime)]" /> : null}
      </div>
      <div className={`mt-1 max-w-[9rem] text-center ${side === "near" ? "mb-1" : ""}`}>
        <div className="truncate text-[0.65rem] font-bold tracking-wide text-[var(--color-fc-lime)] uppercase">{label}</div>
        <div className="truncate text-xs font-semibold text-white">{name}</div>
        {detail ? <div className="truncate text-[0.6rem] text-white/50">{detail}</div> : null}
      </div>
    </div>
  );
}
