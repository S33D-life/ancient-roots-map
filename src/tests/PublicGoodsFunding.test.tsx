import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import PublicGoodsFunding from "@/components/economy/PublicGoodsFunding";

afterEach(cleanup);

describe("public-good funding references", () => {
  it("keeps the existing S33D Giveth project without claiming verified eligibility", () => {
    render(<MemoryRouter><PublicGoodsFunding /></MemoryRouter>);
    const project = screen.getByRole("link", { name: /giveth/i });
    expect(project).toHaveAttribute("href", "https://giveth.io/project/s33dlife");
    expect(within(project).getByText("Listed project")).toBeInTheDocument();
    expect(project).not.toHaveTextContent(/verified|givbacks|active/i);
    expect(project).toHaveTextContent("no guaranteed matching or donor rewards");
  });

  it("separates donations from rewards and avoids implying a grant round is open", () => {
    const { container } = render(<MemoryRouter><PublicGoodsFunding /></MemoryRouter>);
    expect(container).toHaveTextContent("Donations do not buy Hearts, tokens, access or voting influence.");
    expect(container).not.toHaveTextContent("distributed as Hearts");
    const grants = screen.getByRole("link", { name: /gitcoin/i });
    expect(grants).toHaveTextContent("Check eligibility");
    expect(grants).not.toHaveTextContent(/Climate Solutions Round|Upcoming/i);
  });
});
