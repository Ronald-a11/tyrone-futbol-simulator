import { useState } from "react";
import { AvatarPortrait } from "@/components/game/AvatarPortrait";
import { APP_BRAND } from "@/game/brand";
import { FA_NATIONS, START_BUDGET, TIER_CLUBS, TIER_META } from "@/game/data";
import { CHAIRMAN_AVATARS, KIT_PATTERNS, makeManagerPool } from "@/game/fc";
import { useGame } from "@/game/store";
import type { ClubManager, LeagueTier } from "@/game/types";
import { shortName } from "@/game/util";
import { FcCard, FcFooter, FcShell, OnboardHeader, formatMoney } from "./chrome";

type Step =
  | "legal"
  | "welcome"
  | "nation"
  | "club"
  | "avatar"
  | "kit"
  | "mgrIntro"
  | "mgrPick"
  | "mgrConfirm";

const STYLE_LABEL: Record<string, string> = {
  possession: "Passing",
  press: "Pressing",
  counter: "Counter",
  direct: "Direct",
  youth: "Youth",
};

export function CreateWizard() {
  const backTitle = useGame((s) => s.backTitle);
  const startClub = useGame((s) => s.startClub);
  const [step, setStep] = useState<Step>("legal");
  const [nationId, setNationId] = useState("eng");
  const [chairman, setChairman] = useState("John Finnigan");
  const [clubName, setClub] = useState("Harbor FC");
  const [stadium, setStadium] = useState("The Pits");
  const startTier = (FA_NATIONS.find((n) => n.id === nationId)?.startTier ?? 5) as LeagueTier;
  const [rivalId, setRival] = useState(TIER_CLUBS[5][0]?.id ?? "");
  const [avatar, setAvatar] = useState(0);
  const [kitId, setKit] = useState(0);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9) || 7);
  const [pool, setPool] = useState(() => makeManagerPool(seed, ""));
  const [picked, setPicked] = useState<ClubManager | null>(null);
  const kit = KIT_PATTERNS[kitId] ?? KIT_PATTERNS[0]!;
  const short = shortName(clubName);
  const rivals = TIER_CLUBS[startTier];
  const budget = START_BUDGET[startTier];

  const pickNation = (id: string) => {
    const n = FA_NATIONS.find((x) => x.id === id);
    if (!n?.playable) return;
    setNationId(id);
    const tier = n.startTier;
    setRival(TIER_CLUBS[tier][0]?.id ?? "");
  };

  const finish = (mgr: ClubManager) => {
    startClub({
      managerName: chairman,
      clubName,
      short,
      city: clubName.split(" ")[0] || "Harbor",
      stadiumName: stadium,
      primary: kit.primary,
      secondary: kit.secondary,
      philosophy: mgr.style,
      formation: mgr.formation,
      chairmanAvatar: avatar,
      kitId,
      rivalClubId: rivalId,
      manager: mgr,
      nationId,
      startTier,
    });
  };

  if (step === "legal") {
    return (
      <FcShell footer={<FcFooter solid buttons={[{ label: "Continue", onClick: () => setStep("welcome"), primary: true }]} />}>
        <OnboardHeader />
        <div className="flex flex-1 flex-col items-center px-4 py-5">
          <BrandMark />
          <FcCard className="mt-5 max-h-[48vh] overflow-y-auto text-sm leading-snug text-black/75">
            <p>© 2026 {APP_BRAND}. All Rights Reserved.</p>
            <p className="mt-3">
              Tyrone Futbol Simulator lets you build a fictional club through the English football pyramid. Rival clubs
              and players are simulated for play. No third party (player, club or organisation) endorses or is associated
              with this product.
            </p>
            <p className="mt-3">
              By playing this game you accept that you have read and agreed to our{" "}
              <span className="font-semibold text-sky-700">End User Licence Agreement</span> and our{" "}
              <span className="font-semibold text-sky-700">Privacy Policy</span>.
            </p>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "welcome") {
    return (
      <FcShell footer={<FcFooter solid buttons={[{ label: "Get started!", onClick: () => setStep("nation"), primary: true }]} />}>
        <OnboardHeader />
        <div className="flex flex-1 flex-col items-center px-4 py-5">
          <BrandMark />
          <FcCard className="mt-5 text-sm leading-relaxed text-black/80">
            Build a football club from scratch. Start in the National League and climb the English pyramid to the Premier
            League. Hire and fire managers, develop your stadium, negotiate transfers and contracts, and keep the fans
            and the bank manager happy.
            <span className="mt-3 block font-semibold">Good luck — you&apos;ll need it!</span>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "nation") {
    return (
      <FcShell
        footer={
          <FcFooter
            solid
            buttons={[
              {
                label: "Continue",
                onClick: () => setStep("club"),
                primary: true,
                disabled: !FA_NATIONS.find((n) => n.id === nationId)?.playable,
              },
            ]}
          />
        }
      >
        <OnboardHeader />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <FcCard className="grid gap-3">
            <div className="font-display text-2xl font-bold tracking-wide text-black uppercase">Choose your nation</div>
            <p className="text-sm text-black/65">
              England is fully playable — National League up to Premier League, with division budgets and rival sides
              drawn from the real pyramid structure.
            </p>
            <div className="grid gap-2">
              {FA_NATIONS.map((n) => {
                const selected = nationId === n.id;
                return (
                  <button
                    key={n.id}
                    type="button"
                    disabled={!n.playable}
                    onClick={() => pickNation(n.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      selected
                        ? "border-black bg-[var(--color-fc-lime)]"
                        : n.playable
                          ? "border-black/10 bg-white"
                          : "cursor-not-allowed border-black/5 bg-black/5 opacity-55"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-lg font-bold uppercase tracking-wide text-black">{n.name}</span>
                      {!n.playable ? <span className="text-[10px] font-semibold uppercase text-black/45">Soon</span> : null}
                    </div>
                    <div className="mt-0.5 text-xs text-black/60">{n.blurb}</div>
                    {n.playable ? (
                      <div className="mt-1 text-xs font-semibold text-black/70">
                        Start: {TIER_META[n.startTier].name} · Budget {formatMoney(START_BUDGET[n.startTier])}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "club") {
    const ready =
      chairman.trim().length >= 2 &&
      clubName.trim().length >= 3 &&
      clubName.trim().length <= 14 &&
      stadium.trim().length >= 3 &&
      stadium.trim().length <= 25;
    return (
      <FcShell
        footer={
          <FcFooter
            solid
            buttons={[{ label: "Continue", onClick: () => setStep("avatar"), primary: true, disabled: !ready }]}
          />
        }
      >
        <OnboardHeader />
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <FcCard className="grid gap-3">
            <div className="font-display text-2xl font-bold tracking-wide text-black uppercase">Create your club!</div>
            <div className="rounded-xl bg-black/[0.04] px-3 py-2 text-xs text-black/70">
              Starting in <span className="font-semibold text-black">{TIER_META[startTier].name}</span> with{" "}
              <span className="font-semibold text-black">{formatMoney(budget)}</span>. Promote to climb toward the Premier
              League.
            </div>
            <ClearField label="Your name...the Chairman!" value={chairman} onChange={setChairman} max={24} />
            <ClearField
              label="Team name - don't use a real team! (3-14 chars)"
              value={clubName}
              onChange={setClub}
              max={14}
            />
            <ClearField label="Your team's stadium: (3-25 chars)" value={stadium} onChange={setStadium} max={25} />
            <div>
              <div className="mb-1 text-xs font-semibold text-black/55">Your local rivals:</div>
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-xl border border-black/10 bg-white px-3 py-3 pr-10 text-sm font-bold text-black"
                  value={rivalId}
                  onChange={(e) => setRival(e.target.value)}
                >
                  {rivals.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-black/40">▾</span>
              </div>
            </div>
            <div className="text-xs text-black/50">Short code: {short}</div>
          </FcCard>
          <button type="button" className="mt-3 px-1 text-sm text-white/70" onClick={() => setStep("nation")}>
            Change nation
          </button>
          <button type="button" className="mt-1 px-1 text-sm text-white/70" onClick={backTitle}>
            Cancel
          </button>
        </div>
      </FcShell>
    );
  }

  if (step === "avatar") {
    return (
      <FcShell
        footer={<FcFooter solid buttons={[{ label: "Confirm Avatar", onClick: () => setStep("kit"), primary: true }]} />}
      >
        <OnboardHeader />
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
          <FcCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2 shrink-0 font-display text-xl font-bold tracking-wide uppercase">Choose your avatar!</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 gap-1.5">
                {CHAIRMAN_AVATARS.map((face) => (
                  <button
                    key={face}
                    type="button"
                    onClick={() => setAvatar(face)}
                    className={`flex aspect-square items-center justify-center overflow-hidden rounded-md ${
                      avatar === face
                        ? "bg-[var(--color-fc-lime)] ring-2 ring-black"
                        : "bg-[#cfd5db]"
                    }`}
                  >
                    <AvatarPortrait id={face} size={72} />
                  </button>
                ))}
              </div>
            </div>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "kit") {
    return (
      <FcShell
        footer={
          <FcFooter solid buttons={[{ label: "Confirm kit", onClick: () => setStep("mgrIntro"), primary: true }]} />
        }
      >
        <OnboardHeader />
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
          <FcCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-2">
            <div className="mb-2 shrink-0 px-1 font-display text-xl font-bold tracking-wide uppercase">Choose your kit</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 p-1">
                {KIT_PATTERNS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKit(k.id)}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${
                      kitId === k.id ? "border-black bg-[var(--color-fc-lime)]" : "border-black/10 bg-white"
                    }`}
                  >
                    <KitSwatch primary={k.primary} secondary={k.secondary} pattern={k.pattern} />
                    <span className="text-[10px] font-semibold text-black/70">{k.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "mgrIntro") {
    return (
      <FcShell
        footer={
          <FcFooter
            solid
            buttons={[
              {
                label: "See candidates",
                onClick: () => {
                  setPool(makeManagerPool(seed + kitId + avatar, ""));
                  setStep("mgrPick");
                },
                primary: true,
              },
            ]}
          />
        }
      >
        <OnboardHeader />
        <div className="flex flex-1 flex-col items-center px-4 py-5">
          <FcCard className="text-sm leading-relaxed text-black/80">
            Your first manager sets the tone. Look at formation, style, and wage — you can sack them later, but
            severance bites.
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "mgrPick") {
    return (
      <FcShell footer={<FcFooter solid buttons={[{ label: "Back", onClick: () => setStep("mgrIntro") }]} />}>
        <OnboardHeader />
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-2 font-display text-xl font-bold tracking-wide text-white uppercase">Pick a manager</div>
          <div className="grid gap-2">
            {pool.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => {
                  setPicked(m);
                  setStep("mgrConfirm");
                }}
                className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-3 text-left"
              >
                <AvatarPortrait id={m.avatar ?? 0} size={44} className="shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-black">{m.name}</div>
                  <div className="text-xs text-black/55">
                    {m.formation} · {STYLE_LABEL[m.style] ?? m.style} · £{m.wage.toLocaleString("en-GB")}/wk
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </FcShell>
    );
  }

  if (step === "mgrConfirm" && picked) {
    return (
      <FcShell
        footer={
          <FcFooter
            solid
            buttons={[
              { label: "Back", onClick: () => setStep("mgrPick") },
              { label: "Appoint", onClick: () => finish(picked), primary: true },
            ]}
          />
        }
      >
        <OnboardHeader />
        <div className="flex flex-1 flex-col items-center px-4 py-5">
          <FcCard className="w-full text-center">
            <div className="mx-auto mb-3 flex justify-center">
              <AvatarPortrait id={picked.avatar ?? 0} size={72} className="rounded-full" />
            </div>
            <div className="font-display text-2xl font-bold uppercase tracking-wide text-black">{picked.name}</div>
            <div className="mt-1 text-sm text-black/60">
              {picked.formation} · {STYLE_LABEL[picked.style] ?? picked.style}
            </div>
            <div className="mt-3 text-sm text-black/75">
              Wage £{picked.wage.toLocaleString("en-GB")}/wk · Severance £
              {(picked.wage * 52).toLocaleString("en-GB")}
            </div>
            <div className="mt-4 text-xs text-black/50">
              {clubName} · {TIER_META[startTier].name} · {formatMoney(budget)}
            </div>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  return null;
}

function BrandMark() {
  return (
    <div className="flex flex-col items-center">
      <div className="font-display text-3xl text-white uppercase">{APP_BRAND}</div>
      <div className="mt-1 font-sans text-[0.7rem] font-extrabold text-white/55 uppercase">Chairman career</div>
    </div>
  );
}

function ClearField({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-black/55">{label}</span>
      <input
        className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-black/20"
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function KitSwatch({
  primary,
  secondary,
  pattern,
}: {
  primary: string;
  secondary: string;
  pattern: string;
}) {
  return (
    <div
      className="relative h-14 w-12 overflow-hidden rounded-md border border-black/15"
      style={{ background: primary }}
    >
      {pattern === "stripe" ? (
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${secondary} 0 4px, transparent 4px 10px)`,
          }}
        />
      ) : null}
      {pattern === "hoop" ? (
        <div
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, ${secondary} 0 5px, transparent 5px 12px)`,
          }}
        />
      ) : null}
      {pattern === "sash" ? (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, transparent 38%, ${secondary} 38%, ${secondary} 52%, transparent 52%)`,
          }}
        />
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-2" style={{ background: secondary }} />
    </div>
  );
}
