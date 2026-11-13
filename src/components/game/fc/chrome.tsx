import type { ButtonHTMLAttributes, ReactNode } from "react";

export function FcShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fc-shell mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="fc-rays relative flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? <div className="safe-bottom shrink-0">{footer}</div> : null}
    </div>
  );
}

export function FcHeader({
  title,
  onSettings,
  onHelp,
}: {
  title: string;
  onSettings?: () => void;
  onHelp?: () => void;
}) {
  return (
    <header className="fc-header safe-top flex shrink-0 items-center justify-between gap-2 px-2 pb-2 pt-1">
      <div className="flex w-14 items-center gap-1.5 text-white/90">
        <button type="button" className="text-sm font-bold" aria-label="Help" onClick={onHelp}>
          ?
        </button>
        <span className="text-sm" aria-hidden>
          ✓
        </span>
      </div>
      <h1 className="min-w-0 flex-1 truncate text-center font-display text-xl font-bold tracking-wide text-white uppercase">
        {title}
      </h1>
      <div className="flex w-14 items-center justify-end gap-1.5 text-white/90">
        <span className="text-sm" aria-hidden>
          ⌕
        </span>
        <button type="button" className="text-sm" aria-label="Settings" onClick={onSettings}>
          ⚙
        </button>
      </div>
    </header>
  );
}

export function FcCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`fc-card rounded-xl p-3 shadow-md ${className}`}>{children}</section>;
}

export function FcFooter({
  buttons,
}: {
  buttons: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }[];
}) {
  return (
    <nav className="fc-footer grid" style={{ gridTemplateColumns: `repeat(${buttons.length}, 1fr)` }}>
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          disabled={b.disabled}
          onClick={b.onClick}
          className={`press min-h-12 border-r border-black/25 px-1 text-center font-display text-sm font-bold tracking-wide text-white uppercase last:border-r-0 disabled:opacity-40 ${b.primary ? "bg-[var(--color-fc-lime)] text-black" : ""}`}
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
          ? "bg-[var(--color-fc-lime-soft)] text-black"
          : "bg-white text-black";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press flex min-h-[4.25rem] flex-col items-center justify-center rounded-xl px-2 py-2 shadow-sm ${bg} ${wide ? "col-span-2" : ""}`}
    >
      <div className="font-display text-[0.65rem] font-bold tracking-wider uppercase opacity-80">{label}</div>
      {children ?? <div className="font-display text-2xl font-bold leading-none tabular-nums">{value}</div>}
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
      ? "bg-[var(--color-fc-lime)] text-black"
      : kind === "white"
        ? "bg-white text-black shadow"
        : kind === "red"
          ? "bg-[#a50e0e] text-white"
          : "bg-[var(--color-fc-forest)] text-white";
  return (
    <button
      {...props}
      className={`press inline-flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-center font-display text-sm font-bold uppercase disabled:opacity-40 ${look} ${className}`}
    />
  );
}

export function FcSelectRow({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press w-full rounded-md border border-black/10 px-3 py-2.5 text-left text-sm ${selected ? "bg-[var(--color-fc-lime)] font-bold text-black" : "bg-white text-black"}`}
    >
      {children}
    </button>
  );
}

export function HappyBar({ pct, label }: { pct: number; label: string }) {
  const n = Math.round(Math.max(0, Math.min(100, pct)) / 10);
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={"h-5 flex-1 rounded-sm " + (i < n ? "bg-[#3E7D32]" : "bg-[#a50e0e]")}
            aria-hidden
          />
        ))}
      </div>
      <div className="w-16 text-right">
        <div className="font-display text-lg font-bold text-[#3E7D32] tabular-nums">{Math.round(pct)}%</div>
        <div className="text-[0.65rem] leading-tight text-black/60">{label}</div>
      </div>
    </div>
  );
}

export function FormDots({ form }: { form: string }) {
  const chars = form.padEnd(10, "·").slice(0, 10).split("");
  return (
    <div className="flex justify-center gap-1.5 py-2">
      {chars.map((c, i) => {
        const tone = c === "W" ? "bg-[#3E7D32]" : c === "D" ? "bg-[#c9a227]" : c === "L" ? "bg-[#a50e0e]" : "bg-white/25";
        return (
          <span
            key={i}
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.55rem] font-bold text-white ${tone}`}
          >
            {c === "·" ? "" : c}
          </span>
        );
      })}
    </div>
  );
}

export function PitchMark() {
  return (
    <div className="mx-auto my-2 h-24 w-40 rounded-md border-2 border-white/70 bg-[#2d6b3a] shadow-inner" aria-hidden>
      <div className="relative h-full w-full">
        <div className="absolute inset-x-[18%] top-1/2 h-px -translate-y-1/2 bg-white/80" />
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" />
        <div className="absolute inset-y-[22%] left-0 w-[14%] border border-white/80" />
        <div className="absolute inset-y-[22%] right-0 w-[14%] border border-white/80" />
      </div>
    </div>
  );
}

export function MoneyBag({ n, className = "" }: { n: number; className?: string }) {
  const neg = n < 0;
  return <span className={`tabular-nums ${neg ? "text-[#a50e0e]" : "text-[#3E7D32]"} ${className}`}>{formatMoney(n)}</span>;
}

export function formatMoney(n: number) {
  const sign = n < 0 ? "-" : "";
  const v = Math.abs(Math.round(n));
  if (v >= 1_000_000) return `${sign}£${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}m`;
  if (v >= 10_000) return `${sign}£${Math.round(v / 1000)}k`;
  return `${sign}£${v.toLocaleString("en-GB")}`;
}

export function posTone(pos: string) {
  if (pos === "GK") return "bg-[#3E7D32] text-white";
  if (pos === "CB" || pos === "LB" || pos === "RB" || pos === "CDM") return "bg-[#2C4464] text-white";
  if (pos === "CM" || pos === "CAM") return "bg-[#a50e0e] text-white";
  return "bg-[#c97a1a] text-white";
}
