import Map from "@/components/Map";
import PageShell from "@/components/PageShell";
import Header from "@/components/Header";

export default function MapPage() {
  return (
    <PageShell>
      <Header />
      <div
        className="pt-14"
        style={{
          height: "100dvh",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <Map />
      </div>
    </PageShell>
  );
}
