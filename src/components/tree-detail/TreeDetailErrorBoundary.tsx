/**
 * TreeDetailErrorBoundary — keeps a single bad render on the tree page
 * from taking down the whole app. Renders a calm, poetic fallback with a
 * Retry action and a route home to the map.
 *
 * Lives next to the page (rather than as a global boundary) so retries
 * remount only the tree subtree and structured logging can be tagged
 * to "tree-detail".
 */
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Map, RefreshCw, TreeDeciduous } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
  /** Bumping this remounts the children, clearing any stuck state. */
  resetKey: number;
}

class TreeDetailErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      message: error?.message?.slice(0, 240) || "Unexpected render failure",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Lightweight, non-blocking log. Useful for triaging future tree-page crashes.
    console.error("[TreeDetailErrorBoundary] Tree page render failed", {
      message: error?.message,
      componentStack: info?.componentStack?.slice(0, 600),
      route: typeof window !== "undefined" ? window.location.pathname : null,
      timestamp: new Date().toISOString(),
    });
  }

  private handleRetry = () => {
    this.setState((prev) => ({
      hasError: false,
      message: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-sm w-full text-center space-y-5 py-10">
            <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
              <TreeDeciduous className="h-6 w-6 text-primary/70" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-lg text-foreground/90">
                The grove paused for breath
              </h2>
              <p className="text-sm text-muted-foreground font-serif italic leading-relaxed">
                Something flickered while opening this tree. The forest is still here —
                try listening again.
              </p>
            </div>
            {this.state.message && (
              <p className="rounded-md bg-muted/40 border border-border/40 px-3 py-2 text-[11px] text-muted-foreground/80 font-mono break-words">
                {this.state.message}
              </p>
            )}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-serif text-primary hover:bg-primary/20 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Listen again
              </button>
              <Link
                to="/map"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-4 py-2 text-xs font-serif text-muted-foreground hover:text-foreground transition-colors"
              >
                <Map className="h-3.5 w-3.5" />
                Return to the Map
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // resetKey forces a clean remount of the subtree on retry.
    return <div key={this.state.resetKey}>{this.props.children}</div>;
  }
}

export default TreeDetailErrorBoundary;
