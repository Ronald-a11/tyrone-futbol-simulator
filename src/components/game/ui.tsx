import type { ButtonHTMLAttributes, ReactNode } from "react";
import { inkFor } from "@/game/util";

export function Btn({
  kind = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: "primary" | "ghost" | "quiet" }) {
  const look =
    kind === "primary"
      ? "bg-primary text-bg"
      : kind === "quiet"
        ? "border border-line bg-surface text-fg"
        : "border border-line bg-transparent text-fg";
  return (
    <button
      {...props}
      className={`press inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-center text-sm font-medium transition duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${look} ${className}`}
    />
  );
}

export function Crest({
  primary,
  secondary,
  short,
  size = 48,
}: {
  primary: string;
  secondary: string;
  short: string;
  size?: number;
}) {
  const ink = inkFor(primary);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0 drop-shadow-sm">
      <path d="M32 3 L58 14 V34 C58 50 32 61 32 61 C32 61 6 50 6 34 V14 Z" fill={primary} />
      <path d="M32 8 L52 16.5 V34 C52 46 32 55 32 55 C32 55 12 46 12 34 V16.5 Z" fill="none" stroke={secondary} strokeWidth="2" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Barlow Condensed, sans-serif"
        fontSize="18"
        fontWeight="700"
        fill={ink}
      >
        {short.slice(0, 3)}
      </text>
    </svg>
  );
}

export function Bar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
      <div className="bar-fill h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

export function Kicker({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "primary" }) {
  return (
    <div className={`text-xs font-medium tracking-widest uppercase ${tone === "primary" ? "text-primary" : "text-muted"}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium tracking-widest text-muted uppercase">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full rounded-lg border border-line bg-bg px-3 text-fg outline-none focus:border-primary"
      />
    </label>
  );
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex rounded-xl bg-bg p-1">
      {options.map((option) => {
        const on = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`press min-h-11 flex-1 rounded-lg px-2 text-sm capitalize ${on ? "bg-primary text-bg" : "text-muted"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
