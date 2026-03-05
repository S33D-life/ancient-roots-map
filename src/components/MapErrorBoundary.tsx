import { Component, type ErrorInfo, type ReactNode } from "react";

interface MapErrorBoundaryProps {
  children: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = {
    hasError: false,
    message: null,
  };

  static getDerivedStateFromError(error: Error): MapErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || "Unexpected map failure",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[MapErrorBoundary] Map render failure", { error, info });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="absolute inset-0 z-[30] flex items-center justify-center bg-background/95 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-amber-400/40 bg-black/70 p-5 text-amber-100 shadow-2xl backdrop-blur-md">
          <p className="font-serif text-lg">Map paused safely</p>
          <p className="mt-2 text-sm text-amber-100/85">
            A map rendering error was caught. The page stayed responsive and you can keep navigating.
          </p>
          {this.state.message && (
            <p className="mt-2 rounded-md bg-black/40 px-2 py-1 text-xs text-amber-200/90">{this.state.message}</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-md border border-amber-300/50 bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-100"
            >
              Retry Map
            </button>
            <a
              href="/atlas"
              className="rounded-md border border-amber-300/40 px-3 py-1.5 text-xs font-semibold text-amber-100/90"
            >
              Return to Atlas
            </a>
          </div>
        </div>
      </div>
    );
  }
}

export default MapErrorBoundary;

