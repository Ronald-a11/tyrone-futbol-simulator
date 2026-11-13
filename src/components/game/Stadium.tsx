import { STANDS, STAND_IDS } from "@/game/data";
import type { StandId, Stands } from "@/game/types";

const VB_W = 720;
const VB_H = 480;

const BOX = {
  north: { x: 160, y: 28, w: 400, h: 96 },
  south: { x: 160, y: 356, w: 400, h: 96 },
  west: { x: 28, y: 132, w: 124, h: 216 },
  east: { x: 568, y: 132, w: 124, h: 216 },
} as const;

type Outer = "n" | "s" | "e" | "w";

function built(tier: number, x: number, y: number, w: number, h: number, outer: Outer) {
  const fill = [0.38, 0.56, 0.72, 0.88, 1][tier] ?? 0.38;
  if (outer === "n") {
    const bh = h * fill;
    return { x, y: y + h - bh, w, h: bh };
  }
  if (outer === "s") return { x, y, w, h: h * fill };
  if (outer === "w") {
    const bw = w * fill;
    return { x: x + w - bw, y, w: bw, h };
  }
  return { x, y, w: w * fill, h };
}

function SeatBlock({
  x,
  y,
  w,
  h,
  cols,
  rows,
  fill,
  sparse,
  awayCols,
  boxCols,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  fill: string;
  sparse?: boolean;
  awayCols?: number;
  boxCols?: number;
}) {
  if (w < 4 || h < 4 || cols < 1 || rows < 1) return null;
  const gapX = w / cols;
  const gapY = h / rows;
  const pad = 0.22;
  const nodes = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sparse && (r + c) % 2 === 1) continue;
      const away = !!awayCols && c >= cols - awayCols;
      const box = !!boxCols && c < boxCols;
      nodes.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * gapX + gapX * pad}
          y={y + r * gapY + gapY * pad}
          width={Math.max(0.8, gapX * (1 - pad * 2))}
          height={Math.max(0.8, gapY * (1 - pad * 2))}
          rx={0.6}
          fill={box ? "var(--color-fg)" : away ? "var(--color-muted)" : fill}
          opacity={sparse ? 0.45 : box ? 0.95 : 0.88}
        />,
      );
    }
  }
  return <g>{nodes}</g>;
}

function deckRows(tier: number) {
  if (tier >= 4) return [3, 3];
  if (tier >= 3) return [2, 2];
  if (tier >= 2) return [3];
  return [tier <= 0 ? 1 : 2];
}

function StandBody({
  id,
  tier,
  seat,
  roof,
  outer,
}: {
  id: StandId;
  tier: number;
  seat: string;
  roof: string;
  outer: Outer;
}) {
  const slot = BOX[id];
  const area = built(tier, slot.x, slot.y, slot.w, slot.h, outer);
  const horizontal = outer === "n" || outer === "s";
  const decks = deckRows(tier);
  const along = horizontal ? area.h : area.w;
  const gap = decks.length > 1 ? along * 0.12 : 0;
  const deckSpan = (along - gap) / decks.length;
  const roofBand = tier >= 1 ? Math.min(12, 4 + tier * 2) : 0;

  const layers = decks.map((rows, i) => {
    const fromPitch = i * (deckSpan + gap);
    let x = area.x;
    let y = area.y;
    let w = area.w;
    let h = area.h;
    if (outer === "n") {
      y = area.y + area.h - fromPitch - deckSpan;
      h = deckSpan;
    } else if (outer === "s") {
      y = area.y + fromPitch;
      h = deckSpan;
    } else if (outer === "w") {
      x = area.x + area.w - fromPitch - deckSpan;
      w = deckSpan;
    } else {
      x = area.x + fromPitch;
      w = deckSpan;
    }
    const outerDeck = i === decks.length - 1;
    return (
      <SeatBlock
        key={i}
        x={x + 3}
        y={y + 3}
        w={Math.max(4, w - 6)}
        h={Math.max(4, h - 6)}
        cols={horizontal ? 18 : Math.max(2, Math.round((w - 6) / 16))}
        rows={horizontal ? rows : 12}
        fill={seat}
        sparse={tier === 0}
        awayCols={id === "south" && tier >= 1 ? 5 : 0}
        boxCols={id === "west" && tier >= 2 && outerDeck ? 1 : 0}
      />
    );
  });

  let roofRect: { x: number; y: number; w: number; h: number } | null = null;
  if (roofBand) {
    if (outer === "n") roofRect = { x: area.x, y: area.y, w: area.w, h: roofBand };
    if (outer === "s") roofRect = { x: area.x, y: area.y + area.h - roofBand, w: area.w, h: roofBand };
    if (outer === "w") roofRect = { x: area.x, y: area.y, w: roofBand, h: area.h };
    if (outer === "e") roofRect = { x: area.x + area.w - roofBand, y: area.y, w: roofBand, h: area.h };
  }

  const gapRect =
    decks.length < 2
      ? null
      : outer === "n"
        ? { x: area.x, y: area.y + area.h - deckSpan - gap, w: area.w, h: gap }
        : outer === "s"
          ? { x: area.x, y: area.y + deckSpan, w: area.w, h: gap }
          : outer === "w"
            ? { x: area.x + area.w - deckSpan - gap, y: area.y, w: gap, h: area.h }
            : { x: area.x + deckSpan, y: area.y, w: gap, h: area.h };

  return (
    <g>
      <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="var(--color-bank)" />
      <rect x={area.x} y={area.y} width={area.w} height={area.h} fill={roof} opacity={0.22} />
      {gapRect ? <rect {...gapRect} fill="var(--color-bg)" opacity={0.75} /> : null}
      {layers}
      {roofRect ? <rect {...roofRect} fill={roof} opacity={0.95} /> : null}
      {id === "north" && tier >= 3 ? (
        <rect x={area.x + area.w / 2 - 46} y={area.y + 2} width={92} height={8} rx={1} fill="var(--color-fg)" opacity={0.85} />
      ) : null}
    </g>
  );
}

