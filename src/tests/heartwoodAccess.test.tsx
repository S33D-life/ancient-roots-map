import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HeartwoodAccessGate from "@/components/library/HeartwoodAccessGate";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), authChange: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getUser: mocks.getUser, onAuthStateChange: mocks.authChange }, rpc: mocks.rpc } }));
beforeEach(() => { vi.clearAllMocks(); mocks.authChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }); mocks.getUser.mockResolvedValue({ data: { user: null }, error: null }); });
afterEach(cleanup);
function show(access: "visitor" | "member" | "steward" | "advanced") { render(<MemoryRouter><HeartwoodAccessGate access={access}><div>Protected content</div></HeartwoodAccessGate></MemoryRouter>); }
it("keeps public rooms public without an auth request", () => { show("visitor"); expect(screen.getByText("Protected content")).toBeTruthy(); expect(mocks.getUser).not.toHaveBeenCalled(); });
it("does not mount signed-out protected rooms", async () => { show("member"); await screen.findByRole("link", { name: "Sign in" }); expect(screen.queryByText("Protected content")).toBeNull(); });
it("allows a verified member", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } }); show("member"); await screen.findByText("Protected content"); expect(mocks.rpc).not.toHaveBeenCalled(); });
it("rejects unprivileged signed-in users", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } }); mocks.rpc.mockResolvedValue({ data: false }); show("steward"); await screen.findByText("This room requires a curator or keeper role."); expect(screen.queryByText("Protected content")).toBeNull(); });
it("uses verified existing roles for operational rooms", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } }); mocks.rpc.mockImplementation((_, args) => Promise.resolve({ data: args._role === "keeper" })); show("advanced"); await screen.findByText("Protected content"); expect(mocks.rpc).toHaveBeenCalledWith("has_role", { _user_id: "user", _role: "keeper" }); });
it("fails closed on role errors", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } }); mocks.rpc.mockResolvedValue({ error: new Error("offline") }); show("steward"); await screen.findByText("Access could not be verified. Please try again later."); expect(screen.queryByText("Protected content")).toBeNull(); });
it("unmounts room content after sign-out", async () => { mocks.getUser.mockResolvedValue({ data: { user: { id: "user" } } }); show("member"); await screen.findByText("Protected content"); mocks.getUser.mockResolvedValue({ data: { user: null } }); await act(async () => mocks.authChange.mock.calls[0][0]("SIGNED_OUT")); await waitFor(() => expect(screen.queryByText("Protected content")).toBeNull()); await screen.findByRole("link", { name: "Sign in" }); });
it("treats a missing session as a sign-in threshold", async () => { mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: "AuthSessionMissingError" } }); show("steward"); await screen.findByRole("link", { name: "Sign in" }); expect(screen.queryByText("Protected content")).toBeNull(); });
it("protects every non-public registry level without a preview bypass", async () => { show("advanced"); await screen.findByRole("link", { name: "Sign in" }); expect(screen.queryByText("Protected content")).toBeNull(); });
