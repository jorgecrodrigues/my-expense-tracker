import { BrandArtwork } from "@/shared/components/icons/BrandArtwork";

interface LogoProps {
  loading?: boolean;
}

export default function Logo({ loading = false }: LogoProps) {
  return (
    <svg width="120" height="120" viewBox="0 0 512 512">
      <g transform="translate(76 16) scale(0.7)">
        <BrandArtwork pulse={loading} />
      </g>

      {/* Three dots loading animation */}
      {loading && (
        <g>
          <circle cx="206" cy="450" r="16" fill="#10B981">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="256" cy="450" r="16" fill="#10B981">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="306" cy="450" r="16" fill="#10B981">
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="1.5s"
              begin="1s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}
    </svg>
  );
}
