import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  tabName?: string;
}

interface State {
  hasError: boolean;
}

/**
 * TabErrorBoundary — catches render crashes inside a tab panel
 * so that one broken tab cannot crash the entire page.
 */
class TabErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[TabErrorBoundary] ${this.props.tabName ?? "Tab"} crashed`, { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="w-8 h-8 text-muted-foreground/50" />
          <p className="text-sm font-serif text-muted-foreground">
            This section couldn't load.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs font-serif text-primary hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default TabErrorBoundary;
