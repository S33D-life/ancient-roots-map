/**
 * Life Grove voice safety: temporary fail-closed frontend behaviour.
 * Uses fake media components and mocked storage only; no real Supabase requests.
 * This does NOT establish production RLS/storage safety or repair existing media.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import LifeGroveOfferingComposer from "@/components/life-groves/LifeGroveOfferingComposer";

const spies = vi.hoisted(() => ({
  recorderMounted: vi.fn(),
  storageFrom: vi.fn(),
  dbFrom: vi.fn(),
  createOffering: vi.fn(),
  listOfferings: vi.fn(),
  toast: vi.fn(),
  submit: undefined as undefined | (() => Promise<void>),
}));

vi.mock("sonner", () => ({ toast: spies.toast }));

// Keep native disabled-button semantics while allowing the handler guard itself
// to be exercised independently of HTML disabled enforcement.
vi.mock("@/components/ui/button", () => ({
  Button: ({ onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    spies.submit = onClick as unknown as () => Promise<void>;
    return <button {...props} onClick={onClick} />;
  },
}));

vi.mock("@/components/offering-kit", () => ({
  PhotoOfferingPicker: () => null,
  PoemOfferingInput: () => null,
  SongOfferingSearch: () => null,
  BookOfferingSearch: () => null,
  VoiceOfferingRecorder: () => {
    spies.recorderMounted();
    return null;
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    storage: { from: spies.storageFrom },
    from: spies.dbFrom,
  },
}));

vi.mock("@/repositories/life-groves", () => ({
  createOffering: spies.createOffering,
  listOfferings: spies.listOfferings,
}));

beforeEach(() => {
  spies.dbFrom.mockReturnValue({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: { full_name: "Fictional Wanderer" } }),
  }) }) });
  spies.listOfferings.mockResolvedValue([]);
  spies.createOffering.mockResolvedValue({ id: "fictional-offering" });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
  spies.submit = undefined;
});

function openComposer(privacy: "private_family" | "invite_only" | "public") {
  return render(
    <LifeGroveOfferingComposer
      open
      onClose={vi.fn()}
      groveId="fictional-grove"
      groveTitle="A fictional Grove"
      grovePrivacy={privacy}
      contributorUserId="fictional-user"
    />,
  );
}

describe("Life Grove voice fail-closed upload gate", () => {
  it.each(["private_family", "invite_only", "public"] as const)(
    "never mounts the shared public voice uploader for a %s Grove",
    (privacy) => {
      openComposer(privacy);
      fireEvent.click(screen.getByRole("button", { name: /Voice note$/ }));

      expect(screen.getByRole("status")).toHaveTextContent(
        "Voice memories are temporarily unavailable in Life Groves",
      );
      expect(screen.getByRole("button", { name: "Hang voice memory" })).toBeDisabled();
      expect(spies.recorderMounted).not.toHaveBeenCalled();

      // Choosing 'public' must not re-enable a Grove recording.
      for (const name of ["Anyone who wanders past", "Family only", "Anyone who wanders past"]) {
        fireEvent.click(screen.getByRole("button", { name }));
        expect(screen.getByRole("button", { name: "Hang voice memory" })).toBeDisabled();
      }
      fireEvent.click(screen.getByRole("button", { name: "Hang voice memory" }));
      expect(screen.getByRole("button", { name: "Hang voice memory" })).toBeDisabled();
      expect(spies.recorderMounted).not.toHaveBeenCalled();
      expect(spies.storageFrom).not.toHaveBeenCalled();
      expect(spies.createOffering).not.toHaveBeenCalled();
      expect(spies.dbFrom).not.toHaveBeenCalled();
      expect(spies.listOfferings).not.toHaveBeenCalled();
    },
  );

  it("leaves ordinary non-voice memory composing available", () => {
    openComposer("private_family");
    fireEvent.click(screen.getByRole("button", { name: /Story$/ }));
    fireEvent.change(screen.getByPlaceholderText("Tell a memory…"), {
      target: { value: "A fictional story, not personal data." },
    });
    expect(screen.getByRole("button", { name: "Hang memory" })).not.toBeDisabled();
    expect(spies.recorderMounted).not.toHaveBeenCalled();
    expect(spies.storageFrom).not.toHaveBeenCalled();
  });

  it("rejects voice before any request even when the submit handler is invoked directly", async () => {
    openComposer("public");
    fireEvent.click(screen.getByRole("button", { name: /Voice note$/ }));
    expect(spies.submit).toBeTypeOf("function");
    await act(async () => { await spies.submit!(); });
    expect(spies.toast).toHaveBeenCalledWith(expect.stringContaining("No recording will be uploaded"));
    expect(spies.dbFrom).not.toHaveBeenCalled();
    expect(spies.storageFrom).not.toHaveBeenCalled();
    expect(spies.listOfferings).not.toHaveBeenCalled();
    expect(spies.createOffering).not.toHaveBeenCalled();
  });

  it("keeps voice blocked after changing type and reopening the composer", () => {
    const props = {
      open: true, onClose: vi.fn(), groveId: "fictional-grove",
      groveTitle: "A fictional Grove", grovePrivacy: "private_family",
      contributorUserId: "fictional-user",
    };
    const view = render(<LifeGroveOfferingComposer {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Voice note$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Anyone who wanders past" }));
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: /Story$/ }));
    fireEvent.change(screen.getByPlaceholderText("Tell a memory…"), { target: { value: "Fictional memory" } });
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    fireEvent.click(screen.getByRole("button", { name: /Voice note$/ }));
    view.rerender(<LifeGroveOfferingComposer {...props} open={false} />);
    view.rerender(<LifeGroveOfferingComposer {...props} grovePrivacy="public" />);
    expect(screen.getByRole("button", { name: "Hang voice memory" })).toBeDisabled();
    expect(spies.recorderMounted).not.toHaveBeenCalled();
    expect(spies.storageFrom).not.toHaveBeenCalled();
    expect(spies.createOffering).not.toHaveBeenCalled();
  });

  it("still saves a non-voice story through the existing mocked Grove repository", async () => {
    openComposer("private_family");
    fireEvent.click(screen.getByRole("button", { name: /Story$/ }));
    fireEvent.change(screen.getByPlaceholderText("Tell a memory…"), {
      target: { value: "A fictional story, not personal data." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Hang memory" }));
    await waitFor(() => expect(spies.createOffering).toHaveBeenCalledWith(expect.objectContaining({
      life_grove_id: "fictional-grove", offering_type: "story", visibility: "family_only",
      body_text: "A fictional story, not personal data.", media_url: null,
    })));
    expect(spies.recorderMounted).not.toHaveBeenCalled();
    expect(spies.storageFrom).not.toHaveBeenCalled();
  });

});
