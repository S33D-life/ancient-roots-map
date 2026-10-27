import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ from: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle: vi.fn(), toast: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: db.from } }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: db.toast }) }));
vi.mock("@/hooks/use-map-focus", () => ({ useMapFocus: () => ({ focusMap: vi.fn() }) }));
import VerificationPipeline from "@/components/VerificationPipeline";
import ImmutableTreeCard from "@/components/ImmutableTreeCard";

const tree = {
  id: "fixture-research-tree", tree_name: "Fixture Oak", species_scientific: "Quercus robur",
  species_common: "Oak", locality_text: "Fixture location", latitude: 51, longitude: 0,
  description: "A sufficiently detailed research description.", geo_precision: "approx",
  record_status: "research" as const, verification_score: 0,
};

beforeEach(() => {
  vi.resetAllMocks();
  window.scrollTo = vi.fn();
  const query = { update: db.update, eq: db.eq, select: db.select, maybeSingle: db.maybeSingle };
  db.from.mockReturnValue(query);
  db.update.mockReturnValue(query);
  db.eq.mockReturnValue(query);
  db.select.mockReturnValue(query);
  db.maybeSingle.mockResolvedValue({ data: { id: tree.id }, error: null });
});
afterEach(cleanup);

describe("research review without simulated anchoring", () => {
  it.each(["research", "under_review", "verified", "immutable", "rejected"] as const)(
    "never offers anchoring or writes when displaying %s", (record_status) => {
      const onStatusChange = vi.fn();
      const { container } = render(<VerificationPipeline tree={{ ...tree, record_status }} onStatusChange={onStatusChange} />);
      expect(screen.queryByRole("button", { name: /anchor|permanence|immutability/i })).not.toBeInTheDocument();
      expect(container).not.toHaveTextContent(/permanently archived|recorded forever|ready for permanence|passed verification/i);
      expect(db.from).not.toHaveBeenCalled();
      expect(onStatusChange).not.toHaveBeenCalled();
    },
  );

  it("submits complete preliminary details for review, without manufacturing verification or anchor evidence", async () => {
    const onStatusChange = vi.fn();
    render(<VerificationPipeline tree={tree} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole("button", { name: /prepare for review/i }));
    expect(screen.getByText(/media and duplicate checks require curator review/i)).toBeInTheDocument();
    expect(screen.queryByText("Duplicate Check Passed")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith("under_review"));
    expect(db.from).toHaveBeenCalledWith("research_trees");
    expect(db.update).toHaveBeenCalledExactlyOnceWith({ record_status: "under_review" });
    expect(db.eq).toHaveBeenCalledWith("id", tree.id);
    expect(db.eq).toHaveBeenCalledWith("record_status", "research");
    expect(db.select).toHaveBeenCalledWith("id");
    expect(db.toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Submitted for review" }));
  });

  it("keeps incomplete research from being submitted", () => {
    render(<VerificationPipeline tree={{ ...tree, latitude: null }} />);
    fireEvent.click(screen.getByRole("button", { name: /prepare for review/i }));
    expect(screen.getByRole("button", { name: /submit for review/i })).toBeDisabled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it.each([
    { data: null, error: { message: "Permission denied" } },
    { data: null, error: null },
  ])("does not claim success for a failed or zero-row review update: %j", async (result) => {
    db.maybeSingle.mockResolvedValue(result);
    const onStatusChange = vi.fn();
    render(<VerificationPipeline tree={tree} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole("button", { name: /prepare for review/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));
    await waitFor(() => expect(db.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })));
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(db.toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Submitted for review" }));
  });

  it("retains research status when the review request rejects", async () => {
    db.maybeSingle.mockRejectedValue(new Error("Network unavailable"));
    const onStatusChange = vi.fn();
    render(<VerificationPipeline tree={tree} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole("button", { name: /prepare for review/i }));
    fireEvent.click(screen.getByRole("button", { name: /submit for review/i }));
    await waitFor(() => expect(db.toast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })));
    expect(onStatusChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /submit for review/i })).toBeEnabled();
  });

  it("preserves legacy metadata and provenance without certifying an anchor", () => {
    render(<MemoryRouter><ImmutableTreeCard tree={{
      ...tree, province: null, height_m: null, girth_or_stem: null, crown_spread: null,
      immutable_record_id: "IMM-LEGACY", immutable_anchor_reference: "0xlegacy",
      metadata_hash: "QmLegacyMetadata", anchored_at: "2026-01-01T00:00:00Z", verified_by: null,
      source_doc_title: "Fixture source", source_doc_url: "https://example.com/source", source_doc_year: 2026,
    }} /></MemoryRouter>);
    expect(screen.getByText("IMM-LEGACY")).toBeInTheDocument();
    expect(screen.getByText(/QmLegacyMetadata/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /fixture source/i })).toHaveAttribute("href", "https://example.com/source");
    expect(screen.getByText(/anchor proof has not been verified by this interface/i)).toBeInTheDocument();
    expect(screen.queryByText(/recorded in the eternal grove/i)).not.toBeInTheDocument();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("contains no frontend anchor generator or immutable mutation, and no minted claim for stored status", () => {
    const source = readFileSync("src/components/VerificationPipeline.tsx", "utf8");
    expect(source).not.toMatch(/Math\.random|mockAnchor|mockMetadata|handleAnchor|immutable_anchor_reference:|metadata_hash:|anchored_at:|record_status:\s*["']immutable["']/);
    expect(readFileSync("src/pages/CountryPortalPage.tsx", "utf8")).not.toContain("begin the pipeline");
    expect(readFileSync("src/components/LeafletFallbackMap.tsx", "utf8")).not.toContain("Minted Sigils");
    expect(readFileSync("src/components/LeafletFallbackMap.tsx", "utf8")).not.toContain("Recorded in the Eternal Grove");
  });
});
