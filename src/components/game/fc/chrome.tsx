import type { ButtonHTMLAttributes, ReactNode } from "react";
import { APP_BRAND_SHORT } from "@/game/brand";

export function FcShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="mobile-frame mx-auto flex min-h-dvh w-full max-w-[430px] flex-col">
      <div className="fc-shell relative flex min-h-dvh flex-1 flex-col overflow-hidden">
        <div className="fc-rays relative flex min-h-0 flex-1 flex-col">{children}</div>
        {footer ? <div className="safe-bottom shrink-0 px-2 pb-2 pt-1">{footer}</div> : null}
      </div>
    </div>
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
    <header className="fc-header safe-top flex shrink-0 items-center gap-2 px-3 pb-2.5 pt-2">
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white"
        aria-label="Help"
        onClick={onHelp}
      >
        ?
      </button>
      <div className="min-w-0 flex-1 text-center">
        {!brand && title !== APP_BRAND_SHORT ? (
          <div className="text-[0.65rem] font-semibold tracking-[0.14em] text-white/55 uppercase">{APP_BRAND_SHORT}</div>
        ) : null}
        <h1 className="truncate font-display text-[1.35rem] leading-none font-bold tracking-wide text-white uppercase">
          {label}
        </h1>
      </div>
      <button
        type="button"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-base text-white"
        aria-label="Settings"
        onClick={onSettings}
      >
        ⚙
      </button>
    </header>
  );
}

export function FcCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`fc-card rounded-2xl p-4 shadow-sm ${className}`}>{children}</section>;
}

export function FcFooter({
  buttons,
}: {
  buttons: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }[];
}) {
  return (
    <nav className="fc-footer grid gap-1.5 rounded-2xl p-1.5" style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          disabled={b.disabled}
          onClick={b.onClick}
          className={`press min-h-12 rounded-xl px-2 text-center font-display text-[0.8rem] font-bold tracking-wide uppercase disabled:opacity-40 ${
            b.primary
              ? "bg-[var(--color-fc-lime)] text-[#142016]"
              : "bg-white/10 text-white"
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
      ? "bg-[var(--color-fc-navy)] text-white"
      : tone === "green"
        ? "bg-[var(--color-fc-forest)] text-white"
        : tone === "lime"
          ? "bg-[var(--color-fc-lime-soft)] text-[#142016]"
          : "bg-white text-[#142016]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press flex min-h-[4.5rem] flex-col items-center justify-center rounded-2xl px-2 py-2.5 shadow-sm ${bg} ${wide ? "col-span-2" : ""}`}
    >
      <div className="font-display text-[0.62rem] font-bold tracking-[0.12em] uppercase opacity-75">{label}</div>
      {children ?? <div className="mt-0.5 font-display text-[1.65rem] font-bold leading-none tabular-nums">{value}</div>}
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
        ? "bg-white text-[#142016] shadow-sm"
        : kind === "red"
          ? "bg-[#a50e0e] text-white"
          : "bg-[var(--color-fc-forest)] text-white";
  return (
    <button
      type="button"
      {...props}
      className={`press inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold disabled:opacity-40 ${look} ${className}`}
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
      className={`press w-full rounded-xl border px-3 py-3 text-left text-sm ${
        selected
          ? "border-[var(--color-fc-lime)] bg-[var(--color-fc-lime)]/35"
          : "border-black/10 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

export function FormDots({ form }: { form: string }) {
  const cells = form.padEnd(10, " ").slice(-10).split("");
  return (
    <div className="flex justify-center gap-1.5 py-1">
      {cells.map((c, i) => {
        const tone =
          c === "W" ? "bg-[#3E7D32] text-white" : c === "D" ? "bg-[#c9a227] text-white" : c === "L" ? "bg-[#a50e0e] text-white" : "bg-white/15 text-transparent";
        return (
          <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-bold ${tone}`}>
            {c.trim() || "·"}
          </span>
        );
      })}
    </div>
  );
}

export function PitchMark() {
  return (
    <div className="mx-auto mb-3 flex h-24 w-40 items-center justify-center rounded-2xl bg-[#245a32] shadow-inner">
      <div className="h-16 w-28 rounded-lg border-2 border-white/40 bg-[#2d6b3a]/70" />
    </div>
  );
}

export function MoneyBag({ n }: { n: number }) {
  const neg = n < 0;
  return <span className={neg ? "font-bold text-[#a50e0e]" : "font-bold text-[#3E7D32]"}>{formatMoney(n)}</span>;
}

export function formatMoney(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}£${(abs / 1_000_000).toFixed(2)}m`;
  if (abs >= 1_000) return `${sign}£${Math.round(abs / 1000)}k`;
  return `${sign}£${Math.round(abs)}`;
}

export function posTone(pos: string) {
  if (pos === "GK") return "bg-amber-200 text-amber-950";
  if (pos === "CB" || pos === "LB" || pos === "RB") return "bg-sky-200 text-sky-950";
  if (pos === "CDM" || pos === "CM" || pos === "CAM") return "bg-emerald-200 text-emerald-950";
  return "bg-rose-200 text-rose-950";
}
