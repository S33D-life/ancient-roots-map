/**
 * SparkErrorBoundary — catches crashes in the Spark dialog / FAB flow
 * and renders a calm fallback instead of white-screening the app.
 *
 * SPARK SAFETY CHECKLIST:
 * 1. All Spark UI is wrapped in this boundary
 * 2. JSON.parse calls are wrapped in try/catch
 * 3. Debounce prevents double-tap crashes
 * 4. Auth is checked before Supabase calls
 * 5. Offline state is detected before network calls
 */
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onFallbackAction?: () => void;
  fallbackActionLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class SparkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Non-blocking crash log
    try {
      const log = {
        component: "SparkErrorBoundary",
        message: error.message,
        stack: error.stack?.slice(0, 500),
        componentStack: info.componentStack?.slice(0, 500),
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
        online: navigator.onLine,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      };
      const existing = JSON.parse(sessionStorage.getItem("s33d-spark-crash-log") || "[]");
      existing.push(log);
      sessionStorage.setItem("s33d-spark-crash-log", JSON.stringify(existing.slice(-20)));
    } catch {
      // Never let logging itself crash
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground font-serif">
            {this.props.fallbackMessage || "Something flickered — the spark couldn't ignite this time."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry} className="font-serif">
              Try again
            </Button>
            {this.props.onFallbackAction && (
              <Button variant="default" size="sm" onClick={this.props.onFallbackAction} className="font-serif">
                {this.props.fallbackActionLabel || "Bug Report Lite"}
              </Button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default SparkErrorBoundary;
