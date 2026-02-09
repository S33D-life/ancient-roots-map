import Header from "@/components/Header";
import Map from "@/components/Map";

const MapPage = () => {
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, hsl(100 20% 32%), hsl(95 25% 24%) 60%, hsl(90 22% 16%) 100%)' }}>
      <Header />
      <Map />
    </div>
  );
};

export default MapPage;
