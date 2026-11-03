// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

import { BrandIcon } from "./BrandIcon";

afterEach(() => {
  cleanup();
});

function renderIcons(count: number) {
  return render(
    <ChakraProvider value={defaultSystem}>
      {Array.from({ length: count }, (_, i) => (
        <BrandIcon key={i} />
      ))}
    </ChakraProvider>,
  );
}

describe("BrandIcon", () => {
  it("renders a decorative 512×512 svg with entrance motion classes", () => {
    const { container } = renderIcons(1);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 512 512");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("brand-icon");
    expect(container.querySelector(".brand-icon__card")).toBeInTheDocument();
    expect(container.querySelector(".brand-icon__wallet")).toBeInTheDocument();
    expect(container.querySelector(".brand-icon__clasp")).toBeInTheDocument();
  });

  it("gives each instance its own gradient id", () => {
    const { container } = renderIcons(2);
    const ids = Array.from(container.querySelectorAll("linearGradient")).map(
      (g) => g.id,
    );
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
  });
});
