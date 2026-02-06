import {
  Navbar,
  HeroSection,
  AboutSection,
  FeaturesSection,
  StatsSection,
  TeamSection,
  Footer,
} from "./components";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <AboutSection />
        <FeaturesSection />
        <StatsSection />
        <TeamSection />
      </main>
      <Footer />
    </>
  );
}
