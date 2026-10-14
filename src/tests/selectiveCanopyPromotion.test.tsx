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
  it("keeps historical Circle 235 separate from current Circle 236 and returns from its existing appearance", async () => {
    render(<MemoryRouter><CouncilOfLifePage /></MemoryRouter>);
    expect(screen.getByRole("link", {name:/Circle 236 · Open/})).toHaveAttribute("href","/review/council/236");
    const doorway=screen.getByRole("button",{name:"Enter the Circle →"});
    fireEvent.click(screen.getByRole("button",{name:"Fly Agaric"}));
    fireEvent.click(screen.getByRole("button",{name:"Follow this companion in the Circle →"}));
    expect(screen.getByRole("button",{name:"Deck return"})).toHaveAttribute("data-src",expect.stringContaining("#c235_flyagaric"));
    fireEvent.click(screen.getByRole("button",{name:"Deck return"}));
    await waitFor(()=>expect(doorway).toHaveFocus());
    expect(screen.queryByRole("button",{name:"Deck return"})).not.toBeInTheDocument();
    expect(screen.getByRole("link",{name:"Descend to Heartwood Hall →"})).toHaveAttribute("href","/library");
  });
  it("does not import global theme or held-realm CSS",()=>{
    const css=readFileSync("src/components/parchment/parchment.css","utf8");
    expect(css).not.toMatch(/html\[|html\.|s33d-living|parchment-heartwood|parchment-hall|tetol-parchment/);
    const page=readFileSync("src/pages/CouncilOfLifePage.tsx","utf8");
    expect(page).not.toContain("useLivingParchment");
    expect(page).not.toContain("ParchmentHeader");
  });
});
