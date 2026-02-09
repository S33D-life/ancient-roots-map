import Header from "@/components/Header";
import Map from "@/components/Map";

const MapPage = () => {
  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(ellipse at center, hsl(39 50% 82%), hsl(35 40% 70%) 60%, hsl(30 35% 58%) 100%)' }}>
      <Header />
      <Map />
    </div>
  );
};

export default MapPage;
