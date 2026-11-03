// @vitest-environment jsdom
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import AboutPage from "./AboutPage";

afterEach(() => {
  cleanup();
});

function renderAbout() {
  return render(
    <ChakraProvider value={defaultSystem}>
      <AboutPage />
    </ChakraProvider>,
  );
}

describe("AboutPage", () => {
  it("renders the main heading and core sections", () => {
    renderAbout();

    expect(
      screen.getByRole("heading", { name: "About", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What you can do" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Built with" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Why we built it" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Contact" }),
    ).toBeInTheDocument();
  });

  it("lists every main feature of the app", () => {
    renderAbout();

    const items = screen.getAllByRole("listitem");
    expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual([
      "Dashboard",
      "Expenses & bills",
      "Credit card statements",
      "Attachments",
    ]);
  });

  it("renders a mailto contact link", () => {
    renderAbout();

    const links = screen.getAllByRole("link", {
      name: "jorgerodrigues9@outlook.com",
    });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "mailto:jorgerodrigues9@outlook.com");
    }
  });
});
