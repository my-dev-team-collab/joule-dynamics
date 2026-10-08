import { Download, FileText, Github, Linkedin, Mail } from "lucide-react";
import config from "@/data/config.json";

export function PortfolioFooter() {
  const cvPdfUrl = config.profile.cvPdfUrl || "/cv/John_Albarka_Ibrahim_CV.pdf";
  const cvDocxUrl = config.profile.cvDocxUrl || "/cv/John_Albarka_Ibrahim_CV.docx";

  const scrollToSection = (id: string) => {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <footer className="w-full border-t border-border bg-card mt-24 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/60">
          {/* Brand block */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={scrollToTop}
              className="text-left font-bold text-base text-foreground tracking-tight hover:opacity-80 transition-opacity cursor-pointer"
            >
              John Albarka Ibrahim
            </button>
            <p className="text-xs font-mono text-muted-foreground">
              AI Engineer · Production Systems & Agentic Architectures
            </p>
          </div>

          {/* In-page section anchors */}
          <nav className="flex flex-wrap items-center gap-4 text-xs font-mono" aria-label="Footer section navigation">
            {[
              { id: "projects", label: "Projects" },
              { id: "experience", label: "Experience" },
              { id: "skills", label: "Skills" },
              { id: "education", label: "Education" },
              { id: "contact", label: "Contact" },
            ].map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-h-[44px] flex items-center"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Social & Direct Contact Links */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/JohnJodinho"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="size-11 rounded-sm border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="size-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/john-albarka-ibrahim/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn Profile"
              className="size-11 rounded-sm border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Linkedin className="size-4" />
            </a>
            <a
              href="mailto:john@jouledynamics.me"
              aria-label="Email John Albarka Ibrahim"
              className="size-11 rounded-sm border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="size-4" />
            </a>
          </div>
        </div>

        {/* Bottom bar with CV downloads and copyright */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={cvPdfUrl}
              download="John_Albarka_Ibrahim_CV.pdf"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors min-h-[44px]"
            >
              <Download className="size-3.5" />
              <span>Download CV (PDF)</span>
            </a>
            <span>·</span>
            <a
              href={cvDocxUrl}
              download="John_Albarka_Ibrahim_CV.docx"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors min-h-[44px]"
            >
              <FileText className="size-3.5" />
              <span>Download Word (DOCX)</span>
            </a>
          </div>

          <div>
            <span>© {new Date().getFullYear()} John Albarka Ibrahim. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
