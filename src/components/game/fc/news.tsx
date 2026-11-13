import { useState } from "react";
import { APP_BRAND_SHORT } from "@/game/brand";
import { useGame } from "@/game/store";
import { FcBtn, FcCard, FcFooter, FcHeader, FcSelectRow, FcShell, formatMoney } from "./chrome";

export function NewsOverlay() {
  const card = useGame((s) => s.newsQueue[0] ?? null);
  const advance = useGame((s) => s.advanceNews);
  const pickSponsor = useGame((s) => s.pickSponsor);
  const setTickets = useGame((s) => s.setTickets);
  const setBonus = useGame((s) => s.setWinBonus);
  const [ticket, setTicket] = useState(5);
  const [sponsorIdx, setSponsorIdx] = useState(0);
  const [bonus, setBonusLocal] = useState<0 | 10 | 20>(20);

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
