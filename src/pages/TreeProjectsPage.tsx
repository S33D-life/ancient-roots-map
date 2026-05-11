/**
 * TreeProjectsPage — /tree-projects
 *
 * Tree Projects Directory, relocated out of Creator's Path. This is the
 * canonical home for the projects directory, surfaced from Tree Data
 * Commons and from a subtle link inside Creator's Path.
 */
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TreeResources from "@/components/TreeResources";
import { useDocumentTitle } from "@/hooks/use-document-title";

export default function TreeProjectsPage() {
  useDocumentTitle("Tree Projects Directory · S33D");
  return (
    <div className="min-h-screen relative overflow-hidden botanical-heartwood">
      <Header />
      <div
        className="relative z-10 max-w-5xl mx-auto px-4 pb-24"
        style={{ paddingTop: "var(--content-top)" }}
      >
        <TreeResources />
      </div>
      <Footer />
    </div>
  );
}
