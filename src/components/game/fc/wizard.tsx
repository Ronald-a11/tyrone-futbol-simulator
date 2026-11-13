import { useState } from "react";
import { APP_BRAND } from "@/game/brand";
import { TIER_CLUBS } from "@/game/data";
import { CHAIRMAN_AVATARS, KIT_PATTERNS, makeManagerPool } from "@/game/fc";
import { useGame } from "@/game/store";
import type { ClubManager } from "@/game/types";
import { shortName } from "@/game/util";
import { FcCard, FcFooter, FcShell, OnboardHeader, formatMoney } from "./chrome";

type Step =
  | "legal"
  | "welcome"
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
  const [chairman, setChairman] = useState("John Finnigan");
  const [clubName, setClub] = useState("Harbor FC");
  const [stadium, setStadium] = useState("The Pits");
  const [rivalId, setRival] = useState(TIER_CLUBS[3][0]?.id ?? "");
  const [avatar, setAvatar] = useState(0);
  const [kitId, setKit] = useState(0);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9) || 7);
  const [pool, setPool] = useState(() => makeManagerPool(seed, ""));
  const [picked, setPicked] = useState<ClubManager | null>(null);
  const kit = KIT_PATTERNS[kitId] ?? KIT_PATTERNS[0]!;
  const short = shortName(clubName);
  const rivals = TIER_CLUBS[3];

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
              Tyrone Futbol Simulator lets you build a fictional club through the Tyrone pyramid. Names are invented for
              play. No third party (player, club or organisation) endorses or is associated with this product.
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
      <FcShell footer={<FcFooter solid buttons={[{ label: "Get started!", onClick: () => setStep("club"), primary: true }]} />}>
        <OnboardHeader />
        <div className="flex flex-1 flex-col items-center px-4 py-5">
          <BrandMark />
          <FcCard className="mt-5 text-sm leading-relaxed text-black/80">
            Build a football club from scratch. Start as a tiny Harbor League side and climb the Tyrone pyramid to the
            Premier. Hire and fire managers, develop your stadium, negotiate transfers and contracts, and keep the fans
            and the bank manager happy.
            <span className="mt-3 block font-semibold">Good luck — you&apos;ll need it!</span>
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
          <button type="button" className="mt-3 px-1 text-sm text-white/70" onClick={backTitle}>
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
                {CHAIRMAN_AVATARS.map((face, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatar(i)}
                    className={`flex aspect-square items-center justify-center rounded-md text-3xl ${
                      avatar === i
                        ? "bg-[var(--color-fc-lime)] ring-2 ring-black"
                        : "bg-[#cfd5db]"
                    }`}
                  >
                    {face}
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
            <div className="min-h-0 flex-1 overflow-y-auto p-1">
              <div className="grid grid-cols-4 gap-1.5">
                {KIT_PATTERNS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKit(k.id)}
                    className={`flex aspect-square flex-col items-center justify-center rounded-md p-1 ${
                      kitId === k.id ? "bg-[var(--color-fc-lime)] ring-2 ring-black" : "bg-[#cfd5db]"
                    }`}
                  >
                    <KitMannequin primary={k.primary} secondary={k.secondary} pattern={k.pattern} />
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
        footer={<FcFooter solid buttons={[{ label: "Choose manager", onClick: () => setStep("mgrPick"), primary: true }]} />}
      >
        <OnboardHeader />
        <div className="flex flex-1 items-start px-3 py-8">
          <FcCard>
            <div className="font-display text-xl font-bold tracking-wide uppercase">Manager candidates shortlisted</div>
            <p className="mt-3 text-sm leading-relaxed text-black/80">
              You need to appoint a manager — five applicants have been shortlisted.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black/80">
              Each candidate has been assessed on three skills: matches (M), coaching (C) and transfers (T).
            </p>
            <p className="mt-3 text-sm leading-relaxed text-black/80">
              You can also see their preferred formation, style of play, and how keen the fans are on each candidate.
            </p>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "mgrPick") {
    return (
      <FcShell
        footer={
          <FcFooter
            solid
            buttons={[
              {
                label: "Reject and wait for more candidates",
                primary: true,
                onClick: () => {
                  setPool(makeManagerPool(seed + Date.now(), ""));
                  setPicked(null);
                },
              },
            ]}
          />
        }
      >
        <OnboardHeader />
        <div className="flex min-h-0 flex-1 flex-col px-3 py-3">
          <FcCard className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
            <div className="min-h-0 flex-1 divide-y divide-black/10 overflow-y-auto">
              {pool.map((m) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => {
                    setPicked(m);
                    setStep("mgrConfirm");
                  }}
                  className="flex w-full gap-3 px-3 py-3 text-left hover:bg-black/[0.03]"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-4xl">
                    {CHAIRMAN_AVATARS[m.avatar ?? 0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-bold uppercase">{m.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <StatBlock letter="M" n={m.m} />
                      <StatBlock letter="C" n={m.c} />
                      <StatBlock letter="T" n={m.t} />
                    </div>
                    <div className="mt-1 text-xs text-black/70">
                      {m.formation} {STYLE_LABEL[m.style] ?? m.style} · Fans: {m.fanMood ?? "OK"}
                    </div>
                    <div className="text-xs text-black/55">
                      Pay compensation: {(m.compensation ?? 0) > 0 ? formatMoney(m.compensation ?? 0) : "None"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  const m = picked!;
  const comp = m.compensation ?? 0;
  return (
    <FcShell
      footer={
        <FcFooter
          solid
          buttons={[
            { label: "Appoint", onClick: () => finish(m), primary: true },
            { label: "Cancel", onClick: () => setStep("mgrPick") },
          ]}
        />
      }
    >
      <OnboardHeader />
      <div className="px-3 py-6">
        <FcCard>
          <div className="font-display text-xl font-bold uppercase">New manager?</div>
          <p className="mt-2 text-sm text-black/75">
            Confirm the appointment of {m.name} as {clubName}&apos;s new manager?
          </p>
          <div className="mt-4 flex gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-5xl">
              {CHAIRMAN_AVATARS[m.avatar ?? 0]}
            </div>
            <div className="min-w-0">
              <div className="font-display text-2xl font-bold uppercase">{m.name}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                <StatBlock letter="M" n={m.m} />
                <StatBlock letter="C" n={m.c} />
                <StatBlock letter="T" n={m.t} />
              </div>
              <div className="mt-1 text-sm">
                {m.formation} {STYLE_LABEL[m.style] ?? m.style} · {m.happiness}% happy
              </div>
              <div className="text-sm text-black/60">Wage: £{m.wage} pw</div>
            </div>
          </div>
          <p className="mt-4 text-sm text-black/70">
            {comp > 0
              ? `You will need to pay compensation of £${comp.toLocaleString("en-GB")} to his current club. `
              : "No compensation is due. "}
            Your bank balance is £2,400,000.
          </p>
        </FcCard>
      </div>
    </FcShell>
  );
}

function StatBlock({ letter, n }: { letter: string; n: number }) {
  return (
    <span className="inline-flex overflow-hidden rounded-sm text-[0.7rem] font-bold">
      <span className="bg-[#5a9e3d] px-1.5 py-0.5 text-white">{letter}</span>
      <span className="bg-black px-1.5 py-0.5 text-white tabular-nums">{n}</span>
    </span>
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
  max?: number;
}) {
  return (
    <label className="block text-xs font-semibold text-black/55">
      {label}
      <div className="relative mt-1">
        <input
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-3 pr-10 text-sm font-normal text-black"
          value={value}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
        />
        {value ? (
          <button
            type="button"
            className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/10 text-xs font-bold text-black/50"
            onClick={() => onChange("")}
            aria-label="Clear"
          >
            ×
          </button>
        ) : null}
      </div>
    </label>
  );
}

function BrandMark() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-white/25" />
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-5xl shadow-lg" aria-hidden>
          ⚽
        </div>
      </div>
      <div className="mt-3 flex flex-col items-center gap-1">
        <div className="rounded-sm bg-white px-5 py-1 font-display text-lg font-bold tracking-wide text-black uppercase shadow">
          Tyrone Futbol
        </div>
        <div className="rounded-sm bg-white px-5 py-1 font-display text-lg font-bold tracking-wide text-black uppercase shadow">
          Simulator
        </div>
      </div>
    </div>
  );
}

function KitMannequin({
  primary,
  secondary,
  pattern,
}: {
  primary: string;
  secondary: string;
  pattern: string;
}) {
  const bg =
    pattern === "stripe"
      ? `repeating-linear-gradient(90deg, ${primary} 0 5px, ${secondary} 5px 10px)`
      : pattern === "hoop"
        ? `repeating-linear-gradient(0deg, ${primary} 0 6px, ${secondary} 6px 12px)`
        : pattern === "sash"
          ? `linear-gradient(135deg, ${primary} 38%, ${secondary} 38% 52%, ${primary} 52%)`
          : pattern === "check"
            ? `repeating-conic-gradient(${primary} 0% 25%, ${secondary} 0% 50%) 0 0 / 10px 10px`
            : primary;
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end pb-1">
      <div className="mb-0.5 h-3 w-3 rounded-full bg-[#f0d2b0]" />
      <div className="h-[58%] w-[72%] rounded-t-md border border-black/15 shadow-sm" style={{ background: bg }} />
    </div>
  );
}
