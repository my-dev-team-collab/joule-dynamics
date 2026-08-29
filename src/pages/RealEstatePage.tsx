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
import { ChevronDown, Search, Check, ArrowLeft, Activity } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RealEstateKPIs {
  properties_tracked: number;
  rate_changes_7d: number;
  spikes_7d: number;
  tracking_since: string | null;
  last_scrape_status: Record<string, string> | null;
}

interface ScrapeHealthRow {
  job_type: string;
  platform: string;
  last_status: string;
  last_started_at: string;
  last_finished_at: string | null;
  last_duration_seconds: number | null;
  items_attempted: number;
  items_succeeded: number;
  items_failed: number;
  is_failed: boolean;
  high_failure_rate: boolean;
  has_blocks: boolean;
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
  const [scrapeHealth, setScrapeHealth] = useState<ScrapeHealthRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [allProperties, setAllProperties] = useState<PropertyMeta[]>([]);

  // ── Once-only: fetch distinct property metadata for filter dropdown options ──
  // Uses v_rate_volatility (has anon SELECT grant) rather than the properties
  // table directly (which may be protected by RLS). This gives us the full
  // universe of tracked properties for populating the filter controls.
  useEffect(() => {
    supabase
      .from("v_rate_volatility")
      .select("property_id, property_name, market, platform, bedrooms, is_active")
      // No is_active filter here — dropdown options should show ALL properties
      // (active and previously tracked) so Status filter works correctly.
      .then(({ data: rows }) => {
        if (!rows) return;
        // Deduplicate by property_id to get one entry per property
        const seen = new Map<string, PropertyMeta>();
        for (const r of rows) {
          if (!seen.has(r.property_id)) {
            seen.set(r.property_id, {
              id: r.property_id,
              name: r.property_name,
              market: r.market,
              platform: r.platform,
              bedrooms: r.bedrooms,
            });
          }
        }
        const sorted = Array.from(seen.values()).sort((a, b) =>
          a.market.localeCompare(b.market) || a.name.localeCompare(b.name)
        );
        setAllProperties(sorted);
      });
  }, []);

