import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import config from "@/data/config.json";
import type { PortfolioProject } from "@/types/data";
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal";
import { PortfolioIsoFigure } from "@/components/portfolio/PortfolioIsoFigure";
import { WorkshopFloorFigure } from "@/components/portfolio/WorkshopFloorFigure";
import { SystemStatusBar } from "@/components/layout/SystemStatusBar";
import CredentialFooter from "@/components/layout/CredentialFooter";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Github,
  Search,
  MessageCircle,
  Mail,
  Linkedin,
} from "lucide-react";

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const projects = useMemo(() => {
    return (config.projects as PortfolioProject[]) || [];
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(projects.map((p) => p.category)));
    return ["All", ...cats];
  }, [projects]);

  // Data-driven split: featured vs other builds
  const featuredProjects = useMemo(() => {
    return projects
      .filter((p) => Boolean(p.isFeatured))
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  }, [projects]);

  const otherProjects = useMemo(() => {
    return projects
      .filter((p) => !p.isFeatured)
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  }, [projects]);

  const filteredFeaturedProjects = useMemo(() => {
    return featuredProjects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" || project.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;
      return (
        project.title.toLowerCase().includes(q) ||
        project.subtitle.toLowerCase().includes(q) ||
        project.challenge.toLowerCase().includes(q) ||
        project.techStack.some((tech) => tech.toLowerCase().includes(q))
      );
    });
  }, [featuredProjects, selectedCategory, searchQuery]);

  const filteredOtherProjects = useMemo(() => {
    return otherProjects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" || project.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;
      return (
        project.title.toLowerCase().includes(q) ||
        project.subtitle.toLowerCase().includes(q) ||
        project.challenge.toLowerCase().includes(q) ||
        project.techStack.some((tech) => tech.toLowerCase().includes(q))
      );
    });
  }, [otherProjects, selectedCategory, searchQuery]);

  const totalFilteredCount = filteredFeaturedProjects.length + filteredOtherProjects.length;

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

  const renderProjectCard = (project: PortfolioProject, isFeatured: boolean) => {
    const isHoverMatched = hoveredCategory === project.category;

    return (
      <div
        key={project.id}
        onClick={() => setSelectedProject(project)}
        className={`rounded-sm bg-card p-6 flex flex-col justify-between transition-colors duration-150 group cursor-pointer ${
          isHoverMatched ? "border-2 border-primary" : "border border-border"
        } hover:border-primary ${
          isFeatured ? "lg:col-span-1 min-h-[300px]" : "min-h-[270px]"
        }`}
      >
        <div className="space-y-3">
          {/* Status dot + category */}
          <div className="flex items-center justify-between gap-2">
            {getStatusBadge(project.status)}
            <span className="text-xs font-mono text-muted-foreground uppercase">
              {project.category}
            </span>
          </div>

          {/* Title: 1 step larger on featured cards */}
          <h3
            className={`font-bold text-foreground group-hover:text-primary transition-colors leading-snug ${
              isFeatured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
            }`}
          >
            {project.title}
          </h3>

          {/* Description: Consistent min-height, wrapped without ellipsis clipping */}
          <p className="min-h-[4.5rem] text-sm text-muted-foreground leading-relaxed">
            {project.subtitle}
          </p>

          {/* One Metric */}
          <div className="pt-1">
            <span className="text-[13px] font-mono text-foreground font-semibold">
              {project.highlightMetric}
            </span>
          </div>

          {/* Stack line */}
          <p className="text-[13px] font-mono text-muted-foreground truncate pt-0.5">
            {project.techStack.slice(0, 4).join(", ")}
            {project.techStack.length > 4 && ` +${project.techStack.length - 4}`}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            <span>View Breakdown</span>
            <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
          </span>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
                title="GitHub Repository"
                className="p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="size-4" />
              </a>
            )}
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target={project.liveUrl.startsWith("/") ? "_self" : "_blank"}
                rel="noopener noreferrer"
                aria-label={
                  project.status === "Fine-Tuned Model"
                    ? "Hugging Face model"
                    : "Live demo"
                }
                title={
                  project.status === "Fine-Tuned Model"
                    ? "Hugging Face"
                    : "Live Demo"
                }
                className="p-1 rounded-sm hover:bg-muted text-primary transition-colors"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <SystemStatusBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-12">
        {/* Breadcrumb strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 border-b border-border text-sm font-sans">
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Home</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">
              Engineering Portfolio
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            <span>{projects.length} PROJECTS · PUBLIC CODE & BENCHMARKS</span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-[13px] font-mono font-normal tracking-normal text-muted-foreground uppercase">
              // PRODUCTION ARCHITECTURES · AI / ML & SYSTEMS ENGINEERING
            </p>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.08]">
              Engineering Portfolio & Technical Builds
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              Ten production systems, fine-tuned transformer models, agentic RAG architectures, and distributed data pipelines built by John Albarka Ibrahim. Each build addresses real operational friction with verifiable benchmarks and public code.
            </p>

            <p className="text-[13px] font-mono text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 pt-2">
              <span className="text-foreground font-semibold">{projects.length} PRODUCTION PROJECTS</span>
              <span>·</span>
              <span>4 AGENTIC RAG</span>
              <span>·</span>
              <span>2 TRAINED MODELS</span>
              <span>·</span>
              <span>100% PUBLIC REPOSITORIES</span>
            </p>
          </div>

          {/* Isometric Domain Figure */}
          <div className="lg:col-span-5 w-full">
            <PortfolioIsoFigure
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              hoveredCategory={hoveredCategory}
              onHoverCategory={setHoveredCategory}
              onSelectProject={setSelectedProject}
            />
          </div>
        </section>

        {/* Flat Filter and Search Row */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-b border-border pb-3">
          {/* Flat category text tabs */}
          <div className="flex flex-wrap items-center gap-6 overflow-x-auto">
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
                  className={`pb-1 text-sm font-sans transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "text-foreground font-semibold border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-sm font-sans text-muted-foreground">({count})</span>
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
              className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </section>

        {/* Empty State if No Projects Match Filter */}
        {totalFilteredCount === 0 ? (
          <div className="p-12 text-center border border-border rounded-sm bg-card space-y-2">
            <p className="text-foreground font-medium">No projects matched your search.</p>
            <p className="text-sm text-muted-foreground">Try clearing filters or search keywords.</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-sm text-primary underline mt-2 cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Projects Grid */}
            {filteredFeaturedProjects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredFeaturedProjects.map((p) => renderProjectCard(p, true))}
              </div>
            )}

            {/* Second Isometric Figure: The Workshop Floor with Sticky Detail Panel */}
            {filteredOtherProjects.length > 0 && (
              <WorkshopFloorFigure
                projects={otherProjects}
                selectedCategory={selectedCategory}
                searchQuery={searchQuery}
                onSelectProjectForModal={setSelectedProject}
              />
            )}
          </div>
        )}

        {/* Bottom Contact Block */}
        <section className="rounded-sm border border-border bg-card p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-lg sm:text-xl font-bold text-foreground">
              Interested in discussing a custom build or technical collaboration?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Whether you need agentic RAG workflows, multilingual model optimization, or high-throughput scraping infrastructure, get in touch directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="https://wa.me/2348101344101?text=Hi%20John%2C%20I%20reviewed%20your%20portfolio%20and%20would%20like%20to%20connect."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="size-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
            <a
              href="mailto:john@jouledynamics.me"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
            >
              <Mail className="size-3.5" />
              <span>Email John</span>
            </a>
            <a
              href="https://www.linkedin.com/in/john-albarka-ibrahim/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect on LinkedIn"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors"
            >
              <Linkedin className="size-3.5" />
            </a>
          </div>
        </section>
      </main>

      {/* Project Detail Modal */}
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
