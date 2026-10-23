import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/council/EmbeddedCouncilDeck", () => ({ default: ({src,onReturn}: {src:string;onReturn:()=>void}) => <button data-src={src} onClick={onReturn}>Deck return</button> }));
import CouncilOfLifePage from "@/pages/CouncilOfLifePage";
describe("selective Canopy promotion", () => {
  beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); window.scrollTo = vi.fn(); });
  it("puts the open Circle 237 first and preserves both historical Circle 236 and Circle 235", async () => {
    render(<MemoryRouter><CouncilOfLifePage /></MemoryRouter>);
    expect(screen.getByRole("link", {name:/Enter Circle 237 · meet its companions/})).toHaveAttribute("href","/council/237");
    expect(screen.getByRole("region",{name:"Current Circle"})).toContainElement(screen.getByRole("heading", {name:"Circle 237"}));
    expect(screen.getByRole("region",{name:"Previous Circle 236"})).toContainElement(screen.getByRole("heading", {name:"Circle 236"}));
    const doorway=screen.getByRole("button",{name:"Enter the Circle →"});
    fireEvent.click(screen.getByRole("button",{name:"Fly Agaric"}));
    fireEvent.click(screen.getByRole("button",{name:"Follow this companion in the Circle →"}));
    expect(screen.getByRole("button",{name:"Deck return"})).toHaveAttribute("data-src",expect.stringContaining("#c235_flyagaric"));
    fireEvent.click(screen.getByRole("button",{name:"Deck return"}));
    await waitFor(()=>expect(doorway).toHaveFocus());
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ block: "start", behavior: "instant" });
    const scrollMock = vi.mocked(Element.prototype.scrollIntoView);
    expect(scrollMock.mock.contexts.at(-1)).toBe(screen.getByRole("region", { name: "Previous Circle 235" }));
    expect(document.getElementById("next-gathering")).toContainElement(screen.getByRole("heading", { name: "Circle 237" }));
    expect(screen.queryByRole("button",{name:"Deck return"})).not.toBeInTheDocument();
    expect(screen.getByRole("link",{name:"Descend to Heartwood Hall →"})).toHaveAttribute("href","/library");
  });
  it("presents 235 historically without rewriting its question or companions", () => {
    render(<MemoryRouter><CouncilOfLifePage /></MemoryRouter>);
    const previous = screen.getByRole("region", { name: "Previous Circle 235" });
    expect(previous).toHaveTextContent("Previous Circle · last week");
    expect(previous).toHaveTextContent("Circle 235 companions");
    expect(previous).toHaveTextContent("What is already blooming in us that we haven’t noticed yet?");
    expect(previous).toHaveTextContent("Fulham Palace Holm Oak");
    expect(previous).not.toHaveTextContent("This week’s companions");
    expect(previous).not.toHaveTextContent("The Circle is open now");
  });
  it("does not import global theme or held-realm CSS",()=>{
    const css=readFileSync("src/components/parchment/parchment.css","utf8");
    expect(css).not.toMatch(/html\[|html\.|s33d-living|parchment-heartwood|parchment-hall|tetol-parchment/);
    const page=readFileSync("src/pages/CouncilOfLifePage.tsx","utf8");
    expect(page).not.toContain("useLivingParchment");
    expect(page).not.toContain("ParchmentHeader");
  });
});
