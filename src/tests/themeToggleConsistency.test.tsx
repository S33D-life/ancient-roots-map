import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import ThemeToggle from "@/components/ThemeToggle";
import { applySiteTheme } from "@/hooks/use-parchment-dark";

it("names the same two places from Roots and persists the return to parchment", async () => {
  applySiteTheme(false);
  render(<MemoryRouter initialEntries={["/map"]}><ThemeToggle /></MemoryRouter>);
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Use Night Grove" })));
  expect(document.documentElement).toHaveClass("dark");
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Use Living Parchment" })));
  expect(document.documentElement).toHaveClass("light");
  expect(localStorage.getItem("s33d-theme")).toBe("light");
});
