import { useState } from "react";
import { ExternalLink, MessageCircle, Mail, ArrowRight, Activity } from "lucide-react";
import ContactModal from "@/components/ui/ContactModal";
import { CaseStudyModal } from "@/components/ui/CaseStudyModal";
import { caseStudies } from "@/data/caseStudies";
import type { CaseStudy } from "@/data/caseStudies";

export default function ServiceTierSection() {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | CaseStudy[] | null>(null);

  const customBuilds = [
    caseStudies["unified-triage-engine"],
    caseStudies["owner-acquisition-reports"],
    caseStudies["investor-yield-data"],
    caseStudies["cross-market-arbitrage"],
    caseStudies["cma-automation"],
    caseStudies["off-market-deal-sourcing"],
    caseStudies["portfolio-performance-dashboards"],
  ];

  const handleOpenPulse = () => {
    window.dispatchEvent(new CustomEvent("open-pulse"));
  };

  const getStatusBadge = (status: string) => {
    if (status === "In Development") {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
          In Development
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-blue-500 ring-1 ring-inset ring-blue-500/20">
        On Request
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* ── Available Now Section ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-foreground">What's available</h4>
          <p className="text-xs text-muted-foreground">
            The systems you're looking at are live and running.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pulse Card */}
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-5 flex flex-col gap-4 ring-1 ring-primary/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
                  Available Now
                </span>
              </div>
              <Activity className="size-4 text-primary opacity-80" />
            </div>

            <div className="flex flex-col gap-1.5 grow">
              <p className="font-semibold text-foreground">Pulse</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {caseStudies["pulse-market-intelligence"].description}
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleOpenPulse}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Try it now
              </button>
              <button
                onClick={() => setSelectedCaseStudy([
                  caseStudies["pulse-market-intelligence"],
                  caseStudies["pulse-str-concierge"],
                  caseStudies["pulse-multifamily-leasing"]
                ])}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80 transition-opacity"
              >
                View Case Studies <ArrowRight className="size-3" />
              </button>
            </div>
          </div>

          {/* Competitor Rate Watch Card */}
          <div className="rounded-lg border border-primary/30 bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-primary font-semibold">
                Available Now
              </span>
            </div>

            <div className="flex flex-col gap-1.5 grow">
              <p className="font-semibold text-foreground">Competitor Rate Watch</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You will know exactly how your competitors price and when
                they move rates, empowering you to respond instead of reacting.
              </p>
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors self-start mt-2"
            >
              View dashboard data <ArrowRight className="size-3 -rotate-45" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Custom Builds Section ── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-foreground">Custom builds</h4>
          <p className="text-xs text-muted-foreground">
            Built to your market and use case. Reach out to discuss what's possible.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customBuilds.map((build) => (
            <div 
              key={build.id} 
              className="rounded-lg border border-border bg-card/40 hover:bg-card/80 p-5 flex flex-col gap-4 transition-colors group cursor-pointer"
              onClick={() => setSelectedCaseStudy(build)}
            >
              <div className="flex items-center gap-2">
                {getStatusBadge(build.status)}
              </div>

              <div className="flex flex-col gap-1.5 grow">
                <span className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                  {build.title}
                </span>
                <span className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                  {build.description}
                </span>
              </div>

              <button className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors self-start mt-1">
                View Case Study <ArrowRight className="size-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <a
            href="https://wa.me/2348101344101?text=Hi%20John%2C%20I%27d%20like%20to%20discuss%20a%20custom%20build%20for%20Real%20Estate%20Intelligence."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <MessageCircle className="size-3.5" />
            Chat on WhatsApp
            <ExternalLink className="size-3 opacity-60" />
          </a>

          <ContactModal
            trigger={(open) => (
              <button
                onClick={open}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <Mail className="size-3.5" />
                Email Us
              </button>
            )}
          />
        </div>
      </div>

      {/* Reusable Modal */}
      {selectedCaseStudy && (
        <CaseStudyModal
          open={!!selectedCaseStudy}
          onOpenChange={(open) => {
            if (!open) setSelectedCaseStudy(null);
          }}
          caseStudy={selectedCaseStudy}
        />
      )}
    </div>
  );
}
