import { Icon, type IconProps } from "@chakra-ui/react";
import { BrandArtwork } from "./BrandArtwork";

export function BrandIcon(props: IconProps) {
  return (
    <Icon asChild aria-hidden {...props}>
      <svg viewBox="0 0 512 512" className="brand-icon">
        <BrandArtwork entrance />
      </svg>
    </Icon>
  );
}
