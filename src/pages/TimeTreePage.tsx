import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import TimeTreeGame from "@/components/TimeTreeGame";
import { TreeDeciduous } from "lucide-react";

const TimeTreePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-20">
        <PageShell>
          <div className="max-w-xl mx-auto space-y-6">
            {/* Page title */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <TreeDeciduous className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-serif text-primary">The Time Tree</h1>
              <p className="text-xs text-muted-foreground/60 font-serif max-w-sm mx-auto">
                A lunar ritual of imagined meetings beneath ancient trees
              </p>
            </div>

            <TimeTreeGame />
          </div>
        </PageShell>
      </main>
      <Footer />
    </div>
  );
};

export default TimeTreePage;
