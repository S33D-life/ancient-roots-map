import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { TreeDeciduous, Heart, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AboutPage = () => {
  useDocumentTitle("About — S33D");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1" style={{ paddingTop: "var(--content-top)" }}>
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-10">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <TreeDeciduous className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif">About S33D</h1>
            <p className="text-muted-foreground text-sm font-serif">EST 2016</p>
          </div>

          <div className="space-y-6 font-serif text-foreground/85 leading-relaxed">
            <p>
              S33D is a living atlas of the world's most ancient and remarkable trees — mapped, storied, and stewarded by a growing community of people who walk among them.
            </p>
            <p>
              We believe the oldest trees on Earth are living libraries. Each one holds centuries of ecological memory, cultural meaning, and quiet wisdom. Our mission is to make these ancient friends visible, protected, and celebrated.
            </p>
            <p>
              Anyone can contribute — by mapping a tree, sharing a story, recording birdsong, or simply visiting and bearing witness. Every act of care is recognised with S33D Hearts, tokens of stewardship that flow through the ecosystem.
            </p>
            <p>
              S33D is built as a public good. The atlas is open. The data belongs to the commons. The code grows in the open. We are funded by the community and by regenerative public goods mechanisms.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: MapPin, label: "Explore the Atlas", to: "/map" },
              { icon: Heart, label: "Support S33D", to: "/support" },
              { icon: Users, label: "Join the Community", to: "/library" },
              { icon: TreeDeciduous, label: "Add a Tree", to: "/add-tree" },
            ].map(({ icon: Icon, label, to }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-serif transition-colors hover:border-primary/40 hover:bg-primary/5"
                style={{ borderColor: "hsl(var(--border) / 0.3)", background: "hsl(var(--card) / 0.5)" }}
              >
                <Icon className="w-4 h-4 text-primary shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
