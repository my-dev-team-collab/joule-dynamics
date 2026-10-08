import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import config from "@/data/config.json";
import type { PortfolioProject } from "@/types/data";
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal";
import { ArrowRight, ExternalLink, Github, CheckCircle2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FeaturedProjectsSection() {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const featuredProjects = useMemo(() => {
    const all = (config.projects as PortfolioProject[]) || [];
    return all.filter((p) => p.isFeatured).slice(0, 4);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === "Live System") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (status === "Live Pilot") return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    if (status === "Production") return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
    if (status === "Fine-Tuned Model") return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (status === "Open Source") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  };

  return (
    <section id="featured-projects" className="py-16 md:py-24 border-b border-border">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-primary uppercase mb-2">
            <Sparkles className="size-3.5" />
            <span>Featured Engineering Work</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Flagship Systems & Benchmark Models
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
            Four production systems and fine-tuned architectures demonstrating end-to-end agentic workflows, sub-10ms CPU inference, and resilient distributed data pipelines.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 font-mono text-xs border-border self-start md:self-auto shrink-0"
          asChild
        >
          <Link to="/portfolio">
            <span>View All 10 Projects</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* Featured Projects Grid (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {featuredProjects.map((project) => (
          <div
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="rounded-xl border border-border bg-card/50 hover:bg-card/90 p-6 flex flex-col justify-between transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md hover:border-primary/40"
          >
            <div className="space-y-4">
              {/* Card Meta Bar */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`font-mono text-[10px] tracking-wider uppercase rounded-full ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </Badge>
                  <span className="text-[10px] font-mono text-muted-foreground uppercase px-2 py-0.5 rounded bg-muted/60 border border-border/40">
                    {project.category}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/25">
                  {project.highlightMetric}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-lg sm:text-xl text-foreground group-hover:text-primary transition-colors leading-snug">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed line-clamp-2">
                  {project.subtitle}
                </p>
              </div>

              {/* Key Outcome Highlights */}
              <div className="space-y-2 pt-1 border-t border-border/40">
                <p className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground">
                  Verified Benchmarks
                </p>
                <div className="space-y-1.5">
                  {project.results.slice(0, 2).map((res, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground/90">
                      <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{res}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.techStack.slice(0, 5).map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
                  >
                    {tech}
                  </span>
                ))}
                {project.techStack.length > 5 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-muted-foreground/80">
                    +{project.techStack.length - 5}
                  </span>
                )}
              </div>
            </div>

            {/* Action Links */}
            <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between gap-3 text-xs">
              <span className="text-primary font-mono text-[11px] font-medium group-hover:underline flex items-center gap-1">
                View Architecture & Flow
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
              </span>

              <div className="flex items-center gap-3 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors p-1"
                    title="View GitHub Repository"
                  >
                    <Github className="size-4" />
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target={project.liveUrl.startsWith("/") ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors p-1"
                    title="View Live Deployment"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Directory Callout Banner */}
      <div className="mt-8 p-5 rounded-xl border border-border/80 bg-muted/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Looking for fine-tuned models, web intelligence crawlers, or robotics builds?
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore all 10 completed builds with verifiable metrics, architecture diagrams, and source code.
          </p>
        </div>
        <Button size="sm" className="gap-2 font-mono text-xs shrink-0" asChild>
          <Link to="/portfolio">
            <span>Explore All 10 Builds</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />
    </section>
  );
}
