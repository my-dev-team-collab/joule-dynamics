import { useState, useMemo, useEffect } from "react";
import config from "@/data/config.json";
import type { PortfolioProject, CareerExperience, ProfessionalCertification } from "@/types/data";
import { ProjectDetailModal } from "@/components/portfolio/ProjectDetailModal";
import { PortfolioIsoFigure } from "@/components/portfolio/PortfolioIsoFigure";
import { WorkshopFloorFigure } from "@/components/portfolio/WorkshopFloorFigure";
import { ProjectCard } from "@/components/portfolio/ProjectCard";
import { PortfolioNav } from "@/components/portfolio/PortfolioNav";
import { PortfolioFooter } from "@/components/portfolio/PortfolioFooter";
import { matchesPortfolioProject } from "@/lib/portfolio";
import {
  ArrowRight,
  ExternalLink,
  Search,
  MessageCircle,
  Mail,
  Linkedin,
  Download,
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

  const filteredFeaturedProjects = useMemo(
    () => featuredProjects.filter((project) => matchesPortfolioProject(project, selectedCategory, searchQuery)),
    [featuredProjects, selectedCategory, searchQuery],
  );

  const filteredOtherProjects = useMemo(
    () => otherProjects.filter((project) => matchesPortfolioProject(project, selectedCategory, searchQuery)),
    [otherProjects, selectedCategory, searchQuery],
  );

  const totalFilteredCount = filteredFeaturedProjects.length + filteredOtherProjects.length;

  const cvPdfUrl = config.profile.cvPdfUrl || "/cv/John_Albarka_Ibrahim_CV.pdf";

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

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.08]">
              I build AI systems that turn messy data into decisions.
            </h1>

            <p className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              {config.profile.name} is an AI Engineer building production RAG backends, multilingual ML systems, and market intelligence tools for teams that need better answers, faster.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
              >
                <span>View selected work</span>
                <ArrowRight className="size-4" />
              </a>

              <a
                href={cvPdfUrl}
                download="John_Albarka_Ibrahim_CV.pdf"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-card hover:bg-muted text-foreground text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="size-4" />
                <span>Download CV</span>
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
              >
                <span>Contact me</span>
              </a>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs font-mono text-muted-foreground">
              <span>10 shipped systems</span>
              <span>65+ tracked listings</span>
              <span>Azure AI Engineer</span>
            </div>
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
            <p className="sr-only">Four practice areas. Ten systems. Select a domain to explore.</p>
          </div>
        </section>

        {/* Section 2: Projects */}
        <section id="projects" className="scroll-mt-24 space-y-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                // SELECTED WORK
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Systems built for real decisions
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                A small selection of production and applied systems. Open a case study to see the problem, my role, the outcome, and the architecture behind it.
              </p>
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
                  {filteredFeaturedProjects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      isCategoryHighlighted={hoveredCategory === p.category}
                      onSelect={setSelectedProject}
                    />
                  ))}
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
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              // EXPERIENCE
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
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              // TECHNICAL FOCUS
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="size-6 text-primary" />
              <span>Where I do my best work</span>
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
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              // CREDENTIALS
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="size-6 text-primary" />
              <span>Education and selected credentials</span>
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
                {certifications.slice(0, 4).map((cert) => {
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
              Building something difficult?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              I’m open to engineering roles, technical conversations, and carefully scoped applied AI work.
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
