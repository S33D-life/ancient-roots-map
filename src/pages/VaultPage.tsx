import { useEffect, useState } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import DashboardVault from "@/components/dashboard/DashboardVault";
import PageShell from "@/components/PageShell";
import ContextualWhisper from "@/components/ContextualWhisper";
import EcosystemContextBanner from "@/components/EcosystemContextBanner";
import hearthBg from "@/assets/hearth-bg.jpeg";
import heartwoodLanding from "@/assets/heartwood-landing.jpeg";

const VaultPage = () => {
  useDocumentTitle("Heartwood Vault — Hearts & Activity");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from"); // "hearth" | "heartwood" | null

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUserId(session.user.id);
      }
      setLoading(false);
    });
  }, [navigate]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Contextual background based on entry point
  const bgImage = from === "heartwood" ? heartwoodLanding : hearthBg;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />
      </div>

      <Header />

      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-24 sm:pb-20 relative z-10">
        <PageShell>
        <div className="max-w-5xl mx-auto">
          <TetolBreadcrumb />
          <EcosystemContextBanner
            zone="Heartwood Vault"
            subtitle="Your hearts, encounters, and activity ledger"
            parentLink={{ label: "Value Tree", to: "/value-tree" }}
          />
          <DashboardVault userId={userId} />
        </div>
        </PageShell>
      </main>

      <ContextualWhisper
        id="vault-staff"
        message="Connect your wallet to link your Staff and unlock deeper grove stewardship."
        delay={6000}
        position="bottom-center"
      />
      <Footer />
    </div>
  );
};

export default VaultPage;
