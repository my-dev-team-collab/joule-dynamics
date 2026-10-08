import { useState, useEffect, Fragment } from "react";
import type { PortfolioProject } from "@/types/data";
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
import { ExternalLink, Github, CheckCircle2 } from "lucide-react";

function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
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

function ArchitectureFlow({ diagram }: { diagram: string }) {
  const regex = /\[([^\]]+)\](?:\s*\(([^)]+)\))?/g;
  const nodes: { title: string; detail?: string }[] = [];
  let match;
  while ((match = regex.exec(diagram)) !== null) {
    nodes.push({ title: match[1], detail: match[2] });
  }

  if (nodes.length === 0) {
    return (
      <div className="p-3.5 rounded-sm bg-card border border-border">
        <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">{diagram}</pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-sm border border-border bg-card/60">
      <div className="flex flex-wrap items-center gap-2">
        {nodes.map((node, i) => (
          <Fragment key={i}>
            <div className="flex flex-col p-2.5 rounded-sm border border-border bg-background min-w-[140px] max-w-[280px]">
              <span className="font-mono text-xs font-semibold text-foreground leading-snug">
                {node.title}
              </span>
              {node.detail && (
                <span className="font-mono text-xs text-muted-foreground mt-0.5 leading-tight">
                  {node.detail}
                </span>
              )}
            </div>
            {i < nodes.length - 1 && (
              <span className="text-muted-foreground font-mono text-xs px-0.5">→</span>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailModal({ project, open, onOpenChange }: ProjectDetailModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!project) return null;

  const getStatusBadge = (status: string) => {
    let dotColor = "bg-muted-foreground";
    if (status === "Production" || status === "Live System") {
      dotColor = "bg-primary";
    } else if (status === "Live Pilot" || status === "Applied Research") {
      dotColor = "bg-accent";
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
        <span className={`size-1.5 rounded-full ${dotColor} shrink-0`} />
        <span>{status}</span>
      </span>
    );
  };

  const Content = () => (
    <div className="flex flex-col gap-6 text-sm py-2">
      {/* Top Meta Strip: Status, Plain Metric, Category & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-3">
          {getStatusBadge(project.status)}
          <span className="text-muted-foreground font-mono text-xs">·</span>
          <span className="font-mono text-xs font-semibold text-foreground">
            {project.highlightMetric}
          </span>
          <span className="text-muted-foreground font-mono text-xs">·</span>
          <span className="text-xs font-mono text-muted-foreground">
            {project.category}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source code on GitHub"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Github className="size-3.5" />
              <span>GitHub</span>
            </a>
          )}
          {project.liveUrl && !project.liveUrl.startsWith("/") && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View live production demo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
            >
              <span>{project.status === "Fine-Tuned Model" ? "Hugging Face" : "Live Demo"}</span>
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Business Use Case at the top */}
      {project.businessUseCase && (
        <div className="rounded-sm border border-border/80 bg-background/60 p-3.5 space-y-1">
          <h4 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Business Use Case
          </h4>
          <p className="text-foreground text-sm sm:text-base leading-relaxed">
            {project.businessUseCase}
          </p>
        </div>
      )}

      {/* Subtitle lead paragraph */}
      <p className="text-foreground text-sm leading-relaxed">
        {project.subtitle}
      </p>

      {/* The Challenge */}
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          The Challenge
        </h4>
        <p className="text-foreground leading-relaxed">
          {project.challenge}
        </p>
      </div>

      {/* How This Works */}
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {project.solutionLabel || "How This Works"}
        </h4>
        <p className="text-foreground leading-relaxed">
          {project.solution}
        </p>
      </div>

      {/* Before and After - 2 columns divided by a hairline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-3 border-y border-border">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Before
          </span>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {project.beforeAfter.before}
          </p>
        </div>
        <div className="flex flex-col gap-1 sm:border-l sm:border-border sm:pl-4">
          <span className="font-mono text-xs font-semibold text-foreground uppercase tracking-wider">
            After
          </span>
          <p className="text-foreground text-xs leading-relaxed font-medium">
            {project.beforeAfter.after}
          </p>
        </div>
      </div>

      {/* System Architecture and Flow */}
      {project.architectureDiagram && (
        <div className="flex flex-col gap-2">
          <h4 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            System Architecture & Flow
          </h4>
          <ArchitectureFlow diagram={project.architectureDiagram} />
        </div>
      )}

      {/* Key Outcomes and Metrics */}
      <div className="flex flex-col gap-2">
        <h4 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {project.resultsLabel || "Key Outcomes & Metrics"}
        </h4>
        <ul className="flex flex-col gap-2 text-foreground leading-relaxed">
          {project.results.map((result, i) => (
            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>{result}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tech Stack */}
      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <h4 className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Technologies & Infrastructure
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {project.techStack.map((tech, i) => (
            <span
              key={i}
              className="text-xs font-mono px-2 py-0.5 rounded-sm bg-muted text-foreground border border-border"
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
        <DialogContent className="sm:max-w-[768px] max-h-[85vh] overflow-y-auto assistant-scrollbar">
          <DialogHeader className="sticky top-0 bg-background z-10 pb-3 border-b border-border">
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
