import type { ButtonHTMLAttributes, ReactNode } from "react";
import { APP_BRAND_SHORT } from "@/game/brand";
import { currencySymbol, getDisplayCurrency } from "@/game/util";

export function FcShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mobile-frame mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <div className="fc-shell relative flex min-h-dvh flex-1 flex-col overflow-hidden">
        <div className="fc-rays relative flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
        {footer ? <div className="safe-bottom z-10 shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
}

export function OnboardHeader({ onHelp }: { onHelp?: () => void }) {
  return (
    <header className="fc-header safe-top flex shrink-0 items-center gap-2 px-2.5 pb-2 pt-1.5">
      <button type="button" className="fc-mark shrink-0" aria-label="Help" onClick={onHelp}>
        ?
      </button>
      <h1 className="min-w-0 flex-1 truncate text-center font-display text-[1.2rem] leading-none text-white uppercase">
        Tyrone Futbol Simulator
      </h1>
      <span className="w-9 shrink-0" aria-hidden />
    </header>
  );
}

export function FcHeader({
  title,
  onSettings,
  onHelp,
  brand,
}: {
  title: string;
  onSettings?: () => void;
  onHelp?: () => void;
  brand?: boolean;
}) {
  const label = brand ? APP_BRAND_SHORT : title;
  return (
    <header className="fc-header safe-top flex shrink-0 items-center gap-2 px-2.5 pb-2 pt-1.5">
      <button type="button" className="fc-mark shrink-0" aria-label="Help" onClick={onHelp}>
        ?
      </button>
      <div className="min-w-0 flex-1 text-center">
        <h1 className="truncate font-display text-[1.35rem] font-semibold leading-none tracking-wide text-white uppercase">{label}</h1>
      </div>
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/15 text-lg leading-none font-black text-white"
        aria-label="Settings"
        onClick={onSettings}
      >
        ⚙
      </button>
    </header>
  );
}

export function FcCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`fc-card rounded-xl p-3.5 ${className}`}>{children}</section>;
}

export function FcFooter({
  buttons,
  solid,
}: {
  buttons: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }[];
  solid?: boolean;
}) {
  if (solid) {
    return (
      <nav className="grid overflow-hidden" style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}>
        {buttons.map((b) => (
          <button
            key={b.label}
            type="button"
            disabled={b.disabled}
            onClick={b.onClick}
            className={`press min-h-14 border-r border-black/25 px-2 text-center font-display text-[1rem] text-white uppercase last:border-r-0 disabled:opacity-40 ${
              b.primary ? "bg-[#3E7D32]" : "bg-[#2d5a27]"
            }`}
          >
            {b.label}
          </button>
        ))}
      </nav>
    );
  }
  return (
    <nav className="grid" style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          disabled={b.disabled}
          onClick={b.onClick}
          className={`press min-h-[3.4rem] border-r border-black/20 px-2 text-center font-display text-[0.95rem] uppercase last:border-r-0 disabled:opacity-40 ${
            b.primary ? "bg-[var(--color-fc-lime)] text-[#142016]" : "bg-[#2d5a27] text-white"
          }`}
        >
          {b.label}
        </button>
      ))}
    </nav>
  );
}

export function FcTile({
  label,
  value,
  tone = "white",
  wide,
  onClick,
  children,
}: {
  label: string;
  value?: string | number;
  tone?: "white" | "navy" | "green" | "lime";
  wide?: boolean;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const bg =
    tone === "navy"
      ? "fc-tile-navy bg-[var(--color-fc-navy)] text-white"
      : tone === "green"
        ? "fc-tile-green bg-[var(--color-fc-forest)] text-white"
        : tone === "lime"
          ? "bg-[var(--color-fc-lime-soft)] text-[#142016]"
          : "bg-[#ecefec] text-[#142016]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press fc-tile flex min-h-[4.35rem] flex-col items-center justify-center rounded-xl px-1.5 py-2 ${bg} ${wide ? "col-span-2" : ""}`}
    >
      <div className="font-sans text-[0.68rem] leading-none font-extrabold uppercase opacity-80">{label}</div>
      {children ?? (
        <div className="mt-1 font-display text-[1.75rem] leading-none tabular-nums">{value}</div>
      )}
    </button>
  );
}

