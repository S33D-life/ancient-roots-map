import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/use-document-title";

const PrivacyPage = () => {
  useDocumentTitle("Privacy — S33D");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1" style={{ paddingTop: "var(--content-top)" }}>
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif">Privacy</h1>
            <p className="text-muted-foreground text-sm font-serif">How S33D handles your data</p>
          </div>

          <div className="space-y-6 font-serif text-foreground/85 leading-relaxed text-sm">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">What we collect</h2>
              <p>When you create an account, we store your email address and any profile information you choose to share. When you map a tree or make an offering, that contribution is stored in our database and attributed to your account.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">How we use it</h2>
              <p>Your data is used solely to power the S33D atlas and ecosystem. We do not sell personal data. We do not run advertising. Tree location data contributes to the open commons atlas.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Cookies &amp; analytics</h2>
              <p>We use minimal cookies for authentication and session management. We may use privacy-respecting analytics to understand how the platform is used. No third-party tracking scripts are loaded.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Your rights</h2>
              <p>You can request deletion of your account and associated data at any time by contacting us. Contributions to the public atlas (tree mappings) may remain as anonymous commons data.</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Contact</h2>
              <p>For privacy questions, reach out through the Feedback page or community channels.</p>
            </section>

            <p className="text-xs text-muted-foreground pt-4">Last updated: March 2026</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPage;
