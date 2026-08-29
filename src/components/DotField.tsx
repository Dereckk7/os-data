/**
 * DotField — champ de points réactif (canvas).
 * Bulge au survol, glow suivant le curseur, sparkle optionnel, vague
 * ambiante. Static en reduced-motion ; densité réduite sur mobile.
 * Couleurs fournies par l'app (thème) — jamais imposées ici.
 */
import { memo, useEffect, useRef } from "react";
import "./DotField.css";

const TWO_PI = Math.PI * 2;

export interface DotFieldProps {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  cursorForce?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  opacity?: number;
  staticMode?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Dot { ax: number; ay: number; sx: number; sy: number; vx: number; vy: number; x: number; y: number; }

const DotField = memo(function DotField({
  dotRadius = 1.2,
  dotSpacing = 22,
  cursorRadius = 340,
  cursorForce = 0.1,
  bulgeOnly = true,
  bulgeStrength = 44,
  glowRadius = 140,
  sparkle = false,
  waveAmplitude = 0,
  gradientFrom = "rgba(244,241,232,0.14)",
  gradientTo = "rgba(201,178,124,0.04)",
  glowColor = "rgba(201,178,124,0.08)",
  opacity = 1,
  staticMode = false,
  className = "",
  style,
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<SVGCircleElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);
  const rebuildRef = useRef<(() => void) | null>(null);
  const drawOnceRef = useRef<(() => void) | null>(null);
  const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

  const propsRef = useRef({ dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo });
  propsRef.current = { dotRadius, dotSpacing, cursorRadius, cursorForce, bulgeOnly, bulgeStrength, sparkle, waveAmplitude, gradientFrom, gradientTo };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const maybeCtx = canvas.getContext("2d", { alpha: true });
    if (!maybeCtx) return;
    const ctx: CanvasRenderingContext2D = maybeCtx;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.25 : 1.75);
    let resizeTimer = 0;

    function buildDots(w: number, h: number) {
      const p = propsRef.current;
      const mul = coarse ? 1.45 : 1;
      const step = (p.dotRadius + p.dotSpacing) * mul;
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots = new Array<Dot>(rows * cols);
      let idx = 0;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay };
        }
      }
      dotsRef.current = dots;
    }

    function doResize() {
      if (!canvas || !ctx) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h, offsetX: 0, offsetY: 0 };
      buildDots(w, h);
      if (staticMode) drawOnceRef.current?.();
    }

    function resize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(doResize, 120);
    }

    function onMouseMove(e: MouseEvent) {
      const s = sizeRef.current;
      mouseRef.current.x = e.clientX - s.offsetX;
      mouseRef.current.y = e.clientY - s.offsetY;
    }

    function updateMouseSpeed() {
      const m = mouseRef.current;
      const dx = m.prevX - m.x;
      const dy = m.prevY - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    }

    let frameCount = 0;
    let paused = false;
    let gradCache: CanvasGradient | null = null;
    let gradKey = "";

    function tick() {
      if (paused) return;
      rafRef.current = requestAnimationFrame(tick);
      frameCount++;
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const p = propsRef.current;
      const len = dots.length;
      const t = frameCount * 0.02;
      if (w === 0 || len === 0) return;

      const targetEngagement = coarse ? 0 : Math.min(m.speed / 5, 1);
      engagement.current += (targetEngagement - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const eng = engagement.current;

      glowOpacity.current += (eng - glowOpacity.current) * 0.08;
      const glowEl = glowRef.current;
      if (glowEl) {
        glowEl.setAttribute("cx", String(m.x));
        glowEl.setAttribute("cy", String(m.y));
        glowEl.style.opacity = String(glowOpacity.current);
      }

      ctx.clearRect(0, 0, w, h);

      const key = `${w}x${h}|${p.gradientFrom}|${p.gradientTo}`;
      if (!gradCache || gradKey !== key) {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, p.gradientFrom);
        grad.addColorStop(1, p.gradientTo);
        gradCache = grad;
        gradKey = key;
      }
      ctx.fillStyle = gradCache;

      const cr = coarse ? 0 : p.cursorRadius;
      const crSq = cr * cr;
      const rad = p.dotRadius / 2;
      const isBulge = p.bulgeOnly;

      ctx.beginPath();
      for (let i = 0; i < len; i++) {
        const d = dots[i];
        const dx = m.x - d.ax;
        const dy = m.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (cr > 0 && distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          if (isBulge) {
            const k = 1 - dist / cr;
            const push = k * k * p.bulgeStrength * eng;
            const angle = Math.atan2(dy, dx);
            d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
            d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
          } else {
            const angle = Math.atan2(dy, dx);
            const move = (500 / (dist || 1)) * (m.speed * p.cursorForce);
            d.vx += Math.cos(angle) * -move;
            d.vy += Math.sin(angle) * -move;
          }
        } else if (isBulge) {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        if (!isBulge) {
          d.vx *= 0.9;
          d.vy *= 0.9;
          d.x = d.ax + d.vx;
          d.y = d.ay + d.vy;
          d.sx += (d.x - d.sx) * 0.1;
          d.sy += (d.y - d.sy) * 0.1;
        }

        let drawX = d.sx;
        let drawY = d.sy;
        if (p.waveAmplitude > 0) {
          drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude;
          drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5;
        }

        if (p.sparkle) {
          const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0;
          if (hash % 100 < 3) {
            ctx.moveTo(drawX + rad * 1.8, drawY);
            ctx.arc(drawX, drawY, rad * 1.8, 0, TWO_PI);
          } else {
            ctx.moveTo(drawX + rad, drawY);
            ctx.arc(drawX, drawY, rad, 0, TWO_PI);
          }
        } else {
          ctx.moveTo(drawX + rad, drawY);
          ctx.arc(drawX, drawY, rad, 0, TWO_PI);
        }
      }
      ctx.fill();
    }

    drawOnceRef.current = () => {
      const dots = dotsRef.current;
      for (let i = 0; i < dots.length; i++) { dots[i].sx = dots[i].ax; dots[i].sy = dots[i].ay; }
      const { w, h } = sizeRef.current;
      if (!ctx || w === 0) return;
      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, propsRef.current.gradientFrom);
      grad.addColorStop(1, propsRef.current.gradientTo);
      ctx.fillStyle = grad;
      const rad = propsRef.current.dotRadius / 2;
      ctx.beginPath();
      for (let i = 0; i < dots.length; i++) {
        ctx.moveTo(dots[i].sx + rad, dots[i].sy);
        ctx.arc(dots[i].sx, dots[i].sy, rad, 0, TWO_PI);
      }
      ctx.fill();
    };

    doResize();
    window.addEventListener("resize", resize);

    let speedInterval = 0;
    if (staticMode) {
      drawOnceRef.current();
    } else {
      speedInterval = window.setInterval(updateMouseSpeed, 20);
      if (!coarse) window.addEventListener("mousemove", onMouseMove, { passive: true });
      rafRef.current = requestAnimationFrame(tick);
    }

    /* Perf (RÈGLE 5) : on met la boucle d'animation en pause quand l'onglet
       est caché, et on la relance au retour. */
    const onVisibility = () => {
      if (staticMode) return;
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(rafRef.current);
      } else if (paused) {
        paused = false;
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    rebuildRef.current = () => {
      const { w, h } = sizeRef.current;
      if (w > 0 && h > 0) buildDots(w, h);
    };

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.clearInterval(speedInterval);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode]);

  useEffect(() => {
    rebuildRef.current?.();
  }, [dotRadius, dotSpacing]);

  return (
    <div className={`dot-field-container ${className}`} style={{ opacity, ...style }} aria-hidden="true">
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {!staticMode && (
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
          <defs>
            <radialGradient id={glowIdRef.current}>
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            ref={glowRef}
            cx="-9999" cy="-9999" r={Number.isFinite(glowRadius) ? glowRadius : 140}
            fill={`url(#${glowIdRef.current})`}
            style={{ opacity: 0, willChange: "opacity" }}
          />
        </svg>
      )}
    </div>
  );
});

export default DotField;
