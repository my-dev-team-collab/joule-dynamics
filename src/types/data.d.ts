// ─────────────────────────────────────────────────────────────────────────────
// Existing portfolio interfaces (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

export interface ServiceMatrix {
  id: string;
  title: string;
  description: string;
  stack: string[];
  roiVector: string;
}

export interface ProjectLab {
  id: string;
  title: string;
  category: "Agentic RAG" | "Enterprise Scraping" | "Model Fine-Tuning";
  description: string;
  metrics: string[];
  liveUrl: string;
  buttonLabel: string;
  architecture: string[];
  terminalPayload: string;
}

export interface OperationalDeployment {
  id: string;
  role: string;
  organization: string;
  timeline: string;
  metrics: string[];
}

export interface ChassisTier {
  title: string;
  subtitle: string;
  badge: string;
  accent?: boolean;
}

export interface PortfolioProject {
  id: string;
  rank: number;
  title: string;
  subtitle: string;
  category: "Agentic RAG" | "Model Training & Fine-Tuning" | "Data & Web Intelligence" | "Embedded & Robotics";
  status: "Live System" | "Live Pilot" | "Production" | "Fine-Tuned Model" | "Open Source" | "Applied Research";
  highlightMetric: string;
  githubUrl: string;
  liveUrl?: string;
  techStack: string[];
  challenge: string;
  solutionLabel: string;
  solution: string;
  beforeAfter: {
    before: string;
    after: string;
  };
  resultsLabel: string;
  results: string[];
  architectureDiagram?: string;
  isFeatured?: boolean;
  workshopMotif?: string;
  bladeCode?: string;
  shortName?: string;
  chassisTiers?: ChassisTier[];
}

export interface CareerExperience {
  id: string;
  role: string;
  organization: string;
  location: string;
  timeline: string;
  achievements: string[];
}

export interface ProfessionalCertification {
  id: string;
  title: string;
  issuer: string;
  year: string;
  code?: string;
}

export interface AcademicEducation {
  degree: string;
  honors: string;
  institution: string;
  timeline: string;
  gpa: string;
}

export interface SkillCategoryGroup {
  category: string;
  skills: string[];
}

export interface LinkNode {
  id: string;
  label: string;
  href: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Solutions Showcase interfaces (revamp additions)
// ─────────────────────────────────────────────────────────────────────────────

export type MetricType = "revenue" | "time" | "conversion" | "market" | "other";

export interface ROIMetric {
  label: string;
  value: string;
  context?: string;
  metricType: MetricType;
  isBenchmark: boolean;
}

export interface DemoAsset {
  kind: "video" | "screenshot" | "interactive";
  url: string;
  posterImage?: string;
  altText: string;
  durationSeconds?: number;
  fallbackNote?: string;
}

export interface Solution {
  id: string;
  order: number;
  isPublished: boolean;
  category: string;
  title: string;
  problemStatement: string;
  solutionDescription: string;
  demo: DemoAsset;
  roiMetrics: ROIMetric[];
  techStackTags: string[];
  ctaLabel: string;
  ctaLink: string;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "select" | "textarea";
  required: boolean;
  options?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified root config type (extends existing keys with new ones)
// ─────────────────────────────────────────────────────────────────────────────

export interface RootConfig {
  // Existing keys
  services: ServiceMatrix[];
  deployments: OperationalDeployment[];
  labs: ProjectLab[];
  links: LinkNode[];
  projects?: PortfolioProject[];

  // Recruiter Profile & Experience Additions
  profile?: {
    name: string;
    role: string;
    headline: string;
    subheadline: string;
    cvUrl: string;
    location: string;
  };
  experience?: CareerExperience[];
  certifications?: ProfessionalCertification[];
  education?: AcademicEducation;
  groupedSkills?: SkillCategoryGroup[];

  // Revamp additions
  devHub: {
    badgeLabel: string;
    tooltip: string;
  };
  meta: {
    title: string;
    description: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    primaryCtaLabel: string;
    primaryCtaLink: string;
    secondaryCtaLabel?: string;
    secondaryCtaLink?: string;
  };
  sections: Array<{
    id: string;
    label: string;
  }>;
  solutions: Solution[];
  howItWorks: Array<{
    step: number;
    title: string;
    description: string;
  }>;
  about: {
    headline: string;
    bio: string;
    credentials: string[];
    photoUrl?: string;
  };
  contact: {
    headline: string;
    subheadline: string;
    fields: FormField[];
    submitLabel: string;
    trustLine: string;
    privacyLine?: string;
  };
  socialProof: {
    founderNote: {
      quote: string;
      author: string;
      role: string;
    };
    maxTestimonialsToShow: number;
    testimonials: Array<{
      quote: string;
      author: string;
      role: string;
      company?: string;
    }>;
  };
}