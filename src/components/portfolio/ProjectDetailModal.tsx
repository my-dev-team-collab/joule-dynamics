import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Github, CheckCircle2 } from "lucide-react";
import type { PortfolioProject } from "@/types/data";

function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(false);

  React.useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

interface ProjectDetailModalProps {
  project: PortfolioProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailModal({ project, open, onOpenChange }: ProjectDetailModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!project) return null;

  const getStatusColor = (status: string) => {
    if (status === "Live System") return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (status === "Production") return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
    if (status === "Fine-Tuned Model") return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (status === "Open Source") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    return "bg-amber-500/10 text-amber-500 border-amber-500/20";
  };

  const Content = () => (
    <div className="flex flex-col gap-6 text-sm py-2">
      {/* Top Badges and Fit Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Rank #{project.rank}
          </span>
          <Badge variant="outline" className={`font-mono text-[10px] tracking-wider uppercase rounded-full ${getStatusColor(project.status)}`}>
            {project.status}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            Role Fit: {project.fitScore}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Github className="size-3.5" />
              <span>GitHub</span>
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target={project.liveUrl.startsWith("/") ? "_self" : "_blank"}
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-colors"
            >
              <span>{project.status === "Fine-Tuned Model" ? "Hugging Face" : "Live Demo"}</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-muted-foreground text-sm leading-relaxed italic">
        "{project.subtitle}"
      </p>

      {/* The Challenge */}
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          The Challenge
        </h4>
        <p className="text-foreground leading-relaxed">
          {project.challenge}
        </p>
      </div>

      {/* How This Works */}
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
          {project.solutionLabel || "How This Works"}
        </h4>
        <p className="text-foreground leading-relaxed">
          {project.solution}
        </p>
      </div>

      {/* Before & After Box */}
      <div className="flex flex-col gap-2 p-4 bg-muted/30 rounded-lg border border-border">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
          Before & After
        </h4>
        <div className="flex flex-col gap-3 text-xs sm:text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground font-semibold shrink-0">Before:</span>
            <span className="text-muted-foreground italic">{project.beforeAfter.before}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-foreground font-semibold shrink-0">After:</span>
            <span className="text-foreground font-medium">{project.beforeAfter.after}</span>
          </div>
        </div>
      </div>

      {/* Key Outcomes & Metrics */}
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          {project.resultsLabel || "Key Outcomes & Metrics"}
        </h4>
        <ul className="flex flex-col gap-2.5 text-foreground leading-relaxed">
          {project.results.map((result, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{result}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tech Stack */}
      <div className="flex flex-col gap-2 border-t border-border/60 pt-4">
        <h4 className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase">
          Technologies & Infrastructure
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.map((tech, i) => (
            <span
              key={i}
              className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-muted/60 text-foreground border border-border/50"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto assistant-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-left leading-snug">
              {project.title}
            </DialogTitle>
          </DialogHeader>
          <Content />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="px-4 pt-4 pb-2 border-b border-border shrink-0">
          <DrawerTitle className="text-lg font-bold tracking-tight text-foreground text-left">
            {project.title}
          </DrawerTitle>
        </div>
        <div className="p-4 overflow-y-auto assistant-scrollbar">
          <Content />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
