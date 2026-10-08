import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
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

      <div className="relative z-10 py-20 md:py-32 px-4 sm:px-6 lg:px-8">
        {/* Main headline - from config.hero */}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-foreground max-w-4xl">
          {hero.headline}
        </h1>

        {/* Subheadline - from config.hero */}
        <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
          {hero.subheadline}
        </p>

        {/* CTA row */}
        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button
            size="lg"
            className="w-full sm:w-auto gap-2 font-semibold tracking-wide rounded-sm"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-primary-foreground)",
            }}
            asChild
          >
            <a href={hero.primaryCtaLink} id="hero-primary-cta">
              {hero.primaryCtaLabel}
              <ArrowRight className="size-4" />
            </a>
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full sm:w-auto gap-2 border-border text-foreground hover:border-primary hover:text-primary transition-colors rounded-sm"
            asChild
          >
            <a href="#solutions" id="hero-secondary-cta">
              See the solutions
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
