import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { SystemStatusBar } from "@/components/layout/SystemStatusBar";
import CredentialFooter from "@/components/layout/CredentialFooter";
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal";
import config from "@/data/config.json";
import type { PortfolioProject } from "@/types/data";
import {
  ArrowLeft,
  ArrowRight,
  Github,
  ExternalLink,
  Search,
  Bot,
  MessageCircle,
  Mail,
  Linkedin
} from "lucide-react";

export default function PortfolioPage() {
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const projects: PortfolioProject[] = useMemo(() => {
    return (config.projects as PortfolioProject[]) || [];
  }, []);

  const categories = [
    "All",
    "Agentic RAG",
    "Model Training & Fine-Tuning",
    "Data & Web Intelligence",
    "Embedded & Robotics"
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" || project.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        project.title.toLowerCase().includes(q) ||
        project.subtitle.toLowerCase().includes(q) ||
        project.challenge.toLowerCase().includes(q) ||
        project.techStack.some((tech) => tech.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  const getStatusBadge = (status: string) => {
    if (status === "Live System") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live System
        </span>
      );
    }
    if (status === "Production") {
      return (
        <span className="inline-flex items-center rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide text-cyan-500 ring-1 ring-inset ring-cyan-500/20">
          Production
        </span>
      );
    }
    if (status === "Fine-Tuned Model") {
      return (
        <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide text-purple-500 ring-1 ring-inset ring-purple-500/20">
          Fine-Tuned Model
        </span>
      );
    }
    if (status === "Open Source") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide text-blue-500 ring-1 ring-inset ring-blue-500/20">
          Open Source
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide text-amber-500 ring-1 ring-inset ring-amber-500/20">
        Applied Research
      </span>
    );
  };

  return (
    <>
      <SystemStatusBar />

      {/* Sticky Sub-Header Breadcrumb */}
      <div className="fixed top-12 w-full z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-3.5" />
              <span>Home</span>
            </Link>
            <span className="text-muted-foreground/40 font-sans">/</span>
            <span className="text-foreground font-semibold uppercase tracking-wider text-[11px] sm:text-xs truncate">
              Engineering Portfolio
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="hidden sm:inline">10 VERIFIED PROJECTS</span>
            <span className="sm:hidden">10 PROJECTS</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24 space-y-10 sm:space-y-12">
        {/* Header Hero */}
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-mono">
            <Bot className="size-3.5" />
            <span>AI / ML Engineer & Systems Architect</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Engineering Portfolio & Technical Builds
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Ten production-tested systems, fine-tuned transformer models, agentic RAG architectures, and distributed data pipelines built by John Albarka Ibrahim. Each build addresses real operational friction with verifiable benchmarks and clean code.
          </p>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg border border-border bg-card/50">
              <span className="text-xl font-bold text-foreground">10</span>
              <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">Ranked Builds</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/50">
              <span className="text-xl font-bold text-foreground">4</span>
              <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">Agentic RAG</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/50">
              <span className="text-xl font-bold text-foreground">2</span>
              <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">Trained Models</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card/50">
              <span className="text-xl font-bold text-foreground">100%</span>
              <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">Code & Data</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-border bg-card/40 rounded-xl">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? projects.length
                  : projects.filter((p) => p.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : "bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, tech stack..."
              className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border border-border rounded-xl bg-card/20 space-y-2">
            <p className="text-foreground font-medium">No projects matched your search.</p>
            <p className="text-xs text-muted-foreground">Try clearing filters or search keywords.</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-xs text-primary underline mt-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="rounded-xl border border-border bg-card/40 hover:bg-card/90 p-5 flex flex-col justify-between transition-all duration-200 group cursor-pointer shadow-sm hover:shadow-md hover:border-primary/40"
              >
                {/* Card Top: Rank + Status + Fit */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        #{project.rank}
                      </span>
                      {getStatusBadge(project.status)}
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Fit: {project.fitScore}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3">
                      {project.subtitle}
                    </p>
                  </div>

                  {/* Tech Stack Preview */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {project.techStack.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-muted-foreground/80">
                        +{project.techStack.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform">
                    View Breakdown <ArrowRight className="size-3" />
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub Repository"
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Github className="size-4" />
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target={project.liveUrl.startsWith("/") ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        title={project.status === "Fine-Tuned Model" ? "Hugging Face" : "Live Demo"}
                        className="p-1.5 rounded-md hover:bg-muted text-primary transition-colors"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Contact CTA */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Interested in discussing a custom build or technical collaboration?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Whether you need agentic RAG workflows, multilingual model optimization, or high-throughput scraping infrastructure, get in touch directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/2348101344101?text=Hi%20John%2C%20I%20reviewed%20your%20portfolio%20and%20would%20like%20to%20connect."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <MessageCircle className="size-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href="mailto:john@jouledynamics.me"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              <Mail className="size-3.5" />
              <span>Email John</span>
            </a>
            <a
              href="https://www.linkedin.com/in/john-albarka-ibrahim/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-colors"
            >
              <Linkedin className="size-3.5" />
            </a>
          </div>
        </div>
      </main>

      {/* Modal */}
      <ProjectDetailModal
        open={!!selectedProject}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
        project={selectedProject}
      />

      <CredentialFooter />
    </>
  );
}
