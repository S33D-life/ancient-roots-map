import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CrownGrowths from "@/components/crown/CrownGrowths";
import { growthLine } from "@/lib/crown/growthReading";
import { CROWN_GROWTHS, ONE_CIRCLE_MANY_SURFACES as G } from "@/data/crown/growths";
import { ROUTES } from "@/lib/routes";

function FromProbe() {
  const { state } = useLocation();
  return <p data-testid="from">{(state as { from?: string } | null)?.from ?? "none"}</p>;
}

const renderList = (growths = CROWN_GROWTHS) =>
  render(
    <MemoryRouter initialEntries={["/golden-dream"]}>
      <Routes>
        <Route path="/golden-dream" element={<CrownGrowths growths={growths} />} />
        <Route path="/golden-dream/growth/:id" element={<FromProbe />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Golden Dream · what is asking to grow", () => {
  it("renders every growth from the real record, which holds one today", () => {
    renderList();
    expect(screen.getByRole("heading", { name: "What is asking to grow?" })).toBeInTheDocument();
    expect(screen.getByText(/Reading does not decide or approve them\./)).toBeInTheDocument();
    const list = screen.getByRole("list", { name: "Growths in the Crown" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(CROWN_GROWTHS.length);
    expect(CROWN_GROWTHS).toHaveLength(1);
    expect(screen.getByText("1 growth recorded")).toBeInTheDocument();
  });

  it("shows the growth with its glyph, maturity and waiting decision, and links to its Folio", () => {
    renderList();
    const row = screen.getByRole("link", { name: /One Circle · Many Surfaces/ });
    expect(row).toHaveAttribute("href", ROUTES.CROWN_GROWTH(G.id));
    expect(within(row).getByRole("img", { name: "Maturity: Growing" })).toBeInTheDocument();
    expect(row).toHaveTextContent("Growing · touches 4 realms · a decision is waiting");
    expect(row).toHaveTextContent("Open its Folio →");
    expect(row).not.toHaveTextContent(/merged|deployed|verified|approved|gold/i);
  });

  it("passes where you came from so the Folio can return there", () => {
    renderList();
    fireEvent.click(screen.getByRole("link", { name: /One Circle · Many Surfaces/ }));
    expect(screen.getByTestId("from")).toHaveTextContent("/golden-dream");
  });

  it("says nothing is asking to grow when the record is empty", () => {
    renderList([]);
    expect(screen.getByText("Nothing is asking to grow yet.")).toBeInTheDocument();
    expect(screen.getByText("Growths appear here when TEOTAG records them. Nothing is inferred.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("omits the waiting decision when none is recorded", () => {
    expect(growthLine({ ...G, nextDecisions: [] })).toBe("Growing · touches 4 realms");
  });

  it("offers no controls beyond links", () => {
    renderList();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
