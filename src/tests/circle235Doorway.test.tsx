import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NextCouncilCard from "@/components/council/NextCouncilCard";

afterEach(() => vi.useRealTimers());

describe("confirmed Circle 235 public doorway", () => {
  it("shows the verified invitation and external destinations before the Fire", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-05T12:00:00Z"));
    render(<NextCouncilCard onJoinCouncil={vi.fn()} />);
    expect(screen.getByText("Circle 235 · yOur Blooming Week")).toBeInTheDocument();
    expect(screen.getByText("Tuesday 6 October 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Join the Fire" })).toHaveAttribute("href", "https://meet.google.com/zkp-tuue-ima");
    expect(screen.getByRole("link", { name: "Explore Circle 235 in TETOL" })).toHaveAttribute("href", "https://claude.ai/artifact/HUV71pN5eQSLyVJyrKmQPK");
    expect(screen.queryByText(/4th May/)).not.toBeInTheDocument();
  });

  it("stops advertising a next gathering at its scheduled end without claiming a harvest", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T20:30:00+01:00"));
    render(<NextCouncilCard onJoinCouncil={vi.fn()} />);
    expect(screen.getByText("Most recently announced gathering")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Join the Fire" })).not.toBeInTheDocument();
    expect(screen.getByText(/next gathering is to be confirmed/)).toBeInTheDocument();
  });
});
