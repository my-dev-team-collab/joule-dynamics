import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import config from "@/data/config.json";
import publicRoutes from "@/data/publicRoutes.json";

const SITE_URL = "https://www.jouledynamics.me";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const PERSON_ID = `${SITE_URL}/portfolio#john-albarka-ibrahim`;
const WEBSITE_ID = `${SITE_URL}/#website`;

interface PageMetadata {
  title: string;
  description: string;
  type: "website" | "profile";
  indexable: boolean;
}

function getMetadata(pathname: string): PageMetadata {
  const route = publicRoutes.find((candidate) => candidate.path === pathname);
  if (route) {
    const metadata: PageMetadata = {
      title: route.title,
      description: route.description,
      type: route.type === "profile" ? "profile" : "website",
      indexable: route.indexable,
    };
    return metadata;
  }
  return {
    title: "Page Not Found | Joule Dynamics",
    description: "The requested Joule Dynamics page could not be found.",
    type: "website",
    indexable: false,
  };
}

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    element.dataset.seoManaged = "true";
    document.head.appendChild(element);
  }
  element.content = content;
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    link.dataset.seoManaged = "true";
    document.head.appendChild(link);
  }
  link.href = url;
}

function removeCanonical() {
  document.head.querySelector('link[rel="canonical"][data-seo-managed="true"]')?.remove();
}

function buildStructuredData(pathname: string, metadata: PageMetadata) {
  const person = {
    "@type": "Person",
    "@id": PERSON_ID,
    name: config.profile.name,
    jobTitle: config.profile.role,
    url: `${SITE_URL}/portfolio`,
    email: "john@jouledynamics.me",
    sameAs: [
      "https://www.linkedin.com/in/john-albarka-ibrahim/",
      "https://github.com/JohnJodinho",
      "https://huggingface.co/JohnAlbarkaIbrahim",
    ],
    worksFor: { "@id": ORGANIZATION_ID },
  };
  const organization = {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "Joule Dynamics",
    url: SITE_URL,
    logo: `${SITE_URL}/joule-dynamics.svg`,
    founder: { "@id": PERSON_ID },
  };
  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "Joule Dynamics",
    url: SITE_URL,
    publisher: { "@id": ORGANIZATION_ID },
  };
  const graph: Record<string, unknown>[] = [organization, person, website];

  if (pathname === "/portfolio") {
    graph.push({
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/portfolio#profile`,
      url: `${SITE_URL}/portfolio`,
      name: metadata.title,
      description: metadata.description,
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": PERSON_ID },
    });
  }

  if (pathname === "/") {
    graph.push({
      "@type": "WebPage",
      "@id": `${SITE_URL}/#homepage`,
      url: SITE_URL,
      name: metadata.title,
      description: metadata.description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
    });
  } else if (pathname !== "/portfolio") {
    graph.push({
      "@type": "WebPage",
      "@id": `${SITE_URL}${pathname}#page`,
      url: `${SITE_URL}${pathname}`,
      name: metadata.title,
      description: metadata.description,
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": ORGANIZATION_ID },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export default function SeoManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    const metadata = getMetadata(pathname);
    const isKnownRoute = publicRoutes.some((route) => route.path === pathname);
    const canonicalUrl = isKnownRoute
      ? `${SITE_URL}${pathname === "/" ? "" : pathname}`
      : null;

    document.title = metadata.title;
    setMeta("name", "description", metadata.description);
    setMeta("name", "robots", metadata.indexable ? "index, follow" : "noindex, nofollow");
    setMeta("name", "author", "John Albarka Ibrahim | Joule Dynamics");
    setMeta("property", "og:title", metadata.title);
    setMeta("property", "og:description", metadata.description);
    setMeta("property", "og:type", metadata.type);
    setMeta("property", "og:image", `${SITE_URL}/joule-dynamics.svg`);
    if (canonicalUrl) {
      setMeta("property", "og:url", canonicalUrl);
      setCanonical(canonicalUrl);
    } else {
      removeCanonical();
    }
    setMeta("property", "og:site_name", "Joule Dynamics");
    setMeta("name", "twitter:title", metadata.title);
    setMeta("name", "twitter:description", metadata.description);
    setMeta("name", "twitter:image", `${SITE_URL}/joule-dynamics.svg`);
    const existing = document.head.querySelector('script[data-seo-jsonld="true"]');
    existing?.remove();
    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.dataset.seoJsonld = "true";
    jsonLd.textContent = JSON.stringify(buildStructuredData(pathname, metadata));
    document.head.appendChild(jsonLd);
  }, [pathname]);

  return null;
}
