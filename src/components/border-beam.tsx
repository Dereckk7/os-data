/**
 * BorderBeamPanel — une comète lumineuse orbite la bordure du panneau.
 * Lente au repos (premium posé), légère accélération au survol.
 * GPU-friendly (transform/opacity uniquement), coupée en reduced-motion.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { prefersReducedMotion } from "../lib/theme";

interface BorderBeamPanelProps {
  beams?: number;
  colors?: string[];
  idleSpeed?: number;
  hoverSpeed?: number;
  glow?: boolean;
  radius?: number;
  thickness?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function BorderBeamPanel({
  beams = 1,
  colors = ["#D4AF37"],
  idleSpeed = 25,
  hoverSpeed = 150,
  glow = true,
  radius = 16,
  thickness = 1.5,
  className = "",
  style,
  children,
}: BorderBeamPanelProps) {
  const [hovering, setHovering] = useState(false);
  const [reduced, setReduced] = useState(false);
  const beamRefs = useRef<(HTMLDivElement | null)[]>([]);
  const speedRef = useRef(idleSpeed);
  const posRef = useRef<number[]>([]);

  useEffect(() => {
    setReduced(prefersReducedMotion());
  }, []);

  /* Boucle unique : la vitesse interpolée pilote toutes les comètes. */
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      const target = hovering ? hoverSpeed : idleSpeed;
      speedRef.current += (target - speedRef.current) * 0.08;
      beamRefs.current.forEach((el, i) => {
        if (!el) return;
        posRef.current[i] = ((posRef.current[i] ?? -i * (360 / beams)) + (speedRef.current * dt) / 1000) % 360;
        el.style.setProperty("--beam-angle", `${posRef.current[i]}deg`);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [beams, hoverSpeed, idleSpeed, hovering, reduced]);

  const beamStyle = (i: number): CSSProperties => {
    const color = colors[i % colors.length];
    const base: CSSProperties = {
      position: "absolute",
      inset: 0,
      borderRadius: radius,
      padding: thickness,
      pointerEvents: "none",
      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      background: `conic-gradient(from var(--beam-angle, ${-i * (360 / beams)}deg), transparent 0deg, transparent ${300 - i * 20}deg, ${color} ${345 - i * 10}deg, transparent 360deg)`,
    };
    if (glow) base.filter = `drop-shadow(0 0 6px ${color}66)`;
    return base;
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius: radius, ...style }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {!reduced &&
        Array.from({ length: beams }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { beamRefs.current[i] = el; }}
            style={beamStyle(i)}
            aria-hidden="true"
          />
        ))}
      {reduced && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, borderRadius: radius, padding: thickness, pointerEvents: "none",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor", maskComposite: "exclude",
            background: `conic-gradient(from 210deg, transparent 0deg, transparent 250deg, ${colors[0]}88 300deg, transparent 360deg)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
