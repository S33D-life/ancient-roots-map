import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RootsDiscovery from "@/components/tree-sections/RootsDiscovery";
import { recordedPhoto, readRootsPresence } from "@/components/tree-sections/roots-presence";

const mocks = vi.hoisted(() => ({ from: vi.fn(), reads: [] as object[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));
const id = "2cbf9c57-a9d5-4149-9dcb-7cdd805f2c5d";
const photo = "https://mwzcuczfedrjplndggiv.supabase.co/storage/v1/object/public/offerings/photo.jpeg";
beforeEach(() => {
  mocks.reads = [{ data: [{ id, name: "Olive", species: "Olive", photo_thumb_url: photo }], error: null }, { count: 789, error: null }];
  mocks.from.mockReset().mockImplementation(() => {
    const result = mocks.reads.shift();
    const query = { select: vi.fn(), is: vi.fn(), not: vi.fn(), order: vi.fn(), limit: vi.fn() };
    query.select.mockReturnValue(query); query.is.mockImplementation(() => result && "count" in result ? Promise.resolve(result) : query);
    query.not.mockReturnValue(query); query.order.mockReturnValue(query); query.limit.mockResolvedValue(result);
    return query;
  });
});
function mount() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><MemoryRouter><RootsDiscovery /></MemoryRouter></QueryClientProvider>);
}
describe("Roots exterior discovery", () => {
  it("makes no presence reads before discovery and keeps Enter separate", async () => {
    mount();
    expect(mocks.from).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Enter the Roots →" })).toHaveAttribute("href", "/map");
    fireEvent.click(screen.getByRole("button", { name: "Look closer at the Roots" }));
    expect(await screen.findByRole("link", { name: "Meet Olive" })).toHaveAttribute("href", `/tree/${id}`);
    expect(screen.getByText("789 Ancient Friends recorded in the shared atlas.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open the World Atlas →" })).toHaveAttribute("href", "/atlas");
    expect(screen.getByRole("link", { name: "Follow a species Hive →" })).toHaveAttribute("href", "/hives");
    expect(screen.getByRole("link", { name: "Look for Whispers on the Map →" })).toHaveAttribute("href", "/map");
    expect(screen.getByRole("link", { name: "Find a Friend to offer with →" })).toHaveAttribute("href", "/map");
    expect(mocks.from).toHaveBeenCalledTimes(2);
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    fireEvent.click(screen.getAllByRole("button", { name: /Return to the wider Tree/ })[1]);
    await waitFor(() => expect(screen.getByRole("button", { name: "Look closer at the Roots" })).toHaveFocus());
    expect(screen.queryByRole("link", { name: "Meet Olive" })).not.toBeInTheDocument();
    scroll.mockRestore();
  });
  it("does not invent a Friend or zero census on read errors", async () => {
    mocks.reads = [{ data: null, error: { message: "unavailable" } }, { count: null, error: { message: "unavailable" } }];
    expect(await readRootsPresence()).toEqual({ friend: null, count: null });
  });
  it("rejects external photos and malformed record IDs", async () => {
    expect(recordedPhoto("https://example.com/photo.jpg")).toBeNull();
    expect(recordedPhoto("javascript:alert(1)")).toBeNull();
    expect(recordedPhoto(photo)).toBe(photo);
    mocks.reads[0] = { data: [{ id: "../escape", name: "Olive", photo_thumb_url: photo }], error: null };
    expect((await readRootsPresence()).friend).toBeNull();
  });
  it("offers truthful emptiness when no photograph exists", async () => {
    mocks.reads = [{ data: [], error: null }, { count: 0, error: null }];
    mount(); fireEvent.click(screen.getByRole("button", { name: "Look closer at the Roots" }));
    expect(await screen.findByText("No photographed Friend to reveal here just now.")).toBeVisible();
    expect(screen.queryByText(/recorded in the shared atlas/)).not.toBeInTheDocument();
  });
});
