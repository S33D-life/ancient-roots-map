import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import ParchmentHeader from "@/components/parchment/ParchmentHeader";
import { TeotagMarginNote } from "@/components/parchment/ParchmentGround";
vi.mock("@/components/ThemeToggle", () => ({ default: () => null }));
vi.mock("@/components/rhythm/MoonGlyph", () => ({ default: () => null }));
function review(path: string) { return render(<MemoryRouter initialEntries={[path]}><ParchmentHeader signedIn={false} onSearch={vi.fn()} onGuide={vi.fn()} /></MemoryRouter>); }
describe("review-only ink", () => {
  it("requires an explicit request and clears it on unmount", () => {
    const view=review("/library?ink=racing");
    expect(document.documentElement.dataset.inkReview).toBe("racing");
    view.unmount();expect(document.documentElement).not.toHaveAttribute("data-ink-review");
  });
  it("does not activate or persist an experiment during ordinary entry", () => {
    review("/library");expect(document.documentElement).not.toHaveAttribute("data-ink-review");
  });
  it("marks the signature without making the quotation a purple UI accent", () => {
    const view=render(<TeotagMarginNote>A tree remembers.</TeotagMarginNote>);
    expect(view.container.querySelector('.teotag-signature')).toHaveTextContent("TEOTAG, in the margin");
    expect(view.container.querySelector('p')).not.toHaveClass('teotag-signature');
  });
});
