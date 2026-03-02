/**
 * GlobalErrorBoundary — top-level crash guard.
 * Shows a calm fallback instead of white-screening the app,
 * with a link to report the issue via Council Spark.
 */
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      const log = {
        message: error.message,
        stack: error.stack?.slice(0, 800),
        componentStack: info.componentStack?.slice(0, 500),
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };
      const existing = JSON.parse(sessionStorage.getItem("s33d-crash-log") || "[]");
      existing.push(log);
      sessionStorage.setItem("s33d-crash-log", JSON.stringify(existing.slice(-20)));
    } catch {
      // Never let logging crash
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "hsl(30, 15%, 8%)",
            color: "hsl(42, 60%, 70%)",
            fontFamily: "'Cinzel', serif",
            textAlign: "center",
            gap: "1.5rem",
          }}
        >
          <span style={{ fontSize: "3rem", opacity: 0.6 }}>🌿</span>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            Something flickered in the grove
          </h1>
          <p
            style={{
              fontSize: "0.85rem",
              color: "hsl(30, 20%, 55%)",
              maxWidth: "28rem",
              lineHeight: 1.6,
              margin: 0,
              fontFamily: "sans-serif",
            }}
          >
            An unexpected error occurred. Your data is safe — try refreshing, or
            report this spark so we can mend it.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "0.5rem",
                background: "hsl(42, 80%, 50%)",
                color: "hsl(30, 20%, 10%)",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontSize: "0.8rem",
                fontWeight: 700,
              }}
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: "0.6rem 1.5rem",
                borderRadius: "0.5rem",
                background: "transparent",
                color: "hsl(42, 60%, 60%)",
                border: "1px solid hsl(42, 40%, 30%)",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                fontSize: "0.8rem",
              }}
            >
              Reload page
            </button>
          </div>
          {this.state.error && (
            <details
              style={{
                marginTop: "1rem",
                fontSize: "0.7rem",
                color: "hsl(30, 15%, 45%)",
                maxWidth: "36rem",
                textAlign: "left",
                fontFamily: "monospace",
              }}
            >
              <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>
                Technical details
              </summary>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default GlobalErrorBoundary;
