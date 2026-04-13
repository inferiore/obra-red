import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import ForClients from "@/components/ForClients";
import ForWorkers from "@/components/ForWorkers";
import TrustSection from "@/components/TrustSection";
import FlowSection from "@/components/FlowSection";
import Testimonials from "@/components/Testimonials";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import StickyMobileCTA from "@/components/StickyMobileCTA";

const Index = () => {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <ForClients />
      <ForWorkers />
      <TrustSection />
      <FlowSection />
      <Testimonials />
      <FinalCTA />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
