import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CURRENT_CIRCLE, type CurrentCircle } from "../../supabase/functions/_shared/currentCircle";
import CouncilDeckDoorway from "@/components/council/CouncilDeckDoorway";

describe("approved Council Deck doorway", () => {
  it("opens the verified existing Deck while preserving Council context", () => {
    render(<CouncilDeckDoorway />);
    const link = screen.getByRole("link", { name: "Open the Council Deck" });
    expect(link).toHaveAttribute("href", CURRENT_CIRCLE.links.councilDeck.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
  it.each([undefined, { ...CURRENT_CIRCLE.links.councilDeck, approved: false },
    { url: "https://private.invalid/deck", approved: true }])("omits absent/unapproved/unsafe destinations: %j", councilDeck => {
    render(<CouncilDeckDoorway circle={{ ...CURRENT_CIRCLE, links: { ...CURRENT_CIRCLE.links, councilDeck } }} />);
    expect(screen.queryByRole("link", { name: "Open the Council Deck" })).not.toBeInTheDocument();
  });
  it("omits a draft Circle even when its link is approved", () => {
    render(<CouncilDeckDoorway circle={{ ...CURRENT_CIRCLE, approval: "draft" }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

// A different weekly projection must change the UI without editing the card.
vi.mock("@/data/council/circle235Doorway", async () => {
  const { CURRENT_CIRCLE: current } = await import("../../supabase/functions/_shared/currentCircle");
  const circle: CurrentCircle = { ...current, number: 999, weekState: "Gathering", title: "Another Circle",
    companionsLabel: "This week’s companions, chosen together", safetyLabel: "Weekly care", safety: "Meet thoughtfully" };
  return { CIRCLE_235_DOORWAY: { ...circle, tetolUrl: "/existing-tree", groupUrl: current.links.group.url } };
});
import NextCouncilCard from "@/components/council/NextCouncilCard";
it("projects weekly labels, number and state without Circle-235 UI constants", () => {
  render(<NextCouncilCard onJoinCouncil={vi.fn()} />);
  expect(screen.getByText("Gathering")).toBeInTheDocument();
  expect(screen.getByText(/chosen together/)).toBeInTheDocument();
  expect(screen.getByText("Weekly care: Meet thoughtfully")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enter the Circle →" })).toBeInTheDocument();
  expect(screen.queryByText(/Fly Agaric:|chosen by Leo/)).not.toBeInTheDocument();
});
