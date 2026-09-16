import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ContextBackButtonProps {
  fallback: string;
  label?: string;
  className?: string;
  onBack?: () => void;
}

export default function ContextBackButton({
  fallback,
  label = "Back",
  className,
  onBack,
}: ContextBackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    const historyIndex = window.history.state?.idx;
    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleBack}
      aria-label={label}
      className={`min-h-11 px-3 font-serif text-sm text-muted-foreground hover:text-primary ${className ?? ""}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}