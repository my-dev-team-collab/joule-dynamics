import config from "@/data/config.json";
import type { RootConfig } from "@/types/data";
import { Briefcase, GraduationCap, CheckCircle2 } from "lucide-react";

const { experience, education } = config as unknown as RootConfig;

export default function ExperienceSection() {
  if (!experience || experience.length === 0) return null;

  return (
    <section id="experience" className="py-16 md:py-24 border-b border-border">
      {/* Section Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-primary uppercase mb-2">
          <Briefcase className="size-3.5" />
          <span>Professional Background</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Career Experience & Technical Leadership
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
          Track record leading applied AI engineering initiatives, training professional cohorts on Azure AI and Copilot, and mentoring developers through production ML workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Experience Timeline (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {experience.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-xl border border-border bg-card/40 hover:bg-card/70 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-border/50">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    {item.role}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-primary">
                    {item.organization}
                    <span className="text-muted-foreground font-normal"> · {item.location}</span>
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-muted/80 text-muted-foreground border border-border/60 self-start sm:self-auto shrink-0">
                  {item.timeline}
                </span>
              </div>

              <ul className="space-y-2 pt-1">
                {item.achievements.map((ach, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{ach}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Education & Academic Rigor Sidebar (1 Col) */}
        <div className="space-y-6">
          {education && (
            <div className="p-6 rounded-xl border border-border bg-card/50 space-y-4">
              <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-[11px] font-semibold tracking-wider uppercase">
                <GraduationCap className="size-4" />
                <span>Academic Foundation</span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground leading-snug">
                  {education.degree}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-emerald-400 mt-0.5">
                  {education.honors} ({education.gpa})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {education.institution}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-1">
                  Graduated {education.timeline}
                </p>
              </div>

              <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground leading-relaxed">
                <p className="font-semibold text-foreground mb-1">
                  Industrial Engineering Rigor:
                </p>
                <p>
                  Rooted in deterministic modeling, thermodynamics, and physical failure mode analysis, applying the same precision to software fault-tolerance, AST validation, and AI grounding.
                </p>
              </div>
            </div>
          )}

          {/* Quick Leadership Callout */}
          <div className="p-5 rounded-xl border border-border/60 bg-muted/20 text-xs space-y-2">
            <p className="font-mono text-[11px] font-bold text-foreground uppercase tracking-wider">
              Mentorship Impact
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Mentored 70+ technical participants across intensive machine learning and cloud AI cohorts, translating abstract algorithms into deployable prototypes and production backends.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
