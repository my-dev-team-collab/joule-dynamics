/**
 * RealEstatePage.tsx
 * Dedicated page for the Real Estate Rate Monitor at /real-estate.
 *
 * Architecture (post-refactor):
 *  - Filter state lives in URL search params (shareable/restorable).
 *  - A separate once-fetched `allProperties` query populates filter dropdowns
 *    so options are always the full universe regardless of active filters.
 *  - Every filter change triggers a new server-side Supabase query using
 *    .eq() / .in() / .gte() / .lte() — no client-side in-memory filtering.
 *  - get_dashboard_kpis() RPC is called with the active filter params so that
 *    ALL four KPI cards (including Rate Changes 7d) reflect the filtered set.
 *  - A multi-select searchable checkbox dropdown for the "Properties" filter
 *    sits at the front of the Global Filters bar.
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { SystemStatusBar } from "@/components/layout/SystemStatusBar";
import { LogoIcon } from "@/components/ui/Logo";
import CredentialFooter from "@/components/layout/CredentialFooter";
import RealEstateDemo from "@/components/solutions/RealEstateDemo";
import PropertyMap from "@/components/solutions/PropertyMap";
import ServiceTierSection from "@/components/solutions/ServiceTierSection";
import RealEstateChatWidget from "@/components/solutions/RealEstateChatWidget";
import ScrapeHealthStrip from "@/components/solutions/ScrapeHealthStrip";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Building2, ChevronDown, Search, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RealEstateKPIs {
  properties_tracked: number;
  rate_changes_7d: number;
  spikes_7d: number;
  tracking_since: string | null;
  last_scrape_status: Record<string, string> | null;
}

interface PropertyMeta {
  id: string;
  name: string;
  market: string;
  platform: string;
  bedrooms: number | null;
}

// ── Multi-select Searchable Checkbox Dropdown ─────────────────────────────────

interface PropertyMultiSelectProps {
  allProperties: PropertyMeta[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function PropertyMultiSelect({ allProperties, selectedIds, onChange }: PropertyMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

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

  const filtered = allProperties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.market.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectAll = () => onChange(allProperties.map(p => p.id));
  const clearAll = () => onChange([]);

  const label = selectedIds.length === 0
    ? "All Properties"
    : selectedIds.length === 1
      ? allProperties.find(p => p.id === selectedIds[0])?.name ?? "1 selected"
      : `${selectedIds.length} selected`;

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <label className="text-[10px] text-muted-foreground">Properties</label>
      <div className="relative">
        <button
          id="property-multiselect-trigger"
          type="button"
          onClick={() => setOpen(v => !v)}
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-colors min-w-[130px] max-w-[200px] ${
            selectedIds.length > 0
              ? "border-primary/60 bg-primary/5 text-foreground"
              : "border-border bg-background text-foreground"
          }`}
        >
          <span className="truncate flex-1 text-left">{label}</span>
          <ChevronDown className={`size-3 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-md border border-border bg-card shadow-lg">
            {/* Search */}
            <div className="flex items-center gap-1.5 border-b border-border px-2 py-1.5">
              <Search className="size-3 text-muted-foreground shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search properties..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* Select all / Clear */}
            <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
              <button
                type="button"
                onClick={selectAll}
                className="text-[10px] text-primary hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* List */}
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">No properties found.</p>
              ) : (
                filtered.map(p => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/40 ${checked ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${checked ? "border-primary bg-primary" : "border-border bg-background"}`}>
                        {checked && <Check className="size-2.5 text-primary-foreground" />}
                      </span>
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="shrink-0 text-[9px] text-muted-foreground/60">{p.market}</span>
                    </button>
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RealEstatePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Read filter state from URL ─────────────────────────────────────────────
  const filterPlatform    = searchParams.get("platform") || "all";
  const filterMarket      = searchParams.get("market") || "all";
  const filterTracked     = searchParams.get("tracked") || "tracked";
  const filterStartDate   = searchParams.get("start") ?? null;
  const filterEndDate     = searchParams.get("end") ?? null;
  const filterBedrooms    = searchParams.get("bedrooms") || "all";
  const filterPropertyIds = searchParams.get("properties")
    ? searchParams.get("properties")!.split(",").filter(Boolean)
    : [] as string[];

  // ── Write helpers ──────────────────────────────────────────────────────────
  const setFilter = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      if (value === null || (value === "all" && key !== "tracked" && key !== "start" && key !== "end")) {
        prev.delete(key);
      } else {
        prev.set(key, value);
      }
      return prev;
    });
  }, [setSearchParams]);

  const setPropertyFilter = useCallback((ids: string[]) => {
    setSearchParams(prev => {
      if (ids.length === 0) {
        prev.delete("properties");
      } else {
        prev.set("properties", ids.join(","));
      }
      return prev;
    });
  }, [setSearchParams]);

  const clearAllFilters = useCallback(() => {
    setSearchParams(prev => {
      prev.delete("market");
      prev.delete("platform");
      prev.delete("bedrooms");
      prev.delete("tracked");
      prev.delete("start");
      prev.delete("end");
      prev.delete("properties");
      return prev;
    });
  }, [setSearchParams]);

  const hasActiveFilters =
    filterPlatform !== "all" ||
    filterMarket !== "all" ||
    filterBedrooms !== "all" ||
    filterTracked !== "tracked" ||
    !!filterStartDate ||
    !!filterEndDate ||
    filterPropertyIds.length > 0;

  // ── State ──────────────────────────────────────────────────────────────────
  const [kpis, setKpis]           = useState<RealEstateKPIs | null>(null);
  const [data, setData]           = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [allProperties, setAllProperties] = useState<PropertyMeta[]>([]);

  // ── Once-only: fetch full property list for filter dropdown options ─────────
  useEffect(() => {
    supabase
      .from("properties")
      .select("id, name, market, platform, bedrooms")
      .eq("is_active", true)
      .order("market")
      .order("name")
      .then(({ data: rows }) => {
        if (rows) setAllProperties(rows as PropertyMeta[]);
      });
  }, []);

  // Derive distinct options from allProperties (not from filtered data)
  const markets        = [...new Set(allProperties.map(p => p.market).filter(Boolean))].sort();
  const platforms      = [...new Set(allProperties.map(p => p.platform).filter(Boolean))].sort();
  const bedroomOptions = [...new Set(
    allProperties.map(p => p.bedrooms).filter((b): b is number => b !== null)
  )].sort((a, b) => a - b);

  // ── Server-side filtered fetch — re-fires on every filter change ───────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Build filtered v_rate_volatility query
        let query = supabase
          .from("v_rate_volatility")
          .select("*")
          .order("recorded_at", { ascending: false })
          .order("stay_date",   { ascending: false });

        if (filterMarket !== "all")          query = query.eq("market",   filterMarket);
        if (filterPlatform !== "all")        query = query.eq("platform", filterPlatform);
        if (filterBedrooms !== "all")        query = query.eq("bedrooms", Number(filterBedrooms));
        if (filterTracked === "tracked")     query = query.eq("is_active", true);
        if (filterTracked === "untracked")   query = query.eq("is_active", false);
        if (filterPropertyIds.length > 0)   query = query.in("property_id", filterPropertyIds);
        if (filterStartDate)                 query = query.gte("stay_date", filterStartDate);
        if (filterEndDate)                   query = query.lte("stay_date", filterEndDate);

        // Build parameterized RPC call
        const rpcParams: Record<string, unknown> = {
          p_market:        filterMarket !== "all"        ? filterMarket        : null,
          p_platform:      filterPlatform !== "all"      ? filterPlatform      : null,
          p_bedrooms:      filterBedrooms !== "all"      ? Number(filterBedrooms) : null,
          p_is_active:     filterTracked === "all"       ? null
                         : filterTracked === "tracked"   ? true : false,
          p_property_ids:  filterPropertyIds.length > 0  ? filterPropertyIds  : null,
          p_start_date:    filterStartDate ?? null,
          p_end_date:      filterEndDate   ?? null,
        };

        const [kpiRes, dataRes] = await Promise.all([
          supabase.rpc("get_dashboard_kpis", rpcParams),
          query,
        ]);

        if (kpiRes.data) {
          const d = kpiRes.data as Record<string, unknown>;
          setKpis((d.real_estate as RealEstateKPIs) ?? null);
        }
        if (dataRes.data) {
          setData(dataRes.data);
        }
      } catch (e) {
        console.error("Unexpected error fetching dashboard data:", e);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
    // Stringify array to get a stable dependency value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMarket, filterPlatform, filterBedrooms, filterTracked,
      filterStartDate, filterEndDate, filterPropertyIds.join(",")]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const statusColor = (s: string | null) =>
    s === "success" || s === "completed" ? "text-green-500" : "";

  const renderSkeleton = (count = 4) => (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${count} gap-4 mb-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 border border-border bg-card/50 rounded-lg animate-pulse">
          <div className="h-4 w-20 bg-muted/60 mb-2 rounded" />
          <div className="h-6 w-12 bg-muted/40 rounded" />
        </div>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <SystemStatusBar />

      {/* Sticky page header */}
      <div className="sticky top-12 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Building2 className="size-4 text-primary" />
          </div>
          <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
            Real Estate Rate Monitor
          </span>
          <a
            href="/live-systems"
            className="ml-auto text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            ← All Live Systems
          </a>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-12">

        {/* Header */}
        <div className="max-w-3xl pt-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
            <LogoIcon className="h-7 w-auto shrink-0" />
            Real Estate Rate Monitor
          </h1>
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            Live nightly rate intelligence across short-term rental markets.
            We track competitor pricing, detect rate volatility, and surface booking availability in real time by checking each listing up to 4× daily.
            Built to track NYC and Miami rate dynamics ahead of the 2026 World Cup Final. Expanding to new markets is a config change and not a full rebuild.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-col gap-2 p-4 border border-border bg-card/50 rounded-lg shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Global Filters</span>
          <div className="flex flex-wrap gap-3 items-end">

            {/* ── Multi-select property filter (Parent) ── */}
            {allProperties.length > 0 && (
              <PropertyMultiSelect
                allProperties={allProperties}
                selectedIds={filterPropertyIds}
                onChange={setPropertyFilter}
              />
            )}

            {markets.length > 1 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground">Market</label>
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterMarket || "all"}
                  onChange={e => setFilter("market", e.target.value)}
                >
                  <option value="all">All Markets</option>
                  {markets.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {platforms.length > 1 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground">Platform</label>
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterPlatform}
                  onChange={e => setFilter("platform", e.target.value)}
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Status</label>
              <select
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={filterTracked}
                onChange={e => setFilter("tracked", e.target.value)}
              >
                <option value="tracked">Currently Tracked</option>
                <option value="untracked">Untracked/Removed</option>
                <option value="all">All Historical</option>
              </select>
            </div>

            {bedroomOptions.length > 1 && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground">Bedrooms</label>
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterBedrooms}
                  onChange={e => setFilter("bedrooms", e.target.value)}
                >
                  <option value="all">All Bedrooms</option>
                  {bedroomOptions.map(b => <option key={b} value={String(b)}>{b} BR</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Stay Dates</label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterStartDate || ""}
                  onChange={e => setFilter("start", e.target.value || null)}
                  title="Start Date"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <input
                  type="date"
                  className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterEndDate || ""}
                  onChange={e => setFilter("end", e.target.value || null)}
                  title="End Date"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col gap-1 justify-end">
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2 py-1 h-[26px]"
                  onClick={clearAllFilters}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <ErrorBoundary fallbackMessage="Failed to load Real Estate KPIs.">
          {loading || !kpis ? renderSkeleton(4) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard label="Properties Tracked" value={kpis.properties_tracked} />
              <KPICard label="Rate Changes (7d)"  value={kpis.rate_changes_7d} />
              <KPICard label="25%+ Spikes (7d)"   value={kpis.spikes_7d} />

              {/* Per-platform scrape status */}
              <div className="flex flex-col p-4 bg-card border border-border rounded-lg shadow-sm">
                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Scrape Status</span>
                <div className="flex flex-col gap-1 mt-1">
                  {kpis.last_scrape_status && Object.keys(kpis.last_scrape_status).length > 0 ? (
                    Object.entries(kpis.last_scrape_status).map(([platform, status]) => (
                      <div key={platform} className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground capitalize">{platform}</span>
                        <span className={`text-sm font-semibold ${statusColor(status)}`}>{status}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-2xl font-semibold text-muted-foreground">Pending</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </ErrorBoundary>

        {/* Main Dashboard Widget */}
        <ErrorBoundary fallbackMessage="Failed to load Rate Monitor dashboard.">
          <div className="border border-border rounded-lg overflow-hidden bg-card/30">
            <RealEstateDemo
              data={data}
              loading={loading}
            />
          </div>
        </ErrorBoundary>

        {/* Property Map */}
        <ErrorBoundary fallbackMessage="Failed to load property map.">
          <PropertyMap
            data={data}
            loading={loading}
            totalProperties={kpis?.properties_tracked}
          />
        </ErrorBoundary>

        {/* Service Tier Section */}
        <ServiceTierSection />

      </main>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <ScrapeHealthStrip />

        <RealEstateChatWidget />

        <CredentialFooter />
      </div>
    </>
  );
}

function KPICard({ label, value, valueClass = "" }: { label: string; value: string | number; valueClass?: string }) {
  return (
    <div className="p-4 border border-border bg-card/50 rounded-lg flex flex-col justify-center shadow-sm">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-xl font-bold text-foreground capitalize ${valueClass}`}>{value}</span>
    </div>
  );
}
