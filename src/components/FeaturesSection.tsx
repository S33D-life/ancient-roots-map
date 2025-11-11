import { MapPin, Heart, Globe, TreePine } from "lucide-react";
import treeNetwork from "@/assets/tree-network.jpg";

const features = [
  {
    icon: MapPin,
    title: "what3words Locations",
    description: "Precisely locate and share ancient trees using intuitive 3-word addresses"
  },
  {
    icon: Heart,
    title: "Share Offerings",
    description: "Honor trees with photos, poems, songs, stories, and NFT connections"
  },
  {
    icon: Globe,
    title: "Multi-Scale Groves",
    description: "Explore from hyper-local to planetary scales, by species or lineage"
  },
  {
    icon: TreePine,
    title: "Living Atlas",
    description: "Connect individual wisdom keepers into one planetary web of ancient friends"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${treeNetwork})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-mystical mb-4">
            A Layered Atlas of Life
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Honoring individual groves while weaving them into a planetary tapestry
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group relative"
            >
              <div className="border-2 border-mystical bg-card/50 backdrop-blur-sm rounded-lg p-6 h-full transition-mystical hover:border-mystical-glow hover:glow-subtle">
                <div className="w-14 h-14 rounded-full bg-gradient-mystical flex items-center justify-center mb-4 glow-subtle group-hover:glow-sacred transition-mystical">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-primary mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
