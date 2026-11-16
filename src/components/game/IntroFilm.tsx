import { useEffect, useRef, useState } from "react";
import { APP_BRAND } from "@/game/brand";

type Stage = "film" | "welcome";

/** Short opening reel: strike → net → celebrate, then welcome CTA. */
export function IntroFilm({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fadeRef = useRef<HTMLDivElement | null>(null);
  const [stage, setStage] = useState<Stage>("film");

  useEffect(() => {
    if (stage !== "film") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let start = 0;
    let finished = false;
    const DURATION = 5200;

    let viewW = Math.max(320, canvas.clientWidth || window.innerWidth);
    let viewH = Math.max(480, canvas.clientHeight || window.innerHeight);
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      viewW = Math.max(320, canvas.clientWidth || window.innerWidth);
      viewH = Math.max(480, canvas.clientHeight || window.innerHeight);
      canvas.width = Math.floor(viewW * dpr);
      canvas.height = Math.floor(viewH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const drawPlayer = (
      x: number,
      y: number,
      scale: number,
      pose: "run" | "kick" | "celebrate",
      t: number,
      kickPhase: number,
    ) => {
      const s = 14 * scale;
      const kit = "#c6f06c";
      const shorts = "#17324a";
      const skin = "#e8c4a0";
      const stride = pose === "run" ? Math.sin(t * 14) * 0.55 : pose === "celebrate" ? Math.sin(t * 10) * 0.15 : 0.08;

      ctx.save();
      ctx.translate(x, y);
      if (pose === "celebrate") ctx.rotate(Math.sin(t * 8) * 0.08);

      ctx.beginPath();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.ellipse(0, s * 0.95, s * 0.55, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = shorts;
      ctx.lineWidth = 2.6 * scale;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12);
      ctx.lineTo(-s * 0.25 - stride * s * 0.35, s * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.12);
      if (pose === "kick") {
        const swing = -0.4 + kickPhase * 1.8;
        ctx.lineTo(s * (0.12 + Math.cos(swing) * 0.7), s * (0.12 + Math.sin(swing) * 0.7));
      } else {
        ctx.lineTo(s * 0.22 + stride * s * 0.35, s * 0.78);
      }
      ctx.stroke();

      ctx.fillStyle = kit;
      ctx.fillRect(-s * 0.32, -s * 0.35, s * 0.64, s * 0.55);
      ctx.strokeStyle = "#142016";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-s * 0.32, -s * 0.35, s * 0.64, s * 0.55);

      ctx.strokeStyle = kit;
      ctx.lineWidth = 2.3 * scale;
      ctx.beginPath();
      if (pose === "celebrate") {
        ctx.moveTo(-s * 0.25, -s * 0.2);
        ctx.lineTo(-s * 0.4, -s * 0.95);
        ctx.moveTo(s * 0.25, -s * 0.2);
        ctx.lineTo(s * 0.4, -s * 0.95);
      } else {
        ctx.moveTo(-s * 0.3, -s * 0.2);
        ctx.lineTo(-s * 0.55, s * (0.05 + stride * 0.2));
        ctx.moveTo(s * 0.3, -s * 0.2);
        ctx.lineTo(s * 0.5, s * (0.05 - stride * 0.2));
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = skin;
      ctx.arc(0, -s * 0.55, s * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const frame = (now: number) => {
      if (!start) start = now;
      const elapsed = now - start;
      const u = Math.min(1, elapsed / DURATION);
      if (fadeRef.current) fadeRef.current.style.opacity = String(u > 0.88 ? (u - 0.88) / 0.12 : 0);

      const w = viewW;
      const h = viewH;
      const m = Math.min(w, h) * 0.06;

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#0f3d24");
      g.addColorStop(0.55, "#14703a");
      g.addColorStop(1, "#0a2e1a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";
        ctx.fillRect((i * w) / 10, 0, w / 10 + 1, h);
      }

      ctx.fillStyle = "rgba(20,16,12,0.75)";
      ctx.fillRect(0, 0, w, 14);
      ctx.fillRect(0, h - 14, w, 14);

      ctx.strokeStyle = "rgba(245,248,242,0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(m, m, w - m * 2, h - m * 2);
      ctx.beginPath();
      ctx.moveTo(w / 2, m);
      ctx.lineTo(w / 2, h - m);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) * 0.1, 0, Math.PI * 2);
      ctx.stroke();

      const boxW = (w - m * 2) * 0.18;
      const boxH = (h - m * 2) * 0.5;
      ctx.strokeRect(w - m - boxW, h / 2 - boxH / 2, boxW, boxH);

      const netPulse = u > 0.52 && u < 0.72 ? Math.sin(((u - 0.52) / 0.2) * Math.PI) * 12 : 0;
      const gx = w - m;
      const gy = h / 2 - 28;
      ctx.fillStyle = "rgba(15,15,15,0.55)";
      ctx.fillRect(gx - 2, gy, 12, 56);
      ctx.strokeStyle = "#eee";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx - 2, gy, 12, 56);
      ctx.save();
      ctx.beginPath();
      ctx.rect(gx - 2, gy, 12, 56);
      ctx.clip();
      ctx.strokeStyle = "rgba(220,230,220,0.5)";
      ctx.lineWidth = 0.9;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(gx, gy + 6 + i * 8);
        ctx.quadraticCurveTo(gx + 5 + netPulse, gy + 10 + i * 8, gx + 10, gy + 6 + i * 8);
        ctx.stroke();
      }
      ctx.restore();

      const scale = Math.max(0.9, Math.min(1.4, Math.min(w, h) / 360));
      let px: number;
      let py: number;
      let pose: "run" | "kick" | "celebrate" = "run";
      let kickPhase = 0;
      let bx: number;
      let by: number;
      let loft = 0;

      if (u < 0.38) {
        const r = u / 0.38;
        px = m + (w - m * 2) * (0.28 + r * 0.38);
        py = h / 2 + Math.sin(r * Math.PI) * 18;
        bx = px + 18 * scale;
        by = py + 6;
        pose = "run";
      } else if (u < 0.52) {
        const r = (u - 0.38) / 0.14;
        px = m + (w - m * 2) * 0.66;
        py = h / 2;
        kickPhase = r;
        pose = "kick";
        bx = px + 18 * scale;
        by = py + 6;
      } else if (u < 0.7) {
        const r = (u - 0.52) / 0.18;
        const e = r * r * (3 - 2 * r);
        px = m + (w - m * 2) * 0.66;
        py = h / 2;
        pose = "kick";
        kickPhase = 1;
        const fromX = px + 18 * scale;
        const fromY = py + 6;
        const toX = gx + 2;
        const toY = h / 2;
        bx = fromX + (toX - fromX) * e;
        by = fromY + (toY - fromY) * e;
        loft = Math.sin(r * Math.PI) * 42;
      } else {
        const r = (u - 0.7) / 0.3;
        px = m + (w - m * 2) * (0.66 + Math.sin(r * Math.PI * 2) * 0.02);
        py = h / 2 - 4;
        pose = "celebrate";
        bx = gx + 3;
        by = h / 2 + Math.sin(r * 20) * 2;
        loft = 2;
      }

      drawPlayer(px, py, scale, pose, elapsed / 1000, kickPhase);

      ctx.beginPath();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.ellipse(bx, by + 5, 5 * scale, 2 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#f5f5f0";
      ctx.arc(bx, by - loft, 5.2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      if (u > 0.55 && u < 0.85) {
        ctx.font = `700 ${Math.round(22 * scale)}px Barlow Condensed, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.fillText("GOAL!", w / 2 + 1, m + 28 + 1);
        ctx.fillStyle = "#c6f06c";
        ctx.fillText("GOAL!", w / 2, m + 28);
      }

      if (u < 1) raf = requestAnimationFrame(frame);
      else if (!finished) {
        finished = true;
        setStage("welcome");
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [stage]);

  if (stage === "welcome") {
    return (
      <div className="fixed inset-0 z-[80] flex min-h-dvh flex-col items-center justify-center bg-[#0a1610] px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[var(--color-fc-lime)]/20 blur-3xl" />
          <div className="absolute -right-16 bottom-20 h-72 w-72 rounded-full bg-emerald-700/30 blur-3xl" />
        </div>
        <p className="font-display text-sm tracking-[0.35em] text-[var(--color-fc-lime)] uppercase">Welcome to</p>
        <h1 className="mt-3 max-w-md font-display text-4xl leading-[0.92] text-white uppercase sm:text-5xl">
          Tyrone Football Simulator
        </h1>
        <p className="mt-4 max-w-sm text-sm font-semibold text-white/70">
          Own the club. Climb the pyramid. Keep the terrace loud.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="press mt-10 min-h-12 rounded-xl bg-[var(--color-fc-lime)] px-8 py-3.5 font-display text-lg text-black uppercase"
        >
          Get started
        </button>
        <p className="mt-3 text-[0.65rem] tracking-wide text-white/35 uppercase">{APP_BRAND}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div ref={fadeRef} className="pointer-events-none absolute inset-0 bg-[#0a1610] opacity-0" />
      <button
        type="button"
        onClick={() => setStage("welcome")}
        className="absolute right-3 bottom-3 rounded-lg bg-black/45 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur"
      >
        Skip
      </button>
    </div>
  );
}
