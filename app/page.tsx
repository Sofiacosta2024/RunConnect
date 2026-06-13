import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import StatsStrip from "./components/StatsStrip";


export default async function Page() {

  return (
    <div className="rc-root">
      <Navbar />
      <Hero />
      <StatsStrip />
    </div>
  );
}