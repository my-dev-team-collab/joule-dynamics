import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-card border border-destructive/20 rounded-lg text-center">
          <AlertCircle className="size-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-foreground">System Error</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">
            {this.props.fallbackMessage || "This component failed to load due to an internal error."}
          </p>
          <div className="mt-4 p-2 bg-destructive/10 text-destructive text-xs font-mono rounded max-w-full overflow-hidden text-ellipsis">
            {this.state.error?.message}
          </div>
          <button
            onClick={this.handleReset}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-md transition-colors shadow-sm"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
