import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SystemStatusBar } from "@/components/layout/SystemStatusBar";
import CredentialFooter from "@/components/layout/CredentialFooter";
import HeroEngine from "@/components/sections/HeroEngine";
import FeaturedProjectsSection from "@/components/sections/FeaturedProjectsSection";
import ExperienceSection from "@/components/sections/ExperienceSection";
import SkillsAndCredentialsSection from "@/components/sections/SkillsAndCredentialsSection";
import SolutionsShowcase from "@/components/sections/SolutionsShowcase";
import OperationalHistory from "@/components/sections/OperationalHistory";
import AuditPortal from "@/components/sections/AuditPortal";
import AboutSection from "@/components/sections/AboutSection";
import NotFound from "@/components/sections/NotFound";
import LiveSystems from "@/pages/LiveSystems";
import RealEstatePage from "@/pages/RealEstatePage";
import PortfolioPage from "@/pages/PortfolioPage";

/**
 * Root page: single-page layout, section-only composition.
 * Render order: SystemStatusBar -> Hero -> Featured Projects -> Career Experience
 *   -> Skills & Credentials -> Solutions Showcase -> How It Works -> About -> Contact -> Footer
 */
function PortfolioRoot() {
  return (
    <>
      <SystemStatusBar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-0">
        <HeroEngine />
        <FeaturedProjectsSection />
        <ExperienceSection />
        <SkillsAndCredentialsSection />
        <SolutionsShowcase />
        <OperationalHistory />
        <AboutSection />
        <AuditPortal />
      </main>
      <CredentialFooter />
    </>
  );
}

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="joule-ui-theme">
      <BrowserRouter>
        <ScrollToHash />
        <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
          <Routes>
            <Route path="/" element={<PortfolioRoot />} />
            <Route path="/real-estate" element={<RealEstatePage />} />
            <Route path="/live-systems" element={<LiveSystems />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            {/* /audit redirects to the inline contact section on the main page */}
            <Route path="/audit" element={<PortfolioRoot />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
