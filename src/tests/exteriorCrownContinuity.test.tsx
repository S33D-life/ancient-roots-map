import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import CrownSection from "@/components/tree-sections/CrownSection";
import { ONE_CIRCLE_MANY_SURFACES as growth, MATURITY_LABEL } from "@/data/crown/growths";

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("IntersectionObserver", class {
    observe() {} unobserve() {} disconnect() {}
  });
});
function Location() { const location = useLocation(); return <output>{JSON.stringify(location.state)}</output>; }
describe("exterior Crown continuity", () => {
  it("names the realm Crown and keeps one truthful, read-only glimpse from the existing record", () => {
    render(<MemoryRouter><CrownSection exterior /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "The Crown" })).toBeInTheDocument();
    expect(screen.getByText("What might the Tree become?")).toBeInTheDocument();
    expect(screen.getByText("Possibilities, not promises.")).toBeInTheDocument();
    expect(screen.getByText(growth.title)).toBeInTheDocument();
    expect(screen.getByText(MATURITY_LABEL[growth.maturity])).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByText("Popular Fruit")).not.toBeInTheDocument();
    expect(document.querySelector(".exterior-crown-world")).toHaveAttribute("aria-hidden", "true");
  });
  it("preserves the Crown destination and exact exterior return origin", () => {
    render(<MemoryRouter><CrownSection exterior /><Location /></MemoryRouter>);
    const enter = screen.getByRole("link", { name: /Enter the Crown/ });
    expect(enter).toHaveAttribute("href", "/golden-dream");
    fireEvent.click(enter);
    expect(screen.getByRole("status")).toHaveTextContent('"from":"/s33d#golden-dream"');
  });
  it("restores keyboard focus at the Crown anchor on history entry without moving the scroll", () => {
    render(<MemoryRouter initialEntries={["/s33d#golden-dream"]}><CrownSection exterior /></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Enter the Crown/ })).toHaveFocus();
  });
  it("leaves the non-exterior legacy composition independent of the study", () => {
    render(<MemoryRouter><CrownSection /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "Our Vision" })).toBeInTheDocument();
    expect(screen.queryByText(growth.title)).not.toBeInTheDocument();
    expect(document.querySelector(".exterior-crown-world")).toBeNull();
  });
});
