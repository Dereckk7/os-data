/**
 * Visualisations DATA OS — minimales. Couleurs pilotées par variables
 * CSS (suit Dark / Light / Comfort).
 */
import { useId } from "react";
import { cn } from "../lib/services";

interface SparklineProps {
  ["data"]: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  fill?: boolean;
  className?: string;
}

export function Sparkline({ data, width = 96, height = 30, strokeWidth = 1.5, fill = true, className }: SparklineProps) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");
  // Garde-fou : on ne garde que des nombres finis (des données réelles
  // peuvent contenir NaN/undefined) — aucun attribut SVG ne reçoit NaN.
  const clean = (Array.isArray(data) ? data : []).filter((n): n is number => Number.isFinite(n));
  if (clean.length < 2) return null;
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const pad = 2.5;
  const span = max - min || 1;
  const pts = clean.map((v, i) => {
    const x = pad + (i * (width - pad * 2)) / (clean.length - 1);
    const y = height - pad - ((v - min) / span) * (height - pad * 2);
    return [x, y] as const;
  });
  const last = pts[pts.length - 1];
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${last[0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn("overflow-visible", className)} aria-hidden="true">
      {fill && (
        <>
          <defs>
            <linearGradient id={`sg-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="spark-stop-a" />
              <stop offset="100%" className="spark-stop-b" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#sg-${gid})`} />
        </>
      )}
      <path d={line} fill="none" className="spark-line" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2" className="spark-dot" />
    </svg>
  );
}

interface MiniBarsProps {
  ["data"]: number[];
  height?: number;
  className?: string;
}

export function MiniBars({ data, height = 44, className }: MiniBarsProps) {
  const clean = (Array.isArray(data) ? data : []).filter((n): n is number => Number.isFinite(n));
  const max = Math.max(...clean, 1);
  return (
    <div className={cn("flex items-end gap-[3px]", className)} style={{ height }} aria-hidden="true">
      {clean.map((v, i) => (
        <span
          key={i}
          className={cn("w-full min-w-[3px] flex-1 rounded-[2px] transition-all duration-500", i === clean.length - 1 ? "mini-bar-active" : "mini-bar")}
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
