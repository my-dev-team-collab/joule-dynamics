/**
 * marketConfig.ts
 * Scalable market, country, and regional metadata registry.
 * Built for N-market scaling across multiple countries and continents.
 */

export interface MarketInfo {
  market: string;
  country: string;
  region: string;
  flag: string;
}

export const MARKET_METADATA: Record<string, { country: string; region: string; flag: string }> = {
  "NYC/NJ Metro": { country: "United States", region: "North America", flag: "🇺🇸" },
  "Miami":        { country: "United States", region: "North America", flag: "🇺🇸" },
  "Lagos":        { country: "Nigeria",       region: "West Africa",   flag: "🇳🇬" },
  "Abuja":        { country: "Nigeria",       region: "West Africa",   flag: "🇳🇬" },
};

export function getMarketCountry(market: string): string {
  return MARKET_METADATA[market]?.country || "Other";
}

export function getMarketFlag(market: string): string {
  return MARKET_METADATA[market]?.flag || "🌐";
}

export function getMarketRegion(market: string): string {
  return MARKET_METADATA[market]?.region || "Global";
}

export const COUNTRY_REGIONS: Record<string, { flag: string; defaultCenter: [number, number]; defaultZoom: number }> = {
  "United States": { flag: "🇺🇸", defaultCenter: [-77.0369, 33.5], defaultZoom: 4.5 },
  "Nigeria":       { flag: "🇳🇬", defaultCenter: [5.4682, 7.7627], defaultZoom: 6 },
};

export function getCountryFlag(country: string): string {
  return COUNTRY_REGIONS[country]?.flag || "🌐";
}
