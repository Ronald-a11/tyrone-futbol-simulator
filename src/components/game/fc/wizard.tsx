import { useState } from "react";
import { KIT_COLORS, TIER_CLUBS } from "@/game/data";
import { CHAIRMAN_AVATARS, KIT_PATTERNS, makeManagerPool } from "@/game/fc";
import { useGame } from "@/game/store";
import type { ClubManager } from "@/game/types";
import { shortName } from "@/game/util";
import { FcBtn, FcCard, FcFooter, FcHeader, FcShell } from "./chrome";

type Step =
  | "legal"
  | "welcome"
  | "club"
  | "avatar"
  | "kit"
  | "mgrIntro"
  | "mgrPick"
  | "mgrConfirm";

export function CreateWizard() {
  const backTitle = useGame((s) => s.backTitle);
  const startClub = useGame((s) => s.startClub);
  const [step, setStep] = useState<Step>("legal");
  const [chairman, setChairman] = useState("Tyrone");
  const [clubName, setClub] = useState("Quay Athletic");
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
      city: clubName.split(" ")[0] || "Quay",
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
      <FcShell
        footer={<FcFooter buttons={[{ label: "Continue", onClick: () => setStep("welcome"), primary: true }]} />}
      >
        <FcHeader title="Football Chairman" />
        <div className="fc-rays flex flex-1 flex-col items-center px-4 py-6">
          <LogoMark />
          <FcCard className="mt-4 max-h-[50vh] overflow-y-auto text-sm leading-snug text-black/80">
            <p>© 2026 Tyrone Futbol. Inspired by classic chairman management. All Rights Reserved.</p>
            <p className="mt-3">
              This game lets you build a fictional club through the Tyrone pyramid. Names are invented. No third party
              endorses this product.
            </p>
            <p className="mt-3">
              By playing you accept our{" "}
              <span className="text-sky-700 underline">End User Licence Agreement</span> and{" "}
              <span className="text-sky-700 underline">Privacy Policy</span>.
            </p>
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "welcome") {
    return (
      <FcShell
        footer={<FcFooter buttons={[{ label: "Get started!", onClick: () => setStep("club"), primary: true }]} />}
      >
        <FcHeader title="Football Chairman" />
        <div className="fc-rays flex flex-1 flex-col items-center px-4 py-6">
          <LogoMark />
          <FcCard className="mt-4 text-sm leading-relaxed text-black/80">
            Build a football club from scratch. Start as a tiny Harbor League side and climb the Tyrone pyramid to the
            Premier. Hire and fire managers, develop your stadium, negotiate transfers and contracts, and keep the fans
            and the bank manager happy. Good luck — you&apos;ll need it!
          </FcCard>
        </div>
      </FcShell>
    );
  }

  if (step === "club") {
    const ready = chairman.trim().length >= 2 && clubName.trim().length >= 3 && stadium.trim().length >= 3;
    return (
      <FcShell
        footer={
          <FcFooter
            buttons={[
              { label: "Back", onClick: () => setStep("welcome") },
              { label: "Continue", onClick: () => setStep("avatar"), primary: true, disabled: !ready },
            ]}
          />
        }
      >
        <FcHeader title="Create your club" />
        <div className="space-y-3 px-3 py-3">
          <FcCard className="grid gap-3">
            <Field label="Your name...the Chairman!" value={chairman} onChange={setChairman} />
            <Field label="Team name - don't use a real team! (3-14 chars)" value={clubName} onChange={setClub} />
            <Field label="Your team's stadium: (3-25 chars)" value={stadium} onChange={setStadium} />
            <div>
              <div className="mb-1 text-xs font-bold tracking-wide text-black/50 uppercase">Your local rivals:</div>
              <select
                className="w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
                value={rivalId}
                onChange={(e) => setRival(e.target.value)}
              >
                {rivals.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-black/60">Short code: {short}</div>
          </FcCard>
          <button type="button" className="text-sm text-white/70" onClick={backTitle}>
            Cancel
          </button>
        </div>
      </FcShell>
    );
  }

  if (step === "avatar") {
    return (
      <FcShell
        footer={
          <FcFooter
            buttons={[
              { label: "Back", onClick: () => setStep("club") },
              { label: "Confirm Avatar", onClick: () => setStep("kit"), primary: true },
            ]}
          />
        }
      >
        <FcHeader title="Choose avatar" />
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="grid grid-cols-4 gap-2">
            {CHAIRMAN_AVATARS.map((face, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAvatar(i)}
                className={`flex aspect-square items-center justify-center rounded-lg bg-white text-3xl ${avatar === i ? "ring-4 ring-[var(--color-fc-lime)]" : ""}`}
              >
                {face}
              </button>
            ))}
          </div>
        </div>
      </FcShell>
    );
  }

  if (step === "kit") {
    return (
      <FcShell
        footer={
          <FcFooter
            buttons={[
              { label: "Back", onClick: () => setStep("avatar") },
              { label: "Confirm kit", onClick: () => setStep("mgrIntro"), primary: true },
            ]}
          />
        }
      >
        <FcHeader title="Choose kit" />
        <div className="px-3 py-3">
          <FcCard className="mb-3 flex items-center justify-center py-6">
            <KitPreview primary={kit.primary} secondary={kit.secondary} pattern={kit.pattern} />
          </FcCard>
          <div className="grid grid-cols-4 gap-2">
            {KIT_PATTERNS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKit(k.id)}
                className={`rounded-lg p-1 ${kitId === k.id ? "ring-4 ring-[var(--color-fc-lime)]" : "bg-white/20"}`}
              >
                <KitPreview primary={k.primary} secondary={k.secondary} pattern={k.pattern} small />
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {KIT_COLORS.slice(0, 6).map((c) => (
              <span key={c.hex} className="h-6 w-6 rounded-full border border-white/40" style={{ background: c.hex }} />
            ))}
          </div>
        </div>
      </FcShell>
    );
  }

  if (step === "mgrIntro") {
    return (
      <FcShell
        footer={
          <FcFooter buttons={[{ label: "Choose manager", onClick: () => setStep("mgrPick"), primary: true }]} />
        }
      >
        <FcHeader title="Football Chairman" />
        <div className="px-3 py-6">
          <FcCard>
            <div className="font-display text-lg font-bold uppercase">Manager candidates shortlisted</div>
            <p className="mt-2 text-sm text-black/75">
              You need to appoint a manager — five applicants have been shortlisted.
            </p>
            <p className="mt-2 text-sm text-black/75">
              Each candidate has been assessed on three skills: matches (M), coaching (C) and transfers (T).
            </p>
            <p className="mt-2 text-sm text-black/75">
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
            buttons={[
              {
                label: "Reject and wait for more candidates",
                onClick: () => {
                  setPool(makeManagerPool(seed + pool.length * 17, ""));
                  setPicked(null);
                },
              },
            ]}
          />
        }
      >
        <FcHeader title="Hire a manager" />
        <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
          {pool.map((m) => (
            <button
              key={m.name}
              type="button"
              onClick={() => {
                setPicked(m);
                setStep("mgrConfirm");
              }}
              className="w-full rounded-xl bg-white/90 p-3 text-left shadow"
            >
              <div className="flex gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-3xl">
                  {CHAIRMAN_AVATARS[m.avatar ?? 0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-xl font-bold uppercase">{m.name}</div>
                  <div className="mt-1 flex gap-1 text-xs font-bold">
                    <span className="rounded bg-[#3E7D32] px-1 text-white">M {m.m}</span>
                    <span className="rounded bg-[#3E7D32] px-1 text-white">C {m.c}</span>
                    <span className="rounded bg-[#3E7D32] px-1 text-white">T {m.t}</span>
                  </div>
                  <div className="mt-1 text-xs text-black/60">
                    {m.formation} · {m.style} · Fans: {m.fanMood ?? "OK"}
                  </div>
                  <div className="text-xs text-black/50">Compensation £{(m.compensation ?? m.wage * 20).toLocaleString("en-GB")}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </FcShell>
    );
  }

  // mgrConfirm
  const m = picked!;
  return (
    <FcShell
      footer={
        <FcFooter
          buttons={[
            { label: "Cancel", onClick: () => setStep("mgrPick") },
            { label: "Appoint", onClick: () => finish(m), primary: true },
          ]}
        />
      }
    >
      <FcHeader title="New manager?" />
      <div className="px-3 py-3">
        <FcCard>
          <p className="text-sm text-black/75">Appoint {m.name} as manager of {clubName}?</p>
          <div className="mt-3 flex gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--color-fc-lime-soft)] text-4xl">
              {CHAIRMAN_AVATARS[m.avatar ?? 0]}
            </div>
            <div>
              <div className="font-display text-2xl font-bold uppercase">{m.name}</div>
              <div className="text-sm">
                M{m.m} C{m.c} T{m.t} · {m.formation} · {m.style}
              </div>
              <div className="text-sm text-black/60">Fans: {m.fanMood ?? "OK"}</div>
              <div className="mt-1 text-sm font-bold">
                Compensation £{(m.compensation ?? m.wage * 20).toLocaleString("en-GB")} · Bank £2.40m
              </div>
            </div>
          </div>
        </FcCard>
      </div>
    </FcShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs font-bold tracking-wide text-black/50 uppercase">
      {label}
      <input
        className="mt-1 w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm font-normal normal-case text-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function LogoMark() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-5xl" aria-hidden>
        ⚽
      </div>
      <div className="mt-2 rounded-sm bg-white px-4 py-1 font-display text-lg font-bold tracking-wide text-black uppercase shadow">
        Football Chairman
      </div>
    </div>
  );
}

function KitPreview({
  primary,
  secondary,
  pattern,
  small,
}: {
  primary: string;
  secondary: string;
  pattern: string;
  small?: boolean;
}) {
  const bg =
    pattern === "stripe"
      ? `repeating-linear-gradient(90deg, ${primary} 0 8px, ${secondary} 8px 16px)`
      : pattern === "hoop"
        ? `repeating-linear-gradient(0deg, ${primary} 0 10px, ${secondary} 10px 20px)`
        : pattern === "sash"
          ? `linear-gradient(135deg, ${primary} 40%, ${secondary} 40% 55%, ${primary} 55%)`
          : pattern === "check"
            ? `repeating-conic-gradient(${primary} 0% 25%, ${secondary} 0% 50%) 0 0 / 16px 16px`
            : primary;
  return (
    <div
      className={small ? "mx-auto h-14 w-10 rounded-sm border border-black/20" : "h-28 w-20 rounded-md border-2 border-black/20 shadow"}
      style={{ background: bg }}
    />
  );
}
