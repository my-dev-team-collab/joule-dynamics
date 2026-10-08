import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Download, Menu, X, FileText } from "lucide-react";
import config from "@/data/config.json";

const NAV_ITEMS = [
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export function PortfolioNav() {
  const [activeSection, setActiveSection] = useState<string>("projects");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
        const item = NAV_ITEMS[i];
        const el = document.getElementById(item.id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(item.id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const navOffset = 72;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: elementPosition - navOffset,
        behavior: "smooth",
      });
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  const scrollToTop = () => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", window.location.pathname);
  };

  const cvPdfUrl = config.profile.cvPdfUrl || "/cv/John_Albarka_Ibrahim_CV.pdf";

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Mark: scrolls to top */}
        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2.5 text-foreground hover:opacity-80 transition-opacity min-h-[44px] cursor-pointer"
          aria-label="Scroll to top of portfolio"
        >
          <div className="size-8 rounded-sm bg-primary flex items-center justify-center text-primary-foreground font-mono font-bold text-sm">
            JI
          </div>
          <div className="flex flex-col text-left">
            <span className="font-bold text-sm tracking-tight text-foreground leading-none">
              John Albarka Ibrahim
            </span>
            <span className="text-[11px] font-mono text-muted-foreground mt-0.5">
              AI Engineer
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs" aria-label="Portfolio sections">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`px-3 py-2 rounded-sm transition-colors cursor-pointer min-h-[44px] flex items-center ${
                  isActive
                    ? "text-primary font-semibold border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Download CV + Theme Toggle + Mobile Menu Trigger */}
        <div className="flex items-center gap-2">
          <a
            href={cvPdfUrl}
            download="John_Albarka_Ibrahim_CV.pdf"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            aria-label="Download CV as PDF"
          >
            <Download className="size-3.5" />
            <span>Download CV</span>
          </a>

          <ThemeToggle />

          {/* Mobile Menu Button with >= 44px tap target */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center size-11 rounded-sm border border-border bg-card text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open section menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-card px-4 py-3 space-y-1">
          <nav className="flex flex-col space-y-1" aria-label="Mobile portfolio sections">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full text-left px-3 py-3 rounded-sm text-sm font-mono min-h-[44px] flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="size-1.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-border/60">
            <a
              href={cvPdfUrl}
              download="John_Albarka_Ibrahim_CV.pdf"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-sm bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              <FileText className="size-4" />
              <span>Download CV (PDF)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
