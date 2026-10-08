import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EmbeddedCouncilDeck from "@/components/council/EmbeddedCouncilDeck";

function frame() {
  const onReturn = vi.fn();
  render(<EmbeddedCouncilDeck src="about:blank" onReturn={onReturn} />);
  const iframe = screen.getByTitle("TETOL Council of Life spatial deck") as HTMLIFrameElement;
  fireEvent.load(iframe);
  return { doc: iframe.contentDocument!, onReturn, iframe };
}
function returnLink(doc: Document, href: string) {
  const link = doc.createElement("a");
  link.id = "council-return";
  link.href = href;
  link.textContent = "Return to Council of Life";
  doc.body.appendChild(link);
  return link;
}
describe("embedded spatial return", () => {
  it("catches the dynamically created same-origin return instead of nesting the app", () => {
    const { doc, onReturn } = frame();
    const link = returnLink(doc, `${window.location.origin}/council-of-life?from=spatial-council#next-gathering`);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(onReturn).toHaveBeenCalledOnce();
  });
  it("leaves external destinations and modified navigation alone", () => {
    const { doc, onReturn } = frame();
    const external = returnLink(doc, "https://outside.invalid/council-of-life?from=spatial-council");
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    external.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    external.remove();
    const internal = returnLink(doc, `${window.location.origin}/council-of-life?from=spatial-council`);
    internal.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true }));
    expect(onReturn).not.toHaveBeenCalled();
  });
});
