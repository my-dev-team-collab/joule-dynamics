import { ArrowRight, ExternalLink, Github } from "lucide-react";
import type { PortfolioProject } from "@/types/data";

interface ProjectCardProps {
  project: PortfolioProject;
  isCategoryHighlighted: boolean;
  onSelect: (project: PortfolioProject) => void;
}

const statusColor: Record<PortfolioProject["status"], string> = {
  Production: "bg-primary",
  "Live System": "bg-primary",
  "Live Pilot": "bg-accent",
  "Applied Research": "bg-accent",
  "Fine-Tuned Model": "bg-muted-foreground",
  "Open Source": "bg-muted-foreground",
};

export function ProjectCard({
  project,
  isCategoryHighlighted,
  onSelect,
}: ProjectCardProps) {
  return (
    <article
      className={`group flex min-h-[340px] flex-col justify-between rounded-sm bg-card p-6 transition-colors duration-150 ${
        isCategoryHighlighted ? "border-2 border-primary" : "border border-border"
      } hover:border-primary`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <span className={`size-1.5 shrink-0 rounded-full ${statusColor[project.status]}`} />
            {project.status}
          </span>
          <span className="text-right text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
            {project.category}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-bold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
            {project.displayTitle || project.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {project.businessUseCase || project.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 border-y border-border/70 py-3 text-xs">
          <div>
            <span className="font-mono uppercase tracking-wide text-muted-foreground">Result</span>
            <p className="mt-1 font-semibold text-foreground">{project.highlightMetric}</p>
          </div>
          {project.myRole && (
            <div>
              <span className="font-mono uppercase tracking-wide text-muted-foreground">My role</span>
              <p className="mt-1 leading-relaxed text-foreground/90">{project.myRole}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.slice(0, 4).map((tech) => (
            <span key={tech} className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
              {tech}
            </span>
          ))}
          {project.techStack.length > 4 && (
            <span className="px-1 py-0.5 text-xs font-mono text-muted-foreground">
              +{project.techStack.length - 4}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => onSelect(project)}
            className="inline-flex min-h-[44px] items-center gap-1 text-primary font-semibold hover:underline"
          >
            View case study
            <ArrowRight className="size-3" />
          </button>
          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.displayTitle || project.title} source on GitHub`}
                className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="size-4" />
              </a>
            )}
            {project.liveUrl && !project.liveUrl.startsWith("/") && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View ${project.displayTitle || project.title} live deployment`}
                className="inline-flex size-9 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
