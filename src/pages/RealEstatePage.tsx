/**
 * RealEstatePage.tsx
 * Dedicated page for the Real Estate Rate Monitor at /real-estate.
 * Includes KPI cards (from get_dashboard_kpis RPC), RealEstateDemo widget,
 * PropertyMap (Mapbox), and the Service Tier section.
 */
import { useEffect, useState, useMemo } from "react";
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
import { Building2 } from "lucide-react";

interface RealEstateKPIs {
  properties_tracked: number;
  rate_changes_7d: number;
  spikes_7d: number;
  tracking_since: string | null;
  last_scrape_status: Record<string, string> | null;
}

export default function RealEstatePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterPlatform = searchParams.get("platform") || "all";
  const filterMarket = searchParams.get("market") || "all";
  const filterTracked = searchParams.get("tracked") || "tracked";
  const filterStartDate = searchParams.get("start");
  const filterEndDate = searchParams.get("end");
  const filterBedrooms = searchParams.get("bedrooms") || "all";

  const setFilter = (key: string, value: string | null) => {
    setSearchParams(prev => {
      if (value === null || value === "all" && key !== "tracked" && key !== "start" && key !== "end") {
        prev.delete(key);
      } else {
        prev.set(key, value);
      }
      return prev;
    });
  };

  const [baseKpis, setBaseKpis] = useState<RealEstateKPIs | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, dataRes] = await Promise.all([
          supabase.rpc("get_dashboard_kpis"),
          supabase
            .from("v_rate_volatility")
            .select("*")
            .order("stay_date", { ascending: false })
        ]);

        if (kpiRes.data) {
          const d = kpiRes.data as Record<string, unknown>;
          setBaseKpis((d.real_estate as RealEstateKPIs) ?? null);
        }
        
        if (dataRes.data) {
          setRawData(dataRes.data);
        }
      } catch (e) {
        console.error("Unexpected error fetching data:", e);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  // Filter options
  const uniqueProperties = useMemo(() => Array.from(
    new Map(rawData.map((r) => [r.property_id, {
      id: r.property_id,
      market: r.market,
      platform: r.platform,
      bedrooms: r.bedrooms,
    }])).values()
  ), [rawData]);

  const markets = useMemo(() => Array.from(new Set(uniqueProperties.map(p => p.market).filter(Boolean))).sort(), [uniqueProperties]);
  const platforms = useMemo(() => Array.from(new Set(uniqueProperties.map(p => p.platform).filter(Boolean))).sort(), [uniqueProperties]);
  const bedroomOptions = useMemo(() => Array.from(new Set(uniqueProperties.map(p => p.bedrooms).filter((b): b is number => b !== null))).sort((a,b)=>a-b), [uniqueProperties]);

  // Filter data
  const filteredData = useMemo(() => {
    return rawData.filter((r) => {
      if (filterPlatform !== "all" && r.platform !== filterPlatform) return false;
      if (filterMarket && filterMarket !== "all" && r.market !== filterMarket) return false;
      if (filterTracked === "tracked" && r.is_active === false) return false;
      if (filterTracked === "untracked" && r.is_active === true) return false;
      if (filterBedrooms !== "all" && String(r.bedrooms) !== filterBedrooms) return false;
      
      if (filterStartDate || filterEndDate) {
        const stay = new Date(r.stay_date).getTime();
        if (filterStartDate && stay < new Date(filterStartDate).getTime()) return false;
        if (filterEndDate && stay > new Date(filterEndDate).getTime()) return false;
      }
      return true;
    });
  }, [rawData, filterPlatform, filterMarket, filterTracked, filterStartDate, filterEndDate, filterBedrooms]);

  // Derive KPIs from filtered data
  const kpis = useMemo(() => {
    if (!baseKpis) return null;
    const uniqueProps = new Set(filteredData.map(d => d.property_id)).size;
    
    // Spikes logic matches RPC (abs(pct) >= 25, recorded_at in last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
    const spikes = filteredData.filter(r => 
      r.pct_above_trailing_avg !== null && 
      Math.abs(r.pct_above_trailing_avg) >= 25 &&
      new Date(r.recorded_at).getTime() >= sevenDaysAgo
    ).length;

    return {
      ...baseKpis,
      properties_tracked: uniqueProps,
      spikes_7d: spikes
    };
  }, [baseKpis, filteredData]);

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
          <div className="flex flex-wrap gap-3">
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
            
            {(filterPlatform !== "all" || filterBedrooms !== "all" || filterTracked !== "tracked" || filterStartDate || filterEndDate) && (
            <div className="flex flex-col gap-1 justify-end">
                <button
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-2 py-1 h-[26px]"
                  onClick={() => {
                    setFilter("market", "all");
                    setFilter("platform", "all");
                    setFilter("bedrooms", "all");
                    setFilter("tracked", "tracked");
                    setFilter("start", null);
                    setFilter("end", null);
                  }}
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
              <KPICard label="Rate Changes (7d)" value={kpis.rate_changes_7d} />
              <KPICard label="25%+ Spikes (7d)" value={kpis.spikes_7d} />

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
              data={filteredData} 
              loading={loading}
            />
          </div>
        </ErrorBoundary>

        {/* Property Map */}
        <ErrorBoundary fallbackMessage="Failed to load property map.">
          <PropertyMap 
            data={filteredData}
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
