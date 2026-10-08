import { useState, useMemo, useEffect } from "react";
import config from "@/data/config.json";
import type { PortfolioProject, CareerExperience, ProfessionalCertification } from "@/types/data";
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal";
import { PortfolioIsoFigure } from "@/components/portfolio/PortfolioIsoFigure";
import { WorkshopFloorFigure } from "@/components/portfolio/WorkshopFloorFigure";
import { PortfolioNav } from "@/components/portfolio/PortfolioNav";
import { PortfolioFooter } from "@/components/portfolio/PortfolioFooter";
import {
  ArrowRight,
  ExternalLink,
  Github,
  Search,
  MessageCircle,
  Mail,
  Linkedin,
  Download,
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function PortfolioPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  // Hash link handler on mount and hashchange
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          const navOffset = 72;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementPosition - navOffset,
            behavior: "smooth",
          });
        }
      }
    };

    // Small delay to ensure all DOM elements are mounted
    const timer = setTimeout(handleHashScroll, 50);
    window.addEventListener("hashchange", handleHashScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashScroll);
    };
  }, []);

  const projects = useMemo(() => {
    return (config.projects as PortfolioProject[]) || [];
  }, []);

  const experiences = useMemo(() => {
    return (config.experience as CareerExperience[]) || [];
  }, []);

  const certifications = useMemo(() => {
    return (config.certifications as ProfessionalCertification[]) || [];
  }, []);

  const groupedSkills = useMemo(() => {
    return config.groupedSkills || [];
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
        (project.businessUseCase && project.businessUseCase.toLowerCase().includes(q)) ||
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
        (project.businessUseCase && project.businessUseCase.toLowerCase().includes(q)) ||
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

  const cvPdfUrl = config.profile.cvPdfUrl || "/cv/John_Albarka_Ibrahim_CV.pdf";
  const cvDocxUrl = config.profile.cvDocxUrl || "/cv/John_Albarka_Ibrahim_CV.docx";

  const renderProjectCard = (project: PortfolioProject) => {
    const isHoverMatched = hoveredCategory === project.category;

    return (
      <div
        key={project.id}
        onClick={() => setSelectedProject(project)}
        className={`rounded-sm bg-card p-6 flex flex-col justify-between transition-colors duration-150 group cursor-pointer ${
          isHoverMatched ? "border-2 border-primary" : "border border-border"
        } hover:border-primary lg:col-span-1 min-h-[320px]`}
      >
        <div className="space-y-3">
          {/* Status dot + category */}
          <div className="flex items-center justify-between gap-2">
            {getStatusBadge(project.status)}
            <span className="text-xs font-mono text-muted-foreground uppercase">
              {project.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold tracking-tight text-foreground transition-colors group-hover:text-primary text-xl leading-snug">
            {project.title}
          </h3>

          {/* Plain-language business use case */}
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">
            {project.businessUseCase || project.subtitle}
          </p>

          {/* Metric callout */}
          <div className="pt-1">
            <span className="inline-block text-xs font-mono font-medium text-foreground bg-muted px-2 py-0.5 rounded-sm border border-border">
              {project.highlightMetric}
            </span>
          </div>
        </div>

        {/* Footer: Tech stack + Action links */}
        <div className="pt-5 border-t border-border mt-5 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {project.techStack.slice(0, 4).map((tech) => (
              <span
                key={tech}
                className="text-xs font-mono px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground"
              >
                {tech}
              </span>
            ))}
            {project.techStack.length > 4 && (
              <span className="text-xs font-mono px-1 py-0.5 text-muted-foreground">
                +{project.techStack.length - 4}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <span className="text-primary font-semibold group-hover:underline inline-flex items-center gap-1">
              <span>View Breakdown</span>
              <ArrowRight className="size-3" />
            </span>

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View source on GitHub"
                  className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="size-4" />
                </a>
              )}
              {project.liveUrl && !project.liveUrl.startsWith("/") && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View live deployment"
                  className="p-1 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PortfolioNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 space-y-16">
        {/* Section 1: Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-muted text-foreground border border-border text-xs font-mono">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>AI ENGINEER</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {config.profile.name}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {config.profile.subheadline}
            </p>

            {/* Direct Actions: Download CV PDF as primary, DOCX as secondary */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={cvPdfUrl}
                download="John_Albarka_Ibrahim_CV.pdf"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                <Download className="size-4" />
                <span>Download CV (PDF)</span>
              </a>

              <a
                href={cvDocxUrl}
                download="John_Albarka_Ibrahim_CV.docx"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors min-h-[44px]"
              >
                <FileText className="size-4" />
                <span>Download Word (DOCX)</span>
              </a>

              <a
                href="#projects"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
              >
                <span>Explore Projects</span>
                <ArrowRight className="size-3.5" />
              </a>
            </div>

            {/* Credential line under the buttons */}
            <p className="text-xs font-mono text-muted-foreground pt-1">
              {config.education.degree} ({config.education.honors}) · Microsoft Certified Azure AI Engineer Associate (AI-102)
            </p>
          </div>

          {/* Interactive Isometric Hero Figure */}
          <div className="lg:col-span-7 w-full flex justify-center lg:justify-end">
            <PortfolioIsoFigure
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
              hoveredCategory={hoveredCategory}
              onHoverCategory={setHoveredCategory}
              onSelectProject={setSelectedProject}
            />
          </div>
        </section>

        {/* Section 2: Projects */}
        <section id="projects" className="scroll-mt-24 space-y-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-mono uppercase text-muted-foreground">
                // PRODUCTION & APPLIED BUILDS
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Projects & Architectures
              </h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {totalFilteredCount} OF {projects.length} PROJECTS DISPLAYED
            </span>
          </div>

          {/* Flat Category Filter Tabs and Search Box */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
            <div className="flex flex-wrap items-center gap-6 overflow-x-auto" role="tablist">
              {categories.map((cat) => {
                const count =
                  cat === "All"
                    ? projects.length
                    : projects.filter((p) => p.category === cat).length;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(cat)}
                    className={`pb-1 text-sm font-sans transition-colors flex items-center gap-1.5 cursor-pointer min-h-[44px] ${
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
                placeholder="Search by title, use case, tech..."
                className="w-full bg-background border border-border rounded-sm pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary min-h-[44px]"
              />
            </div>
          </div>

          {/* Empty State */}
          {totalFilteredCount === 0 ? (
            <div className="p-12 text-center border border-border rounded-sm bg-card space-y-2">
              <p className="text-foreground font-medium">No projects matched your search.</p>
              <p className="text-sm text-muted-foreground">Try clearing filters or search terms.</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                }}
                className="text-sm text-primary underline mt-2 cursor-pointer min-h-[44px]"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Featured Projects Grid */}
              {filteredFeaturedProjects.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredFeaturedProjects.map((p) => renderProjectCard(p))}
                </div>
              )}

              {/* Second Isometric Figure: System Architecture Overview with Sticky Detail Panel */}
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
        </section>

        {/* Section 3: Experience */}
        <section id="experience" className="scroll-mt-24 space-y-8 pt-8 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase text-muted-foreground">
              // VERIFIED CAREER TRACK RECORD
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Briefcase className="size-6 text-primary" />
              <span>Work Experience</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {experiences.map((exp) => (
              <div
                key={exp.id}
                className="rounded-sm border border-border bg-card p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-primary font-semibold">
                      {exp.timeline}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {exp.location}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground">
                    {exp.role}
                  </h3>
                  <p className="text-sm font-mono text-muted-foreground">
                    {exp.organization}
                  </p>

                  <ul className="space-y-2 pt-2 text-xs text-foreground/90 leading-relaxed">
                    {exp.achievements.map((ach, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="size-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Skills */}
        <section id="skills" className="scroll-mt-24 space-y-8 pt-8 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase text-muted-foreground">
              // ENGINEERING CAPABILITIES
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="size-6 text-primary" />
              <span>Technical Skills</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedSkills.map((group, idx) => (
              <div
                key={idx}
                className="rounded-sm border border-border bg-card p-5 space-y-3"
              >
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
                  {group.category}
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded-sm bg-background border border-border text-xs font-mono text-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Education and Certifications */}
        <section id="education" className="scroll-mt-24 space-y-8 pt-8 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase text-muted-foreground">
              // ACADEMICS & PROFESSIONAL CREDENTIALS
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <span>Education & Certifications</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Academic Degree Card (5 of 12) */}
            <div className="lg:col-span-5 rounded-sm border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-semibold">
                <GraduationCap className="size-4" />
                <span>UNIVERSITY DEGREE</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-xl font-bold text-foreground">
                  {config.education.degree}
                </h3>
                <div className="inline-block px-2 py-0.5 rounded-sm bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-semibold">
                  {config.education.honors}
                </div>
              </div>

              <div className="space-y-1 text-xs font-mono text-muted-foreground pt-2 border-t border-border">
                <p className="text-foreground font-medium">{config.education.institution}</p>
                <p>Timeline: {config.education.timeline}</p>
                <p className="text-foreground font-semibold">{config.education.gpa}</p>
              </div>
            </div>

            {/* Certifications Grid (7 of 12) */}
            <div className="lg:col-span-7 rounded-sm border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-primary font-mono text-xs font-semibold">
                <Award className="size-4" />
                <span>PROFESSIONAL CERTIFICATIONS</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {certifications.map((cert) => {
                  const isLink = Boolean(cert.credentialUrl);

                  if (isLink) {
                    return (
                      <a
                        key={cert.id}
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-sm border border-border bg-background p-3 flex flex-col justify-between hover:border-primary transition-colors group min-h-[44px]"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug block">
                            {cert.title}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground block">
                            {cert.issuer} · {cert.year}
                          </span>
                        </div>
                        <div className="pt-2 flex items-center gap-1 text-[11px] font-mono text-primary font-medium">
                          <span>View Credential</span>
                          <ExternalLink className="size-3" />
                        </div>
                      </a>
                    );
                  }

                  return (
                    <div
                      key={cert.id}
                      className="rounded-sm border border-border bg-background p-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-foreground leading-snug block">
                          {cert.title}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground block">
                          {cert.issuer} · {cert.year}
                        </span>
                      </div>
                      <span className="pt-2 text-[11px] font-mono text-muted-foreground">
                        Course Specialization
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Hiring & Contact */}
        <section
          id="contact"
          className="scroll-mt-24 rounded-sm border border-border bg-card p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mt-16"
        >
          <div className="space-y-2 max-w-xl">
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              Hiring? Download my CV or get in touch.
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reach out directly for engineering roles, technical interviews, or project inquiries.
            </p>
            {config.profile.availability && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-medium">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>{config.profile.availability}</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={cvPdfUrl}
              download="John_Albarka_Ibrahim_CV.pdf"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              <Download className="size-4" />
              <span>Download CV (PDF)</span>
            </a>

            <a
              href="mailto:john@jouledynamics.me"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors min-h-[44px]"
            >
              <Mail className="size-4" />
              <span>Email</span>
            </a>

            <a
              href="https://www.linkedin.com/in/john-albarka-ibrahim/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect on LinkedIn"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors min-h-[44px]"
            >
              <Linkedin className="size-4" />
              <span>LinkedIn</span>
            </a>

            <a
              href="https://wa.me/2348101344101"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-background hover:bg-muted text-foreground text-sm font-medium transition-colors min-h-[44px]"
            >
              <MessageCircle className="size-4" />
              <span>WhatsApp</span>
            </a>
          </div>
        </section>
      </main>

      {/* Project Detail Modal */}
      <ProjectDetailModal
        open={Boolean(selectedProject)}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
        project={selectedProject}
      />

      <PortfolioFooter />
    </>
  );
}
