import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  listener: undefined as ((event: string, session: { user: { id: string } } | null) => void) | undefined,
  unsubscribe: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: authState.getSession,
      onAuthStateChange: authState.onAuthStateChange,
    },
  },
}));

import { useAuthHydration } from "@/hooks/use-auth-hydration";

const BootHarness = () => {
  const userId = useAuthHydration();
  return (
    <main>
      <h1>Public S33D world</h1>
      <output aria-label="auth state">{userId ?? "public"}</output>
    </main>
  );
};

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("ios-auth-boot-does-not-stall", () => {
  afterEach(() => {
    vi.clearAllMocks();
    authState.listener = undefined;
  });

  const prepareListener = () => {
    authState.onAuthStateChange.mockImplementation((listener) => {
      authState.listener = listener;
      return { data: { subscription: { unsubscribe: authState.unsubscribe } } };
    });
  };

  it("renders the public world when getSession never settles", () => {
    prepareListener();
    authState.getSession.mockReturnValue(new Promise(() => undefined));

    render(<BootHarness />);

    expect(screen.getByRole("heading", { name: "Public S33D world" })).toBeInTheDocument();
    expect(screen.getByLabelText("auth state")).toHaveTextContent("public");
  });

  it("hydrates a valid signed-in session after the public world renders", async () => {
    const restore = deferred<{ data: { session: { user: { id: string } } } }>();
    prepareListener();
    authState.getSession.mockReturnValue(restore.promise);

    render(<BootHarness />);
    expect(screen.getByLabelText("auth state")).toHaveTextContent("public");

    await act(async () => {
      restore.resolve({ data: { session: { user: { id: "wanderer-1" } } } });
      await restore.promise;
    });

    expect(screen.getByLabelText("auth state")).toHaveTextContent("wanderer-1");
  });

  it("continues publicly when session restoration rejects", async () => {
    prepareListener();
    authState.getSession.mockRejectedValue(new Error("storage lock failed"));

    render(<BootHarness />);

    expect(await screen.findByRole("heading", { name: "Public S33D world" })).toBeInTheDocument();
    expect(screen.getByLabelText("auth state")).toHaveTextContent("public");
  });

  it("does not let a stale restore overwrite a newer auth event", async () => {
    const restore = deferred<{ data: { session: { user: { id: string } } } }>();
    prepareListener();
    authState.getSession.mockReturnValue(restore.promise);
    render(<BootHarness />);

    act(() => authState.listener?.("SIGNED_IN", { user: { id: "wanderer-new" } }));
    expect(screen.getByLabelText("auth state")).toHaveTextContent("wanderer-new");

    await act(async () => {
      restore.resolve({ data: { session: { user: { id: "wanderer-stale" } } } });
      await restore.promise;
    });

    expect(screen.getByLabelText("auth state")).toHaveTextContent("wanderer-new");
  });
});