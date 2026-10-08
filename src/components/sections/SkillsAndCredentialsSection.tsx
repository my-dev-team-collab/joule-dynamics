import config from "@/data/config.json";
import type { RootConfig } from "@/types/data";
import { Award, Cpu, ShieldCheck } from "lucide-react";

const { groupedSkills, certifications } = config as unknown as RootConfig;

export default function SkillsAndCredentialsSection() {
  return (
    <section id="skills" className="py-16 md:py-24 border-b border-border">
      {/* Section Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-primary uppercase mb-2">
          <Cpu className="size-3.5" />
          <span>Core Capabilities</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Technical Skills & Verified Certifications
        </h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
          Grouped technical stack for screening, backed by official Microsoft Azure credentials and real-world system deployments.
        </p>
      </div>

      <div className="space-y-12">
        {/* Grouped Skills Matrix */}
        {groupedSkills && groupedSkills.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedSkills.map((group) => (
              <div
                key={group.category}
                className="p-5 rounded-xl border border-border bg-card/40 space-y-3"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <span className="size-2 rounded-full bg-primary" />
                  <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-foreground">
                    {group.category}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-mono px-2.5 py-1 rounded bg-muted/60 text-foreground border border-border/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verified Certifications Strip */}
        {certifications && certifications.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-primary" />
              <h3 className="font-mono text-xs font-bold tracking-widest uppercase text-muted-foreground">
                Verified Certifications & Specializations
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 rounded-lg border border-border/80 bg-card/60 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground leading-snug">
                      {cert.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {cert.issuer} · {cert.year}
                    </p>
                  </div>
                  {cert.code && (
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                      {cert.code}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recruiter Evaluation Note */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 flex items-center gap-3 text-xs text-foreground/90 font-mono">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span>
            All listed skills are demonstrated in public repositories, with 106 automated tests, benchmark logs, and live Hugging Face models.
          </span>
        </div>
      </div>
    </section>
  );
}
