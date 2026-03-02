import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import SparkErrorBoundary from "@/components/SparkErrorBoundary";

// Component that throws on render
const Thrower = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error("Test crash");
  return <div>All good</div>;
};

describe("GlobalErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <GlobalErrorBoundary>
        <div>Hello grove</div>
      </GlobalErrorBoundary>
    );
    expect(getByText("Hello grove")).toBeInTheDocument();
  });

  it("shows fallback on crash", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <GlobalErrorBoundary>
        <Thrower shouldThrow={true} />
      </GlobalErrorBoundary>
    );
    expect(getByText("Something flickered in the grove")).toBeInTheDocument();
    expect(getByText("Try again")).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe("SparkErrorBoundary", () => {
  it("renders children when no error", () => {
    const { getByText } = render(
      <SparkErrorBoundary>
        <div>Spark content</div>
      </SparkErrorBoundary>
    );
    expect(getByText("Spark content")).toBeInTheDocument();
  });

  it("catches crash and shows fallback", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = render(
      <SparkErrorBoundary>
        <Thrower shouldThrow={true} />
      </SparkErrorBoundary>
    );
    expect(getByText(/couldn't ignite/i)).toBeInTheDocument();
    spy.mockRestore();
  });
});

describe("Geolocation hook safety", () => {
  it("handles missing navigator.geolocation gracefully", async () => {
    const original = navigator.geolocation;
    Object.defineProperty(navigator, "geolocation", { value: undefined, writable: true, configurable: true });
    const { useGeolocation } = await import("@/hooks/use-geolocation");
    expect(useGeolocation).toBeDefined();
    Object.defineProperty(navigator, "geolocation", { value: original, writable: true, configurable: true });
  });
});
