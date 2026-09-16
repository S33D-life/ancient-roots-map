import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SignatureMark } from "@/components/life-groves/RootSignaturePad";

describe("Ancestral Root handwritten marks", () => {
  it("renders normalized strokes with an accessible spoken inscription", () => {
    render(
      <SignatureMark
        label="Handwritten mark: MAITHE"
        strokes={[[{ x: 0.1, y: 0.2 }, { x: 0.9, y: 0.8 }]]}
      />,
    );

    const mark = screen.getByRole("img", { name: "Handwritten mark: MAITHE" });
    expect(mark).toHaveAttribute("viewBox", "0 0 320 140");
    expect(mark.querySelector("polyline")).toHaveAttribute("points", "32,28 288,112");
  });

  it("renders nothing when a Root has no handwritten mark", () => {
    const { container } = render(<SignatureMark label="Handwritten mark: MAITHE" strokes={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});