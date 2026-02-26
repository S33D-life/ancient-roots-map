import { Bug } from "lucide-react";
import BugReportDialog from "@/components/BugReportDialog";

const FloatingBugButton = () => {
  return (
    <div className="fixed bottom-20 right-3 z-[70] md:bottom-4">
      <BugReportDialog
        trigger={
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
            style={{
              background: "hsl(var(--card) / 0.9)",
              border: "1px solid hsl(var(--border) / 0.4)",
              backdropFilter: "blur(12px)",
              color: "hsl(var(--muted-foreground))",
            }}
            title="Report a bug"
          >
            <Bug className="w-4 h-4" />
          </button>
        }
      />
    </div>
  );
};

export default FloatingBugButton;
