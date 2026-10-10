import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import OutwardJourney, { fieldMapUrl } from "@/components/tree-sections/OutwardJourney";

afterEach(() => { cleanup(); localStorage.clear(); });
const props = { treeId: "tree-a", name: "Existing tree", lat: 0, lng: 0, signedIn: false, offeringUnlocked: false, onMap: vi.fn(), onEncounter: vi.fn(), onOffering: vi.fn() };
const show = (id = "tree-a") => render(<MemoryRouter><OutwardJourney {...props} treeId={id} /></MemoryRouter>);
describe("outward journey truth boundaries", () => {
  it("accepts zero coordinates but rejects missing, invalid and out-of-range locations", () => {
    expect(fieldMapUrl(0, 0)).toContain("mlat=0&mlon=0");
    for (const pair of [[null, 0], [NaN, 0], [91, 0], [0, 181]]) expect(fieldMapUrl(pair[0], pair[1])).toBeNull();
  });
  it("remembers an intention only for the selected tree", () => {
    show(); fireEvent.click(screen.getByRole("button", { name: "Visit this tree" }));
    expect(localStorage.getItem("roots:visit-intention:tree-a")).toBe("intended");
    cleanup(); show("tree-b");
    expect(screen.queryByText(/Your intention is kept/)).toBeNull();
    cleanup(); show(); expect(screen.getByText(/It is not a recorded visit/)).toBeTruthy();
  });
  it("keeps the offering gate and selected-tree return; returning never submits", () => {
    show(); fireEvent.click(screen.getByRole("button", { name: "Visit this tree" }));
    fireEvent.click(screen.getByRole("button", { name: "Returning from a visit?" }));
    expect((screen.getByRole("button", { name: "Offer something to this tree" }) as HTMLButtonElement).disabled).toBe(true);
    expect(props.onEncounter).not.toHaveBeenCalled();
    expect(screen.getByText(/does not automatically establish/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Continue toward Heartwood/ }).getAttribute("href")).toBe("/library");
  });
  it("remains usable when device storage is unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    show(); fireEvent.click(screen.getByRole("button", { name: "Visit this tree" }));
    expect(screen.getByText(/No visit has been recorded/)).toBeTruthy(); spy.mockRestore();
  });
});
