import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExteriorHeartwood from "@/components/tree-sections/ExteriorHeartwood";
import { ROOM_BY_KEY } from "@/config/heartwoodRooms";

function Location() { const location = useLocation(); return <output>{JSON.stringify(location.state)}</output>; }
describe("Heartwood exterior room openings", () => {
  it("uses canonical rooms and makes the records access distinction visible without record previews", () => {
    render(<MemoryRouter><ExteriorHeartwood /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Music Room/ })).toHaveAttribute("href", ROOM_BY_KEY["music-room"].route);
    expect(screen.getByRole("link", { name: /Scrolls & Records/ })).toHaveAttribute("href", ROOM_BY_KEY.scrolls.route);
    expect(screen.getByText("Steward access · permissions apply")).toBeVisible();
    expect(screen.getByRole("link", { name: "Enter Heartwood Hall →" })).toHaveAttribute("href", "/library");
    expect(screen.queryByRole("link", { name: /Vault|Dev|Map Room/ })).not.toBeInTheDocument();
  });
  it("carries the exterior origin through room and Hall return context", () => {
    render(<MemoryRouter><ExteriorHeartwood /><Location /></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: /Music Room/ }));
    expect(screen.getByRole("status")).toHaveTextContent('"hallOrigin":"/s33d#heartwood"');
  });
});
