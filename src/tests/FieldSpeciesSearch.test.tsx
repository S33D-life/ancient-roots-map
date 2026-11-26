import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import FieldSpeciesSearch from "@/components/encounter/FieldSpeciesSearch";
import SpeciesIdentifier from "@/components/encounter/SpeciesIdentifier";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc } }));
const chestnut = { species_id: "existing-id", species_key: "gbif-7930013", scientific_name: "Quercus castaneifolia C.A.Mey.",
  canonical_common_name: "Oak", family: "Fagaceae", matched_name: "Chestnut-leaved Oak", match_kind: "scientific_prefix" };
function mount(onSelect = vi.fn()) {
  function Harness() {
    const [value, setValue] = useState("");
    return <FieldSpeciesSearch value={value} onChange={setValue} onSelect={onSelect} />;
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>);
  return onSelect;
}
beforeEach(() => { rpc.mockImplementation(() => ({ abortSignal: () => Promise.resolve({ data: [], error: null }) })); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("field mapping search interaction", () => {
  it("debounces catalogue reads, resolves a documented common name via scientific search, and selects only explicitly", async () => {
    rpc.mockImplementation((_name, args) => ({ abortSignal: () => Promise.resolve({ data: args.query.startsWith("Quercus") ? [chestnut] : [], error: null }) }));
    const onSelect = mount();
    const input = screen.getByRole("combobox");
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "Chestnut-leaved Oak" } });
    expect(screen.getByRole("option")).toHaveTextContent("Local suggestion");
    expect(rpc).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("option")).not.toHaveTextContent("Local suggestion"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith("search_species_multilingual", { query: "Quercus castaneifolia", max_results: 20 });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ speciesKey: "gbif-7930013" }));
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).toHaveFocus();
  });
  it("keeps ambiguous options, allows Escape, and never chooses on typing or blur", async () => {
    const onSelect = mount();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Oak" } });
    expect(screen.getAllByRole("option").length).toBeGreaterThan(1);
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");
    fireEvent.blur(input);
    expect(onSelect).not.toHaveBeenCalled();
  });
  it("retains immediate local/manual entry during failure and does not retry", async () => {
    rpc.mockImplementation(() => ({ abortSignal: () => Promise.resolve({ data: null, error: new Error("Offline") }) }));
    mount();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Wollemi Pine" } });
    expect(screen.getByRole("option")).toHaveTextContent("Wollemia nobilis");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Catalogue unavailable"));
    expect(rpc).toHaveBeenCalledTimes(2);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "My unknown tree" } });
    expect(screen.getByRole("combobox")).toHaveValue("My unknown tree");
  });
  it("ignores late responses to an old query", async () => {
    let resolveOld: (value: unknown) => void;
    rpc.mockImplementation((_name, args) => ({ abortSignal: () => args.query === "Quercus" ? new Promise(resolve => { resolveOld = resolve; }) : Promise.resolve({ data: [], error: null }) }));
    mount();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Quercus" } });
    await waitFor(() => expect(rpc).toHaveBeenCalled());
    fireEvent.change(input, { target: { value: "Wollemi Pine" } });
    resolveOld!({ data: [chestnut], error: null });
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.getByRole("option")).toHaveTextContent("Wollemia nobilis");
  });
  it("cancels an obsolete request after rapid typing settles on the new query", async () => {
    const signals: AbortSignal[] = [];
    rpc.mockImplementation(() => ({ abortSignal: (signal: AbortSignal) => {
      signals.push(signal);
      return new Promise(resolve => signal.addEventListener("abort", () => resolve({ data: null, error: new Error("Aborted") })));
    } }));
    mount();
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Quercus" } });
    await waitFor(() => expect(signals).toHaveLength(1));
    fireEvent.change(input, { target: { value: "W" } });
    fireEvent.change(input, { target: { value: "Wollemi" } });
    fireEvent.change(input, { target: { value: "Wollemi Pine" } });
    await waitFor(() => expect(signals[0].aborted).toBe(true));
    expect(rpc.mock.calls.slice(1).map(call => call[1].query)).toEqual(["Wollemi Pine", "Wollemia nobilis"]);
  });
  it("bounds stalled connections without disabling local suggestions", async () => {
    rpc.mockImplementation(() => ({ abortSignal: (signal: AbortSignal) => new Promise(resolve => signal.addEventListener("abort", () => resolve({ data: null, error: new Error("Timed out") }))) }));
    mount();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Cork Oak" } });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Catalogue unavailable"), { timeout: 4500 });
    expect(screen.getByRole("option")).toHaveTextContent("Quercus suber");
  });
  it("records family/genus-only and unknown without assigning a species", () => {
    const change = vi.fn();
    render(<SpeciesIdentifier species="" onSpeciesChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "I know only the family or genus" }));
    fireEvent.change(screen.getByLabelText("Genus name"), { target: { value: "Quercus" } });
    fireEvent.click(screen.getByRole("button", { name: "Use this broad identification" }));
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ identificationRank: "genus", canonicalSpeciesKey: null, species: "Quercus (genus; species unconfirmed)" }));
    fireEvent.change(screen.getByLabelText("What do you know?"), { target: { value: "family" } });
    fireEvent.change(screen.getByLabelText("Family name"), { target: { value: "Fagaceae" } });
    fireEvent.click(screen.getByRole("button", { name: "Use this broad identification" }));
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ identificationRank: "family", canonicalSpeciesKey: null }));
    fireEvent.click(screen.getByRole("button", { name: "Back to identification choices" }));
    fireEvent.click(screen.getByRole("button", { name: /continue without species/ }));
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ species: "Unknown species", certainty: "uncertain" }));
  });
});
