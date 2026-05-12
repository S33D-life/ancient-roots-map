/**
 * Submit-flow tests for MemorySeedComposer.
 *
 * Covers offering / whisper / both / partial-failure event behaviour by
 * mocking Supabase, sendWhisper, useCurrentUser, useTreeResonance, sonner,
 * and listening for window CustomEvents.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

// ── Mocks ──────────────────────────────────────────────────────────────

const insertSingle = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => insertSingle(),
        }),
      }),
    }),
  },
}));

const sendWhisperMock = vi.fn();
vi.mock("@/hooks/use-whispers", () => ({
  sendWhisper: (...args: unknown[]) => sendWhisperMock(...args),
}));

vi.mock("@/hooks/use-current-user", () => ({
  useCurrentUser: () => ({ userId: "user-1", isLoading: false }),
}));

vi.mock("@/hooks/use-tree-resonance", () => ({
  useTreeResonance: () => ({
    distanceMeters: null,
    nearOfferingRange: true,
    visitedBefore: false,
    staffResonance: null,
    lifeGroveLink: false,
  }),
}));

const toastError = vi.fn();
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...a: unknown[]) => toastError(...a),
    success: (...a: unknown[]) => toastSuccess(...a),
  },
}));

// Import after mocks.
import MemorySeedComposer from "../MemorySeedComposer";

// ── Helpers ────────────────────────────────────────────────────────────

function setup() {
  const onOpenChange = vi.fn();
  const utils = render(
    <MemorySeedComposer
      open={true}
      onOpenChange={onOpenChange}
      treeId="tree-1"
      treeName="Old Oak"
      treeSpecies="Quercus robur"
      treeSpeciesKey="quercus_robur"
    />,
  );
  return { onOpenChange, ...utils };
}

function fillTitleBody(title = "Hello", body = "Body text") {
  fireEvent.change(screen.getByLabelText(/^Title$/i), { target: { value: title } });
  fireEvent.change(screen.getByLabelText(/^Body$/i), { target: { value: body } });
}

function listen(name: string) {
  const fn = vi.fn();
  window.addEventListener(name, fn);
  return { fn, remove: () => window.removeEventListener(name, fn) };
}

function clickAction() {
  // Match all three labels.
  const btn = screen.getByRole("button", {
    name: /Hang in the branches|Send through the roots|Hang & send/,
  });
  fireEvent.click(btn);
}

// ── Tests ──────────────────────────────────────────────────────────────

beforeEach(() => {
  insertSingle.mockReset();
  sendWhisperMock.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("MemorySeedComposer submit flow", () => {
  it("1. offering only — inserts once, fires offering-created, no whisper-sent, shows confirmation", async () => {
    insertSingle.mockResolvedValue({ data: { id: "off-1" }, error: null });
    const off = listen("offering-created");
    const wsp = listen("whisper-sent");
    setup();
    fillTitleBody();
    clickAction();
    await waitFor(() => {
      expect(screen.getByText(/Your memory has been hung in the branches\./)).toBeInTheDocument();
    });
    expect(insertSingle).toHaveBeenCalledTimes(1);
    expect(sendWhisperMock).not.toHaveBeenCalled();
    expect(off.fn).toHaveBeenCalledTimes(1);
    expect(wsp.fn).not.toHaveBeenCalled();
    off.remove(); wsp.remove();
  });

  it("2. whisper only — sendWhisper once, fires whisper-sent, no offering-created", async () => {
    sendWhisperMock.mockResolvedValue({ data: { id: "w-1" }, error: null });
    const off = listen("offering-created");
    const wsp = listen("whisper-sent");
    setup();
    fireEvent.click(screen.getByText("Send through the roots"));
    fillTitleBody();
    clickAction();
    await waitFor(() => {
      expect(screen.getByText(/Your memory has entered the roots\./)).toBeInTheDocument();
    });
    expect(insertSingle).not.toHaveBeenCalled();
    expect(sendWhisperMock).toHaveBeenCalledTimes(1);
    expect(off.fn).not.toHaveBeenCalled();
    expect(wsp.fn).toHaveBeenCalledTimes(1);
    off.remove(); wsp.remove();
  });

  it("3. both success — one of each insert + send, both events fire once", async () => {
    insertSingle.mockResolvedValue({ data: { id: "off-2" }, error: null });
    sendWhisperMock.mockResolvedValue({ data: { id: "w-2" }, error: null });
    const off = listen("offering-created");
    const wsp = listen("whisper-sent");
    setup();
    fireEvent.click(screen.getByText("Both"));
    fillTitleBody();
    clickAction();
    await waitFor(() => {
      expect(
        screen.getByText(/hung in the branches and sent through the roots/i),
      ).toBeInTheDocument();
    });
    expect(insertSingle).toHaveBeenCalledTimes(1);
    expect(sendWhisperMock).toHaveBeenCalledTimes(1);
    expect(off.fn).toHaveBeenCalledTimes(1);
    expect(wsp.fn).toHaveBeenCalledTimes(1);
    off.remove(); wsp.remove();
  });

  it("4. both, offering fails — whisper not called, no events, error toast", async () => {
    insertSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    const off = listen("offering-created");
    const wsp = listen("whisper-sent");
    setup();
    fireEvent.click(screen.getByText("Both"));
    fillTitleBody();
    clickAction();
    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        expect.stringMatching(/offering could not settle/i),
      );
    });
    expect(sendWhisperMock).not.toHaveBeenCalled();
    expect(off.fn).not.toHaveBeenCalled();
    expect(wsp.fn).not.toHaveBeenCalled();
    // Still on the form, no confirmation.
    expect(screen.queryByText(/has been hung in the branches/i)).toBeNull();
    off.remove(); wsp.remove();
  });

  it("5. both, whisper fails then retry — partial state, retry only sends whisper, no double offering", async () => {
    insertSingle.mockResolvedValue({ data: { id: "off-3" }, error: null });
    sendWhisperMock.mockResolvedValueOnce({ data: null, error: { message: "net" } });
    const off = listen("offering-created");
    const wsp = listen("whisper-sent");
    setup();
    fireEvent.click(screen.getByText("Both"));
    fillTitleBody();
    clickAction();

    await waitFor(() => {
      expect(
        screen.getByText(
          /hung in the branches, but the whisper could not enter the roots/i,
        ),
      ).toBeInTheDocument();
    });
    expect(insertSingle).toHaveBeenCalledTimes(1);
    expect(sendWhisperMock).toHaveBeenCalledTimes(1);
    expect(off.fn).toHaveBeenCalledTimes(1);
    expect(wsp.fn).not.toHaveBeenCalled();

    // Retry — succeed this time.
    sendWhisperMock.mockResolvedValueOnce({ data: { id: "w-3" }, error: null });
    fireEvent.click(
      screen.getByRole("button", { name: /try sending the whisper again/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/hung in the branches and sent through the roots/i),
      ).toBeInTheDocument();
    });
    // Critical: no second offering insert.
    expect(insertSingle).toHaveBeenCalledTimes(1);
    expect(sendWhisperMock).toHaveBeenCalledTimes(2);
    expect(off.fn).toHaveBeenCalledTimes(1);
    expect(wsp.fn).toHaveBeenCalledTimes(1);
    off.remove(); wsp.remove();
  });

  it("6. dialog close + reopen after partial — no stale retry state, fresh offering insert on next submit", async () => {
    insertSingle.mockResolvedValue({ data: { id: "off-4" }, error: null });
    sendWhisperMock.mockResolvedValueOnce({ data: null, error: { message: "net" } });

    const onOpenChange = vi.fn();
    const { rerender } = render(
      <MemorySeedComposer
        open={true}
        onOpenChange={onOpenChange}
        treeId="tree-1"
        treeName="Old Oak"
      />,
    );
    fireEvent.click(screen.getByText("Both"));
    fillTitleBody();
    clickAction();
    await waitFor(() => {
      expect(
        screen.getByText(/whisper could not enter the roots/i),
      ).toBeInTheDocument();
    });
    expect(insertSingle).toHaveBeenCalledTimes(1);

    // Close.
    rerender(
      <MemorySeedComposer
        open={false}
        onOpenChange={onOpenChange}
        treeId="tree-1"
        treeName="Old Oak"
      />,
    );
    // Reopen — reset effect should clear persistedOfferingId + confirmed.
    rerender(
      <MemorySeedComposer
        open={true}
        onOpenChange={onOpenChange}
        treeId="tree-1"
        treeName="Old Oak"
      />,
    );

    // Form is back (no confirmation, no retry button).
    expect(
      screen.queryByRole("button", { name: /try sending the whisper again/i }),
    ).toBeNull();

    // Submit again as offering only — should insert a fresh offering (not be guarded).
    sendWhisperMock.mockResolvedValueOnce({ data: { id: "w-4" }, error: null });
    fillTitleBody("Round 2", "Body 2");
    // Default destination after reset is "offering".
    clickAction();
    await waitFor(() => {
      expect(
        screen.getByText(/Your memory has been hung in the branches\./),
      ).toBeInTheDocument();
    });
    expect(insertSingle).toHaveBeenCalledTimes(2);
  });
});
