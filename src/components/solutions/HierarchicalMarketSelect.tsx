import React, { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, ChevronRight, Check, Search, Globe } from "lucide-react";
import { getMarketCountry, getCountryFlag, getMarketFlag } from "@/lib/marketConfig";

export interface PropertyMeta {
  id: string;
  name: string;
  market: string;
  platform: string;
  bedrooms: number | null;
}

interface HierarchicalMarketSelectProps {
  allProperties: PropertyMeta[];
  selectedCountry: string;
  selectedMarket: string;
  onSelect: (country: string, market: string) => void;
}

export default function HierarchicalMarketSelect({
  allProperties,
  selectedCountry,
  selectedMarket,
  onSelect,
}: HierarchicalMarketSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Group properties by country and then market
  const hierarchy = useMemo(() => {
    const countryMap = new Map<string, {
      country: string;
      totalProps: number;
      markets: Map<string, number>;
    }>();

    for (const p of allProperties) {
      if (!p.market) continue;
      const country = getMarketCountry(p.market);
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          country,
          totalProps: 0,
          markets: new Map(),
        });
      }
      const entry = countryMap.get(country)!;
      entry.totalProps += 1;
      entry.markets.set(p.market, (entry.markets.get(p.market) || 0) + 1);
    }

    return Array.from(countryMap.values())
      .sort((a, b) => a.country.localeCompare(b.country))
      .map(entry => ({
        country: entry.country,
        totalProps: entry.totalProps,
        markets: Array.from(entry.markets.entries())
          .map(([market, count]) => ({ market, count }))
          .sort((a, b) => a.market.localeCompare(b.market)),
      }));
  }, [allProperties]);

  // Expanded countries state (default expand all or the selected country)
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    hierarchy.forEach(h => {
      // Auto-expand all countries initially like Power BI matrix default
      initial[h.country] = true;
    });
    return initial;
  });

  // Ensure selected country is expanded when selectedMarket changes
  useEffect(() => {
    if (selectedMarket !== "all") {
      const country = getMarketCountry(selectedMarket);
      if (country) {
        setExpandedCountries(prev => ({ ...prev, [country]: true }));
      }
    } else if (selectedCountry !== "all") {
      setExpandedCountries(prev => ({ ...prev, [selectedCountry]: true }));
    }
  }, [selectedMarket, selectedCountry]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleExpand = (country: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCountries(prev => ({ ...prev, [country]: !prev[country] }));
  };

  const handleSelectAll = () => {
    onSelect("all", "all");
    setOpen(false);
  };

  const handleSelectCountry = (country: string) => {
    onSelect(country, "all");
    setOpen(false);
  };

  const handleSelectMarket = (country: string, market: string) => {
    onSelect(country, market);
    setOpen(false);
  };

  // Compute trigger button label
  const triggerLabel = useMemo(() => {
    if (selectedMarket !== "all") {
      return (
        <span className="flex items-center gap-1.5 truncate">
          <span>{getMarketFlag(selectedMarket)}</span>
          <span className="truncate">{selectedMarket}</span>
        </span>
      );
    }
    if (selectedCountry !== "all") {
      return (
        <span className="flex items-center gap-1.5 truncate">
          <span>{getCountryFlag(selectedCountry)}</span>
          <span className="truncate">{selectedCountry} (All)</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 truncate">
        <Globe className="size-3 text-muted-foreground shrink-0" />
        <span className="truncate">All Markets</span>
      </span>
    );
  }, [selectedCountry, selectedMarket]);

  const isAllSelected = selectedCountry === "all" && selectedMarket === "all";

  // Filter hierarchy based on search query
  const filteredHierarchy = useMemo(() => {
    if (!search.trim()) return hierarchy;
    const q = search.toLowerCase();
    return hierarchy
      .map(group => {
        const countryMatches = group.country.toLowerCase().includes(q);
        const matchingMarkets = group.markets.filter(m => m.market.toLowerCase().includes(q));
        if (countryMatches || matchingMarkets.length > 0) {
          return {
            ...group,
            markets: countryMatches ? group.markets : matchingMarkets,
          };
        }
        return null;
      })
      .filter((g): g is typeof hierarchy[number] => g !== null);
  }, [hierarchy, search]);

  const hasSelection = selectedCountry !== "all" || selectedMarket !== "all";

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-[10px] text-muted-foreground">Market / Region</label>
      <div className="relative">
        <button
          id="hierarchical-market-trigger"
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors min-w-[150px] max-w-[220px] ${
            hasSelection
              ? "border-primary/60 bg-primary/5 text-foreground font-medium"
              : "border-border bg-background text-foreground"
          }`}
          title="Filter by Country or Market"
        >
          <div className="flex-1 text-left truncate">{triggerLabel}</div>
          <ChevronDown
            className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 w-72 rounded-md border border-border bg-card shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
            {/* Search */}
            {hierarchy.length > 0 && (
              <div className="flex items-center gap-1.5 border-b border-border px-2.5 py-1.5 bg-muted/20">
                <Search className="size-3 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country or market..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* List options */}
            <div className="max-h-72 overflow-y-auto py-1 assistant-scrollbar text-xs">
              {/* Global / All Option */}
              {!search && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left hover:bg-muted/50 transition-colors ${
                    isAllSelected ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="size-3.5 text-muted-foreground shrink-0" />
                    <span>All Markets (Global)</span>
                  </div>
                  {isAllSelected && <Check className="size-3 text-primary shrink-0" />}
                </button>
              )}

              {/* Country Groups (Power BI Matrix style) */}
              {filteredHierarchy.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground">
                  No matching regions or markets
                </div>
              ) : (
                filteredHierarchy.map(group => {
                  const isCountryExpanded = expandedCountries[group.country] ?? true;
                  const isCountrySelected = selectedCountry === group.country && selectedMarket === "all";

                  return (
                    <div key={group.country} className="border-t border-border/30 first:border-t-0">
                      {/* Country Node Header */}
                      <div
                        className={`flex items-center justify-between px-2 py-1.5 hover:bg-muted/40 transition-colors group cursor-pointer ${
                          isCountrySelected ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                        }`}
                      >
                        {/* Expand/Collapse Chevron Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleExpand(group.country, e)}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors mr-1"
                          title={isCountryExpanded ? "Collapse markets" : "Expand markets"}
                        >
                          {isCountryExpanded ? (
                            <ChevronDown className="size-3" />
                          ) : (
                            <ChevronRight className="size-3" />
                          )}
                        </button>

                        {/* Country Select Area */}
                        <div
                          className="flex-1 flex items-center justify-between min-w-0 pr-1.5"
                          onClick={() => handleSelectCountry(group.country)}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-sm">{getCountryFlag(group.country)}</span>
                            <span className="font-semibold truncate">{group.country}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {group.markets.length} {group.markets.length === 1 ? "market" : "markets"}
                            </span>
                            {isCountrySelected && <Check className="size-3 text-primary shrink-0" />}
                          </div>
                        </div>
                      </div>

                      {/* Child Markets (Indented Matrix View) */}
                      {isCountryExpanded && (
                        <div className="bg-muted/10 py-0.5 pl-6 pr-1 border-l-2 border-border/40 ml-4 mb-1 space-y-0.5">
                          {group.markets.map(m => {
                            const isMarketSelected = selectedMarket === m.market;

                            return (
                              <button
                                key={m.market}
                                type="button"
                                onClick={() => handleSelectMarket(group.country, m.market)}
                                className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                                  isMarketSelected
                                    ? "bg-primary/15 text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span>{getMarketFlag(m.market)}</span>
                                  <span className="truncate">{m.market}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] opacity-75 font-mono">
                                    {m.count} {m.count === 1 ? "prop" : "props"}
                                  </span>
                                  {isMarketSelected && <Check className="size-3 text-primary shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
