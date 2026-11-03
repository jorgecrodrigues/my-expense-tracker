import { useId } from "react";

interface BrandArtworkProps {
  /** Plays the CSS entrance motion defined under `.brand-icon__*` in `index.css`. */
  entrance?: boolean;
  /** Pulses the wallet clasp (used while the app is loading). */
  pulse?: boolean;
}

/**
 * App tile drawn in a 512×512 coordinate space. Must be rendered inside an
 * `<svg>`; keep in sync with `public/favicon.svg`.
 */
export function BrandArtwork({ entrance = false, pulse = false }: BrandArtworkProps) {
  const gradientId = `brand-bg-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34D399" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#${gradientId})`} />
      <g className={entrance ? "brand-icon__card" : undefined}>
        <rect
          x="136"
          y="118"
          width="232"
          height="128"
          rx="28"
          fill="#FFFFFF"
          fillOpacity="0.4"
          transform="rotate(-10 252 182)"
        />
      </g>
      <g className={entrance ? "brand-icon__wallet" : undefined}>
        <rect x="92" y="172" width="304" height="220" rx="52" fill="#FFFFFF" />
        <rect x="284" y="242" width="140" height="80" rx="40" fill="#0F766E" />
        <circle
          className={entrance ? "brand-icon__clasp" : undefined}
          cx="324"
          cy="282"
          r="16"
          fill="#FFFFFF"
        >
          {pulse && (
            <animate
              attributeName="opacity"
              values="1;0.4;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>
    </>
  );
}