  // Realtime subscription to scrape_runs for live ingestion observability
  useEffect(() => {
    const channel = supabase
      .channel('realestate:scrape_health_monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scrape_runs' }, () => {
        supabase.from("v_scrape_health").select("*").then(({ data: rows }) => {
          if (rows) setScrapeHealth(rows as unknown as ScrapeHealthRow[]);
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
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

        const [kpiRes, dataRes, healthRes] = await Promise.all([
          supabase.rpc("get_dashboard_kpis", rpcParams),
          query,
          supabase.from("v_scrape_health").select("*"),
        ]);

        if (kpiRes.data) {
          const d = kpiRes.data as Record<string, unknown>;
          setKpis((d.real_estate as RealEstateKPIs) ?? null);
        }
        if (dataRes.data) {
          setData(dataRes.data);
        }
        if (healthRes.data) {
          setScrapeHealth(healthRes.data as unknown as ScrapeHealthRow[]);
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
      <div className="sticky top-12 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <a
              href="/live-systems"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="size-3.5" />
              <span>Live Systems</span>
            </a>
            <span className="text-muted-foreground/40 font-sans">/</span>
            <span className="text-foreground font-semibold uppercase tracking-wider text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-none">
              Real Estate Rate Monitor
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-0.5 rounded border border-border/50">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>LIVE FEED</span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-28 sm:pb-20 space-y-8 sm:space-y-12">

        {/* Header */}
        <div className="max-w-3xl pt-2 sm:pt-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-3 pt-2">
            <LogoIcon className="h-6 sm:h-7 w-auto shrink-0" />
            Real Estate Rate Monitor
          </h1>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground leading-relaxed">
            Live nightly rate intelligence across short-term rental markets.
            We track competitor pricing, detect rate volatility, and surface booking availability in real time by checking each listing up to 4× daily.
            Built to track NYC and Miami rate dynamics ahead of the 2026 World Cup Final. Expanding to new markets is a config change and not a full rebuild.
          </p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 border border-border bg-card/50 rounded-lg shadow-sm">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Global Filters</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap gap-2.5 sm:gap-3 items-end">

            {/* ── Multi-select property filter (Parent) ── */}
            {allProperties.length > 0 && (
              <div className="w-full sm:w-auto">
                <PropertyMultiSelect
                  allProperties={allProperties}
                  selectedIds={filterPropertyIds}
                  onChange={setPropertyFilter}
                />
              </div>
            )}

            {markets.length > 1 && (
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] text-muted-foreground">Market</label>
                <select
                  className="w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterMarket || "all"}
                  onChange={e => setFilter("market", e.target.value)}
                >
                  <option value="all">All Markets</option>
                  {markets.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}

            {platforms.length > 1 && (
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] text-muted-foreground">Platform</label>
                <select
                  className="w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterPlatform}
                  onChange={e => setFilter("platform", e.target.value)}
                >
                  <option value="all">All Platforms</option>
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[10px] text-muted-foreground">Status</label>
              <select
                className="w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                value={filterTracked}
                onChange={e => setFilter("tracked", e.target.value)}
              >
                <option value="tracked">Currently Tracked</option>
                <option value="untracked">Untracked/Removed</option>
                <option value="all">All Historical</option>
              </select>
            </div>

            {bedroomOptions.length > 1 && (
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <label className="text-[10px] text-muted-foreground">Bedrooms</label>
                <select
                  className="w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  value={filterBedrooms}
                  onChange={e => setFilter("bedrooms", e.target.value)}
                >
                  <option value="all">All Bedrooms</option>
                  {bedroomOptions.map(b => <option key={b} value={String(b)}>{b} BR</option>)}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1 w-full sm:w-auto col-span-1 sm:col-span-2 md:col-span-1">
              <label className="text-[10px] text-muted-foreground">Stay Dates</label>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5">
                <input
                  type="date"
                  className="w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                  value={filterStartDate || ""}
                  onChange={e => setFilter("start", e.target.value || null)}
                  title="Start Date"
                />
                <input
                  type="date"
                  className="w-full sm:w-auto rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-0"
                  value={filterEndDate || ""}
                  onChange={e => setFilter("end", e.target.value || null)}
                  title="End Date"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex flex-col gap-1 justify-end w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2.5 py-1 h-[28px] font-medium"
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
          {loading || !kpis ? renderSkeleton(4) : (() => {
            // Observability & Ingestion Health Derivation from v_scrape_health
            const reHealth = scrapeHealth.find(r => 
              r.job_type === 'real_estate' || 
              r.job_type === 'price_monitor' || 
              r.job_type === 'real_estate_all'
            ) || scrapeHealth[0];

            const isSuccess = reHealth 
              ? (reHealth.last_status?.toLowerCase() === 'success' || reHealth.last_status?.toLowerCase() === 'completed') && !reHealth.is_failed && !reHealth.high_failure_rate
              : true;
            const isRunning = reHealth?.last_status?.toLowerCase() === 'running' || reHealth?.last_status?.toLowerCase() === 'in_progress';
            const isFailed = reHealth ? (reHealth.is_failed || reHealth.high_failure_rate || reHealth.last_status?.toLowerCase() === 'failed') : false;

            const statusLabel = isRunning ? "Syncing..." : (isFailed ? "Degraded" : (isSuccess ? "Operational" : "Healthy"));
            const statusColorText = isRunning ? "text-blue-400" : (isFailed ? "text-red-400" : "text-emerald-500");
            const pulseColor = isRunning ? "bg-blue-400" : (isFailed ? "bg-red-400" : "bg-emerald-500");

            const lastCheckTime = reHealth?.last_started_at || (data.length > 0 ? data[0].recorded_at : null);
            const freshnessText = lastCheckTime ? `Refreshed ${timeAgo(lastCheckTime)}` : "Live (4× Daily)";
            
            const coverageRatio = reHealth && reHealth.items_attempted > 0
              ? `${reHealth.items_succeeded}/${reHealth.items_attempted} (${Math.round((reHealth.items_succeeded / reHealth.items_attempted) * 100)}%)`
              : (kpis ? `${kpis.properties_tracked}/${kpis.properties_tracked} (100%)` : "25/25 (100%)");

            const coverageBadge = reHealth && reHealth.items_attempted > 0
              ? `${reHealth.items_succeeded}/${reHealth.items_attempted}`
              : "4×/day";

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
                <KPICard label="Properties Tracked" value={kpis.properties_tracked} />
                <KPICard label="Rate Changes (7d)"  value={kpis.rate_changes_7d} />
                <KPICard label="25%+ Spikes (7d)"   value={kpis.spikes_7d} />

                {/* Enterprise Pipeline Observability & Data Freshness Card */}
                <div className="p-3 sm:p-4 border border-border bg-card/50 rounded-lg flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Pipeline Health
                    </span>
                    <Activity className="size-3.5 text-emerald-500/70 shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 my-1">
                    <span className="relative flex size-2 shrink-0">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`} />
                      <span className={`relative inline-flex rounded-full size-2 ${pulseColor}`} />
                    </span>
                    <span className={`text-lg sm:text-2xl font-bold ${statusColorText}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground pt-1 border-t border-border/40 gap-1 truncate">
                    <span className="truncate" title={`Last ingestion run: ${lastCheckTime ? new Date(lastCheckTime).toLocaleString() : 'Live'}`}>
                      {freshnessText}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] bg-muted/40 px-1.5 py-0.5 rounded text-muted-foreground/80" title={`Ingestion yield from v_scrape_health: ${coverageRatio}`}>
                      {coverageBadge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </ErrorBoundary>

        {/* Main Dashboard Widget */}
        <ErrorBoundary fallbackMessage="Failed to load Rate Monitor dashboard.">
          <div className="border border-border rounded-lg overflow-hidden bg-card/30">
            <RealEstateDemo
              data={data}
              loading={loading}
              startDate={filterStartDate}
              endDate={filterEndDate}
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
    <div className="p-3 sm:p-4 border border-border bg-card/50 rounded-lg flex flex-col justify-center shadow-sm">
      <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <span className={`text-lg sm:text-2xl font-bold text-foreground capitalize ${valueClass}`}>{value}</span>
    </div>
  );
}
