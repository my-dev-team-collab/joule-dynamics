import type { PortfolioProject } from "@/types/data";

export function matchesPortfolioProject(
  project: PortfolioProject,
  selectedCategory: string,
  searchQuery: string,
): boolean {
  if (selectedCategory !== "All" && project.category !== selectedCategory) {
    return false;
  }

  const query = searchQuery.trim().toLowerCase();
  if (!query) return true;

  return [
    project.title,
    project.displayTitle,
    project.subtitle,
    project.businessUseCase,
    project.challenge,
    project.myRole,
    project.scale,
    ...project.techStack,
  ]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(query));
}

