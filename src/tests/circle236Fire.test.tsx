import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Circle236Fire from "@/components/council/Circle236Fire";
afterEach(cleanup);
describe("Circle 236 invitation doorway", () => {
  it("shows the confirmed UK gathering without exposing or inventing a meeting URL", () => {
    render(<Circle236Fire />);
    expect(screen.getByText("Tuesday 13 October · 19:30 UK")).toHaveAttribute("datetime", "2026-10-13T19:30:00+01:00");
    expect(screen.getByRole("link", { name: "Fire times are shared in the Council group →" })).toHaveAttribute("href", "https://t.me/s33dlife");
    expect(screen.queryByRole("link", { name: /Google Meet/ })).not.toBeInTheDocument();
  });
});
