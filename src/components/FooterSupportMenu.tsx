import { Heart, ExternalLink, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const FooterSupportMenu = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleGivethClick = () => {
    setSheetOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirmContinue = () => {
    setConfirmOpen(false);
    window.open("https://giveth.io/project/s33dlife", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <button
        onClick={() => setSheetOpen(true)}
        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
      >
        <Heart className="w-3 h-3" />
        Support
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[50vh]">
          <SheetHeader className="pb-2">
            <SheetTitle className="font-serif text-base">Support</SheetTitle>
            <SheetDescription className="text-xs">
              Help, bug reporting, or donate.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 py-2">
            {/* Internal support */}
            <Link
              to="/support"
              onClick={() => setSheetOpen(false)}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card no-underline"
            >
              <HelpCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Support on S33D</p>
                <p className="text-xs text-muted-foreground">Help, FAQs, bug reporting, contact</p>
              </div>
            </Link>

            {/* External Giveth */}
            <button
              onClick={handleGivethClick}
              className="w-full flex items-start gap-3 p-3 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card text-left"
            >
              <Heart className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Support via Giveth</p>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground/70">
                  Opens Giveth (external) — you'll leave s33d.life
                </p>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* External link confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Leaving S33D</AlertDialogTitle>
            <AlertDialogDescription>
              This link opens Giveth in a new tab. You'll leave s33d.life.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmContinue}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FooterSupportMenu;
