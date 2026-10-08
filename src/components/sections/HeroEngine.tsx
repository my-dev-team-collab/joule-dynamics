import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Bot, Award, GraduationCap, Code2 } from "lucide-react";
import config from "@/data/config.json";
import type { RootConfig } from "@/types/data";

const { hero } = config as unknown as RootConfig;

export default function HeroEngine() {
  return (
    <section className="relative border-x border-b border-border overflow-hidden">
      {/* Industrial grid mask */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, hsl(199 89% 48% / 0.12), transparent 70%)",
        }}
      />

      <div className="relative z-10 py-16 md:py-28 px-4 sm:px-6 lg:px-8">
        {/* Role Identity Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-primary text-xs font-mono font-medium mb-5">
          <Bot className="size-3.5" />
          <span>AI / ML Engineer & Systems Architect</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08] text-foreground max-w-4xl">
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--color-primary) 0%, hsl(199 89% 68%) 100%)",
            }}
          >
            {hero.headline}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground font-normal">
          {hero.subheadline}
        </p>

        {/* Quick Credentials Strip */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-4xl">
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm">
            <Award className="size-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-semibold text-foreground truncate">Azure AI Associate</p>
              <p className="text-[10px] font-mono text-muted-foreground">Certified AI-102</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm">
            <GraduationCap className="size-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-semibold text-foreground truncate">B.Eng Mech. Engineering</p>
              <p className="text-[10px] font-mono text-muted-foreground">First Class Honors (4.63 GPA)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm">
            <Bot className="size-4 text-purple-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-semibold text-foreground truncate">AI / ML Lead</p>
              <p className="text-[10px] font-mono text-muted-foreground">Zibeh Institute of Technology</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-card/60 backdrop-blur-sm">
            <Code2 className="size-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-semibold text-foreground truncate">10 Technical Builds</p>
              <p className="text-[10px] font-mono text-muted-foreground">Public Repos & Benchmarks</p>
            </div>
          </div>
        </div>

        {/* Primary Actions Row */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className="gap-2 font-semibold tracking-wide shadow-sm"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
            asChild
          >
            <a
              href="/cv/John_Albarka_Ibrahim_CV.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="John_Albarka_Ibrahim_CV.pdf"
              id="hero-download-cv"
            >
              <FileText className="size-4" />
              <span>Download CV (PDF)</span>
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-border text-foreground hover:border-primary hover:text-primary transition-colors"
            asChild
          >
            <a href="/portfolio" id="hero-view-portfolio">
              <span>Explore 10 Projects</span>
              <ArrowRight className="size-4" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="text-muted-foreground hover:text-foreground font-mono text-xs tracking-wider"
            asChild
          >
            <a href="#contact" id="hero-contact-cta">
              Contact / Hire Me
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
