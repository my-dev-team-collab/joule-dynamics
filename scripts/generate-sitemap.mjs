import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const siteUrl = "https://www.jouledynamics.me";
const routes = JSON.parse(
  await readFile(resolve(root, "src/data/publicRoutes.json"), "utf8"),
);
const urls = routes
  .filter((route) => route.indexable)
  .map(
    (route) =>
      `  <url>\n    <loc>${siteUrl}${route.path === "/" ? "" : route.path}</loc>\n  </url>`,
  )
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

await mkdir(resolve(root, "public"), { recursive: true });
await writeFile(resolve(root, "public/sitemap.xml"), sitemap);
