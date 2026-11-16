import { useEffect, useState, type ReactNode } from "react";
import { AvatarPortrait } from "@/components/game/AvatarPortrait";
import { APP_BRAND_SHORT } from "@/game/brand";
import { CHAIRMAN_AVATARS } from "@/game/fc";
import { lineOf } from "@/game/data";
import { maskOvr, ovr } from "@/game/players";
import { useGame } from "@/game/store";
import type { Position } from "@/game/types";
import { money } from "@/game/util";
import { FcBtn, FcCard, FcFooter, FcHeader, FcSelectRow, FcShell, formatMoney } from "./chrome";

function faceId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 3)) % CHAIRMAN_AVATARS.length;
  return CHAIRMAN_AVATARS[h] ?? 0;
}

function roleLetter(pos: Position) {
  if (pos === "GK") return "G";
  const line = lineOf(pos);
  if (line === "def") return "D";
  if (line === "mid") return "M";
  return "A";
}

function roleTone(letter: string) {
  if (letter === "G") return "bg-[#5b3a8c]";
  if (letter === "D") return "bg-[#1c3d66]";
  if (letter === "M") return "bg-[#1f8a5b]";
  return "bg-[#c97a1a]";
}

function PlayerSnap({
  playerId,
  extra,
}: {
  playerId: string;
  extra?: ReactNode;
}) {
  const players = useGame((s) => s.players);
  const scout = useGame((s) => s.staff.scout);
  const xi = useGame((s) => s.xi);
  const p = players.find((x) => x.id === playerId);
  if (!p) return null;
  const letter = roleLetter(p.pos);
  const rating = maskOvr(ovr(p), scout);
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/[0.04] p-2">
      <AvatarPortrait id={faceId(p.id)} size={52} />
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-bold uppercase leading-tight">{p.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-black/65">
          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-white ${roleTone(letter)}`}>
            <span>{letter}</span>
            <span className="tabular-nums">{rating}</span>
          </span>
          <span>Age {p.age}</span>
        </div>
        {extra}
        <div className="mt-1 text-xs text-black/60">
          Squad status: <strong>{xi.includes(p.id) ? "First Team" : "Squad"}</strong>
        </div>
      </div>
    </div>
  );
}

export function NewsOverlay() {
  const card = useGame((s) => s.newsQueue[0] ?? null);
  const advance = useGame((s) => s.advanceNews);
  const pickSponsor = useGame((s) => s.pickSponsor);
  const setTickets = useGame((s) => s.setTickets);
  const setBonus = useGame((s) => s.setWinBonus);
  const answerBid = useGame((s) => s.answerBid);
  const answerContract = useGame((s) => s.answerContract);
  const rejectContract = useGame((s) => s.rejectContract);
  const setScreen = useGame((s) => s.setScreen);
  const season = useGame((s) => s.season);
  const [ticket, setTicket] = useState(12);
  const [sponsorIdx, setSponsorIdx] = useState(0);
  const [bonus, setBonusLocal] = useState<0 | 10 | 20>(20);
  const [wage, setWage] = useState(0);
  const [years, setYears] = useState(2);

  useEffect(() => {
    if (card?.kind === "tickets") setTicket(card.suggested);
    if (card?.kind === "contract") {
      setWage(card.suggestedWage);
      setYears(card.suggestedYears);
    }
  }, [card?.id]);

  if (!card) return null;

  if (card.kind === "continue") {
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        <FcShell footer={<FcFooter buttons={[{ label: card.cta ?? "Continue", onClick: advance, primary: true }]} />}>
          <FcHeader title={APP_BRAND_SHORT} brand />
          <div className="px-3 py-6">
            <FcCard>
              <div className="font-display text-xl font-bold uppercase">{card.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-black/75">{card.body}</p>
            </FcCard>
          </div>
        </FcShell>
      </div>
    );
  }

  if (card.kind === "sponsor") {
    const opt = card.options[sponsorIdx] ?? card.options[0]!;
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        <FcShell
          footer={
            <FcFooter
              buttons={[
                {
                  label: "Choose Shirt Sponsor",
                  primary: true,
                  onClick: () => pickSponsor(opt.name, opt.fee, opt.untilSeason),
                },
              ]}
            />
          }
        >
          <FcHeader title="Choose shirt sponsor" />
          <div className="space-y-2 px-3 py-3">
            <p className="text-sm text-white/85">{card.body}</p>
            {card.options.map((o, i) => (
              <FcSelectRow key={o.name} selected={sponsorIdx === i} onClick={() => setSponsorIdx(i)}>
                <div className="font-bold">{o.name}</div>
                <div className="text-xs text-black/60">
                  {formatMoney(o.fee)} / season · until S{o.untilSeason}
                </div>
              </FcSelectRow>
            ))}
          </div>
        </FcShell>
      </div>
    );
  }

  if (card.kind === "tickets") {
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        <FcShell
          footer={
            <FcFooter buttons={[{ label: "Set Ticket Prices", primary: true, onClick: () => setTickets(ticket) }]} />
          }
        >
          <FcHeader title="Set ticket prices" />
          <div className="px-3 py-3">
            <FcCard>
              <p className="text-sm text-black/75">{card.body}</p>
              <div className="mt-4 flex items-center justify-between gap-2">
                <FcBtn kind="red" onClick={() => setTicket((t) => Math.max(card.min, t - 1))}>
                  −
                </FcBtn>
                <div className="font-display text-5xl font-bold tabular-nums">£{ticket}</div>
                <FcBtn kind="lime" onClick={() => setTicket((t) => Math.min(card.max, t + 1))}>
                  +
                </FcBtn>
              </div>
            </FcCard>
          </div>
        </FcShell>
      </div>
    );
  }

  if (card.kind === "bid") {
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        <FcShell
          footer={
            <FcFooter
              buttons={[
                { label: "Accept bid", primary: true, onClick: () => answerBid(true) },
                { label: "Reject", onClick: () => answerBid(false) },
              ]}
            />
          }
        >
          <FcHeader title={APP_BRAND_SHORT} brand />
          <div className="px-3 py-4">
            <FcCard>
              <div className="font-display text-[1.4rem] leading-none uppercase">{card.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-black/75">{card.body}</p>
              <PlayerSnap
                playerId={card.playerId}
                extra={
                  <div className="mt-1 text-xs text-black/70">
                    Value: <strong>{money(card.fee)}</strong>
                  </div>
                }
              />
              <FcBtn kind="white" className="mt-3 w-full" onClick={() => setScreen("squad")}>
                View Squad
              </FcBtn>
            </FcCard>
          </div>
        </FcShell>
      </div>
    );
  }

  if (card.kind === "contract") {
    const expireLabel = (y: number) => {
      const end = season + y;
      return y === 1 ? `Jan ${String(end).slice(2)}` : String(end);
    };
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        <FcShell
          footer={
            <FcFooter
              buttons={[
                { label: "Offer new contract", primary: true, onClick: () => answerContract(wage, years) },
                { label: "Reject", onClick: rejectContract },
              ]}
            />
          }
        >
          <FcHeader title={APP_BRAND_SHORT} brand />
          <div className="px-3 py-4">
            <FcCard>
              <div className="font-display text-[1.4rem] leading-none uppercase">{card.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-black/75">{card.body}</p>
              <PlayerSnap
                playerId={card.playerId}
                extra={
                  <div className="mt-1 space-y-0.5 text-xs text-black/70">
                    <div>
                      Current Wage: <strong>£{card.suggestedWage}</strong>
                    </div>
                    <div>
                      Expires: <strong>{season + 1}</strong>
                    </div>
                  </div>
                }
              />
              <div className="mt-4 text-xs font-bold tracking-wide text-black/55 uppercase">Wage (Per Week)</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {card.wages.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWage(w)}
                    className={`min-w-[3.2rem] rounded-lg px-2 py-2 text-sm font-bold tabular-nums ${
                      wage === w ? "bg-[var(--color-fc-lime)] text-black" : "bg-black/8 text-black/70"
                    }`}
                  >
                    £{w}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs font-bold tracking-wide text-black/55 uppercase">Contract Expires</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {card.years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYears(y)}
                    className={`min-w-[3.2rem] rounded-lg px-2 py-2 text-sm font-bold tabular-nums ${
                      years === y ? "bg-[var(--color-fc-lime)] text-black" : "bg-black/8 text-black/70"
                    }`}
                  >
                    {expireLabel(y)}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-0.5 text-xs text-black/65">
                <div>
                  Current wage bill: <strong>{formatMoney(card.wageBill)}</strong>
                </div>
                <div>
                  Recommended max wage bill: <strong>{formatMoney(card.recommendedBill)}</strong>
                </div>
              </div>
              <FcBtn kind="white" className="mt-3 w-full" onClick={() => setScreen("squad")}>
                View Squad
              </FcBtn>
            </FcCard>
          </div>
        </FcShell>
      </div>
    );
  }

  if (card.kind === "weekFinance") {
    const f = card.finance;
    const outRows: [string, number][] = [
      ["Player/Management Wages", f.wages],
      ["Stadium/Running Costs", f.ground],
      ["Youth Academy", f.academy],
      ["Training Facilities", f.training],
      ["Fees Out", f.feesOut],
      ["Win bonus", f.bonus],
      ["Overdraft interest", f.interest],
    ];
    const inRows: [string, number][] = [
      ["Fees In", f.feesIn],
      ["Ticket Sales", f.tickets + f.boxes],
      ["Food/Drink/Merchandise Sales", f.food + f.merch],
      ["Prize Money/Sponsorship/TV", f.tv + f.sponsor + f.result],
    ];
    return (
      <div className="fixed inset-0 z-50 bg-black/40">
        <FcShell footer={<FcFooter buttons={[{ label: "Continue", primary: true, onClick: advance }]} />}>
          <FcHeader title={APP_BRAND_SHORT} brand />
          <div className="px-3 py-4">
            <FcCard>
              <div className="font-display text-[1.4rem] leading-none uppercase">{card.title}</div>
              <ul className="mt-3 text-sm">
                {outRows.map(([label, n]) => (
                  <li key={label} className="flex justify-between border-t border-black/10 py-1.5">
                    <span>{label}</span>
                    <span className="tabular-nums text-[#a50e0e]">{formatMoney(n)}</span>
                  </li>
                ))}
              </ul>
              <div className="my-1 border-t border-black/25" />
              <ul className="text-sm">
                {inRows.map(([label, n]) => (
                  <li key={label} className="flex justify-between border-t border-black/10 py-1.5">
                    <span>{label}</span>
                    <span className="tabular-nums text-[#3E7D32]">{formatMoney(n)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex justify-between border-t-2 border-black/30 pt-2 font-display text-lg font-bold uppercase">
                <span>{f.net < 0 ? "Loss" : "Profit"}</span>
                <span className={`tabular-nums ${f.net < 0 ? "text-[#a50e0e]" : "text-[#3E7D32]"}`}>
                  {formatMoney(Math.abs(f.net))}
                </span>
              </div>
            </FcCard>
          </div>
        </FcShell>
      </div>
    );
  }

  // bonus
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <FcShell
        footer={
          <FcFooter buttons={[{ label: "Confirm Bonus Option", primary: true, onClick: () => setBonus(bonus) }]} />
        }
      >
        <FcHeader title="Win bonus" />
        <div className="px-3 py-3">
          <FcCard>
            <p className="text-sm text-black/75">{card.body}</p>
            <p className="mt-2 text-sm">
              Weekly wages {formatMoney(card.wages)} · recommended max {formatMoney(card.recommended)}
            </p>
            <div className="mt-3 grid gap-2">
              {([0, 10, 20] as const).map((pct) => (
                <FcSelectRow key={pct} selected={bonus === pct} onClick={() => setBonusLocal(pct)}>
                  <span className="font-bold">{pct}%</span> · pay {formatMoney(Math.round(card.wages * (pct / 100)))} on a
                  win week
                </FcSelectRow>
              ))}
            </div>
          </FcCard>
        </div>
      </FcShell>
    </div>
  );
}
