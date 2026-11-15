import Hero from "@/components/Hero";
import Questions from "@/components/Questions";
import LiveMap from "@/components/LiveMap";
import NearMe from "@/components/NearMe";
import Seasons from "@/components/Seasons";
import Trends from "@/components/Trends";
import Satellites from "@/components/Satellites";
import Solutions from "@/components/Solutions";
import DataSection from "@/components/DataSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <Questions />
      <LiveMap />
      <NearMe />
      <Seasons />
      <Trends />
      <Satellites />
      <Solutions />
      <DataSection />
      <Footer />
    </>
  );
}
