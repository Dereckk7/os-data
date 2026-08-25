/**
 * ThemeTogglerButton — bascule de thème animée.
 * Soleil → lune (masque sculpté) → croissant confort → contraste système.
 * API : variant, size, direction, modes.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { Monitor } from 'lucide-react';
import { useId } from 'react';

import { cn } from '../lib/services';
import { type ThemeMode, useTheme } from '../lib/theme';

export type ThemeTogglerButtonProps = {
  variant?: 'ghost' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  direction?: 'clockwise' | 'counterclockwise';
  modes?: ThemeMode[];
  className?: string;
};

const MODE_LABEL: Record<ThemeMode, string> = {
  light: 'clair',
  dark: 'sombre',
  comfort: 'confort',
  system: 'système',
};

const SIZES = {
  sm: 'h-8 w-8 [&_svg]:size-4',
  md: 'h-9 w-9 [&_svg]:size-[18px]',
  lg: 'h-11 w-11 [&_svg]:size-5',
};

const VARIANTS = {
  ghost: 'text-cream/60 hover:bg-white/[0.06] hover:text-cream',
  outline:
    'border border-white/[0.1] bg-white/[0.03] text-cream/70 hover:border-white/[0.2] hover:text-cream',
  solid: 'bg-cream text-ink-950 hover:bg-white',
};

function ThemeGlyph({
  mode,
  direction,
}: {
  mode: ThemeMode;
  direction: 'clockwise' | 'counterclockwise';
}) {
  const maskId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const reduce = useReducedMotion();
  const dur = reduce ? 0 : 0.5;
  const rot = direction === 'clockwise' ? 90 : -90;

  if (mode === 'system') return <Monitor strokeWidth={1.75} />;

  const isDarkish = mode === 'dark' || mode === 'comfort';
  const bite = mode === 'comfort' ? 7 : 9;

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      key={mode}
      initial={reduce ? false : { rotate: -rot, scale: 0.6, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
    >
      <defs>
        <mask id={`tm-${maskId}`}>
          <rect width="24" height="24" fill="white" />
          <motion.circle
            cx="30"
            cy="4"
            r={bite}
            fill="black"
            animate={isDarkish ? { cx: 17, cy: 7 } : { cx: 30, cy: 4 }}
            transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
          />
        </mask>
      </defs>
      <motion.circle
        cx="12"
        cy="12"
        r="5"
        fill="currentColor"
        mask={`url(#tm-${maskId})`}
        animate={isDarkish ? { r: 8 } : { r: 5 }}
        transition={{ duration: dur, ease: [0.22, 1, 0.36, 1] }}
      />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 12 + Math.cos(a) * 8.2;
        const y1 = 12 + Math.sin(a) * 8.2;
        const x2 = 12 + Math.cos(a) * 10.4;
        const y2 = 12 + Math.sin(a) * 10.4;
        return (
          <motion.line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            animate={isDarkish ? { opacity: 0, scale: 0.4 } : { opacity: 1, scale: 1 }}
            transition={{
              duration: dur * 0.7,
              delay: isDarkish ? 0 : 0.15 + i * 0.02,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: '12px 12px' }}
          />
        );
      })}
      {mode === 'comfort' && (
        <>
          <circle cx="19.5" cy="5" r="0.9" fill="currentColor" opacity="0.9" />
          <circle cx="21" cy="8.5" r="0.6" fill="currentColor" opacity="0.7" />
        </>
      )}
    </motion.svg>
  );
}

export function ThemeTogglerButton({
  variant = 'outline',
  size = 'md',
  direction = 'clockwise',
  modes = ['light', 'dark', 'comfort', 'system'],
  className,
}: ThemeTogglerButtonProps) {
  const { mode, setMode } = useTheme();
  const idx = Math.max(0, modes.indexOf(mode));
  const next = modes[(idx + 1) % modes.length];

  return (
    <button
      onClick={() => setMode(next)}
      aria-label={`Thème ${MODE_LABEL[mode]} — changer de thème`}
      title={`Thème ${MODE_LABEL[mode]} — cliquer pour ${MODE_LABEL[next]}`}
      className={cn(
        'grid shrink-0 place-items-center rounded-[10px] transition-all duration-200 active:scale-95',
        SIZES[size],
        VARIANTS[variant],
        className
      )}
    >
      <span key={mode} className="animate-theme-pop inline-flex">
        <ThemeGlyph mode={mode} direction={direction} />
      </span>
    </button>
  );
}
