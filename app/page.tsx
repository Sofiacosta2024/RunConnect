import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";
import Feed from "./components/Feed/Feed";
import { getSugerencias } from "@/app/sugerencias/actions";

export default async function Page() {
  const sugerenciasIniciales = await getSugerencias({
    nivel: "intermedio",
    distanciaMaxKm: 10,
  }).catch(() => []);

  return (
    <div className="rc-root">
      <Navbar />
      <Hero />
      <StatsStrip />

      <div className="rc-layout">
        <Feed sugerenciasIniciales={sugerenciasIniciales} />
      </div>
    </div>
  );
}