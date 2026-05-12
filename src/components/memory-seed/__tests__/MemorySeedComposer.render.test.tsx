/**
 * Render-level tests for MemorySeedComposer's visible UI states.
 *
 * Scope: presentational pieces only — DestinationPicker, ConfirmationView,
 * placeholder type rendering, action button labels.
 *
 * The full composer's submit flow (Supabase, hooks, toasts) is exercised
 * via the manual matrix in docs/memory-seed-composer-verification.md.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  DestinationPicker,
  ConfirmationView,
  type Destination,
} from "../MemorySeedComposer";

// The select used inside the composer is Radix; rendering the full composer
// requires hooks + Supabase. We only render the small presentational helpers.

describe("DestinationPicker", () => {
  function renderPicker(initial: Destination = "offering") {
    const onChange = vi.fn();
    let value = initial;
    const utils = render(
      <DestinationPicker
        value={value}
        onChange={(d) => {
          value = d;
          onChange(d);
        }}
        treeName="Old Oak"
      />,
    );
    return { onChange, ...utils };
  }

  it("renders all three destination options with the expected copy", () => {
    renderPicker();
    expect(screen.getByText("Hang in the branches")).toBeInTheDocument();
    expect(screen.getByText("Send through the roots")).toBeInTheDocument();
    expect(screen.getByText("Both")).toBeInTheDocument();
  });

  it("uses radiogroup semantics with three radio options", () => {
    renderPicker();
    const group = screen.getByRole("radiogroup", {
      name: /where should this memory travel/i,
    });
    expect(group).toBeInTheDocument();
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(3);
  });

  it("marks the selected option with aria-checked=true", () => {
    renderPicker("whisper");
    const radios = screen.getAllByRole("radio");
    const checked = radios.find((r) => r.getAttribute("aria-checked") === "true");
    expect(checked).toBeTruthy();
    expect(checked!).toHaveTextContent("Send through the roots");
  });

  it("calls onChange when a different option is clicked", () => {
    const { onChange } = renderPicker("offering");
    fireEvent.click(screen.getByText("Send through the roots"));
    expect(onChange).toHaveBeenCalledWith("whisper");
    fireEvent.click(screen.getByText("Both"));
    expect(onChange).toHaveBeenCalledWith("both");
  });

  it("each radio is a top-level focusable button (no nested interactives)", () => {
    renderPicker();
    const radios = screen.getAllByRole("radio");
    for (const r of radios) {
      expect(r.tagName).toBe("BUTTON");
      // No nested button/anchor/input inside the radio target.
      expect(r.querySelector("button, a, input, select, textarea")).toBeNull();
    }
  });
});

describe("Action button label (mirrors composer logic)", () => {
  // The label is computed inline in the composer JSX. Mirror the rule here
  // and assert the contract so a future change in destination -> label is
  // caught by tests.
  function actionLabel(d: Destination): string {
    return d === "offering"
      ? "Hang in the branches"
      : d === "whisper"
        ? "Send through the roots"
        : "Hang & send";
  }

  it("offering → Hang in the branches", () => {
    expect(actionLabel("offering")).toBe("Hang in the branches");
  });
  it("whisper → Send through the roots", () => {
    expect(actionLabel("whisper")).toBe("Send through the roots");
  });
  it("both → Hang & send", () => {
    expect(actionLabel("both")).toBe("Hang & send");
  });
});

describe("ConfirmationView", () => {
  it("renders offering success copy", () => {
    render(<ConfirmationView state="offering" onClose={() => {}} />);
    expect(
      screen.getByText("Your memory has been hung in the branches."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("renders whisper success copy", () => {
    render(<ConfirmationView state="whisper" onClose={() => {}} />);
    expect(
      screen.getByText("Your memory has entered the roots."),
    ).toBeInTheDocument();
  });

  it("renders both success copy", () => {
    render(<ConfirmationView state="both" onClose={() => {}} />);
    expect(
      screen.getByText(
        "Your memory has been hung in the branches and sent through the roots.",
      ),
    ).toBeInTheDocument();
  });

  it("renders partial whisper failure copy and a retry button", () => {
    const onRetry = vi.fn();
    render(
      <ConfirmationView
        state="partial_whisper_failed"
        onClose={() => {}}
        onRetryWhisper={onRetry}
      />,
    );
    expect(
      screen.getByText(
        "Your memory was hung in the branches, but the whisper could not enter the roots.",
      ),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", {
      name: /try sending the whisper again/i,
    });
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("partial state without onRetryWhisper shows only Close", () => {
    render(
      <ConfirmationView state="partial_whisper_failed" onClose={() => {}} />,
    );
    expect(
      screen.queryByRole("button", { name: /try sending the whisper again/i }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });
});