export function FcBtn({
  kind = "green",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "green" | "lime" | "white" | "red" }) {
  const look =
    kind === "lime"
      ? "bg-[var(--color-fc-lime)] text-[#142016]"
      : kind === "white"
        ? "bg-[#ecefec] text-[#142016]"
        : kind === "red"
          ? "bg-[#a50e0e] text-white"
          : "bg-[var(--color-fc-forest)] text-white";
  return (
    <button
      type="button"
      {...props}
      className={`press inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-black/15 px-3 font-sans text-sm font-extrabold uppercase disabled:opacity-40 ${look} ${className}`}
    />
  );
}

export function FcSelectRow({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press w-full rounded-lg border-2 px-3 py-2.5 text-left text-sm font-bold ${
        selected
          ? "border-[#8fbf3a] bg-[var(--color-fc-lime)]/40"
          : "border-black/15 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

export function FormDots({ form }: { form: string }) {
  const cells = form.padEnd(10, " ").slice(-10).split("");
  return (
    <div className="flex justify-center gap-1 py-1">
      {cells.map((c, i) => {
        const tone =
          c === "W"
            ? "bg-[#3E7D32] text-white"
            : c === "D"
              ? "bg-[#c9a227] text-white"
              : c === "L"
                ? "bg-[#a50e0e] text-white"
                : "border-2 border-white/35 bg-transparent text-transparent";
        return (
          <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-sm text-[0.7rem] font-black ${tone}`}>
            {c.trim() || "·"}
          </span>
        );
      })}
    </div>
  );
}

export function PitchMark() {
  return (
    <div className="mx-auto mb-3 h-28 w-full max-w-[220px] overflow-hidden rounded-xl shadow-md">
      <img src="/stadium/pitch-good.jpg" alt="" className="h-full w-full object-cover" draggable={false} />
    </div>
  );
}

export function MoneyBag({ n }: { n: number }) {
  const neg = n < 0;
  return <span className={neg ? "font-extrabold text-[#a50e0e]" : "font-extrabold text-[#3E7D32]"}>{formatMoney(n)}</span>;
}

export function formatMoney(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const sym = currencySymbol(getDisplayCurrency());
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `${sign}${sym}${Math.round(abs / 1000)}k`;
  return `${sign}${sym}${Math.round(abs)}`;
}

export function posTone(pos: string) {
  if (pos === "GK") return "bg-amber-200 text-amber-950";
  if (pos === "CB" || pos === "LB" || pos === "RB") return "bg-sky-200 text-sky-950";
  if (pos === "CDM" || pos === "CM" || pos === "CAM") return "bg-emerald-200 text-emerald-950";
  return "bg-rose-200 text-rose-950";
}

export function TileGlyph({ kind }: { kind: "cup" | "chart" | "pitch" | "star" }) {
  if (kind === "cup") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5">
        <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" stroke="currentColor" strokeWidth="2" />
        <path d="M8 5H5.5A2.5 2.5 0 0 0 5 10c1.2 0 2.2-.7 2.7-1.7M16 5h2.5A2.5 2.5 0 0 1 19 10c-1.2 0-2.2-.7-2.7-1.7" stroke="currentColor" strokeWidth="2" />
        <path d="M10 14h4v2l-1 3h-2l-1-3v-2Z" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "chart") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5">
        <path d="M4 18V6M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        <path d="M8 14v-3M12 14V8M16 14v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
    );
  }
  if (kind === "pitch") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5">
        <rect x="3" y="5" width="18" height="14" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M12 5v14M3 12h18" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-0.5">
      <path d="M12 3.5 13.9 9h5.6l-4.5 3.4 1.7 5.5L12 14.8 7.3 17.9l1.7-5.5L4.5 9h5.6L12 3.5Z" />
    </svg>
  );
}