function Corner({
  x,
  y,
  w,
  h,
  tier,
  fill,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tier: number;
  fill: string;
}) {
  if (tier < 2) return null;
  const scale = tier >= 4 ? 1 : tier === 3 ? 0.72 : 0.46;
  const cw = w * scale;
  const ch = h * scale;
  const cx = x + (x < 200 ? w - cw : 0);
  const cy = y + (y < 200 ? h - ch : 0);
  return (
    <g>
      <rect x={cx} y={cy} width={cw} height={ch} fill="var(--color-bank)" />
      <rect x={cx} y={cy} width={cw} height={ch} fill={fill} opacity={0.4} />
    </g>
  );
}

function Lights({ heavy }: { heavy: boolean }) {
  const posts: [number, number][] = [
    [18, 14],
    [702, 14],
    [18, 462],
    [702, 462],
  ];
  return (
    <g>
      {posts.map(([x, y]) => {
        const down = y < 240;
        return (
          <g key={`${x}-${y}`}>
            <rect x={x - 1.3} y={down ? y + 4 : y - 12} width={2.6} height={heavy ? 14 : 9} fill="var(--color-muted)" />
            <rect
              x={x - (heavy ? 8 : 5)}
              y={down ? y : y - 3}
              width={heavy ? 16 : 10}
              height={4}
              rx={1}
              fill="var(--color-fg)"
              opacity={heavy ? 0.9 : 0.5}
            />
          </g>
        );
      })}
    </g>
  );
}

export function StadiumPlan({
  stands,
  selected,
  onSelect,
  primary,
  secondary,
}: {
  stands: Stands;
  selected: StandId;
  onSelect: (id: StandId) => void;
  primary: string;
  secondary: string;
}) {
  const sum = STAND_IDS.reduce((n, id) => n + stands[id], 0);
  const ring = BOX[selected];
  return (
    <div className="relative mt-3">
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="h-auto w-full" role="img" aria-label="Stadium plan showing all four stands">
        <rect width={VB_W} height={VB_H} fill="var(--color-bg)" />
        <Corner x={28} y={28} w={124} h={96} tier={Math.min(stands.west, stands.north)} fill={primary} />
        <Corner x={568} y={28} w={124} h={96} tier={Math.min(stands.east, stands.north)} fill={primary} />
        <Corner x={28} y={356} w={124} h={96} tier={Math.min(stands.west, stands.south)} fill={primary} />
        <Corner x={568} y={356} w={124} h={96} tier={Math.min(stands.east, stands.south)} fill={primary} />
        <StandBody id="north" tier={stands.north} seat={secondary} roof={primary} outer="n" />
        <StandBody id="south" tier={stands.south} seat={secondary} roof={primary} outer="s" />
        <StandBody id="west" tier={stands.west} seat={secondary} roof={primary} outer="w" />
        <StandBody id="east" tier={stands.east} seat={secondary} roof={primary} outer="e" />
        <g>
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x={160 + i * 50} y={132} width={50} height={216} fill="var(--color-pitch)" opacity={i % 2 ? 1 : 0.72} />
          ))}
          <rect x={160} y={132} width={400} height={216} fill="none" stroke="var(--color-fg)" strokeOpacity={0.35} strokeWidth={2} />
          <line x1={360} y1={132} x2={360} y2={348} stroke="var(--color-fg)" strokeOpacity={0.35} strokeWidth={2} />
          <circle cx={360} cy={240} r={36} fill="none" stroke="var(--color-fg)" strokeOpacity={0.35} strokeWidth={2} />
          <circle cx={360} cy={240} r={2.4} fill="var(--color-fg)" fillOpacity={0.55} />
          <rect x={160} y={186} width={54} height={108} fill="none" stroke="var(--color-fg)" strokeOpacity={0.35} strokeWidth={2} />
          <rect x={506} y={186} width={54} height={108} fill="none" stroke="var(--color-fg)" strokeOpacity={0.35} strokeWidth={2} />
        </g>
        <Lights heavy={sum >= 8} />
        <rect x={ring.x - 3} y={ring.y - 3} width={ring.w + 6} height={ring.h + 6} fill="none" stroke="var(--color-primary)" strokeWidth={3} />
      </svg>
      {STAND_IDS.map((id) => {
        const b = BOX[id];
        return (
          <button
            key={id}
            type="button"
            aria-pressed={selected === id}
            aria-label={`${STANDS[id].name}, level ${stands[id] + 1} of 5`}
            onClick={() => onSelect(id)}
            style={{
              left: `${(b.x / VB_W) * 100}%`,
              top: `${(b.y / VB_H) * 100}%`,
              width: `${(b.w / VB_W) * 100}%`,
              height: `${(b.h / VB_H) * 100}%`,
            }}
            className="absolute bg-transparent"
          />
        );
      })}
    </div>
  );
}
