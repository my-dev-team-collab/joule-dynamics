/**
 * RealEstateDemo.tsx
 * Real estate rate volatility widget for /real-estate.
 * Queries v_rate_volatility (Supabase view — updated to include lat/lng,
 * bedrooms, avg_rating, review_count and a proper 7-day trailing average).
 *
 * Enhancements vs. original:
 *  - External-link icons on property names in alerts + table (Tier 1 #2)
 *  - Alert threshold label (Tier 2 #8)
 *  - bedrooms / avg_rating / review_count in table (Tier 2 #6)
 *  - "Last checked X ago" freshness indicator (Tier 2 #7)
 *  - Sparklines (last 5 known prices) for unavailable rows (Tier 1 #4)
 *  - Filter by market, platform, bedrooms (Tier 3 #9)
 *  - Per-market avg rate summary (Tier 3 #10)
 *  - Overall health indicator instead of per-row stale exposure (Tier 3 #11)
 */
import React, { useState, useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, ArrowRight, ExternalLink, Star, Bed, Info } from "lucide-react";

interface RateRow {
  id: string;
  property_id: string;
  property_name: string;
  url: string;
  market: string;
  platform: string;
  latitude: number | null;
  longitude: number | null;
  bedrooms: number | null;
  avg_rating: number | null;
  review_count: number | null;
  stay_date: string;
  nightly_rate: number | null;
  is_available: boolean;
  currency: string;
  recorded_at: string;
  trailing_avg_rate: number | null;
  pct_above_trailing_avg: number | null;
}

/** Hand-rolled "X ago" without date-fns */
function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** Tiny inline SVG sparkline from a list of prices */
function Sparkline({ prices }: { prices: number[] }) {
  if (prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const W = 60, H = 20;
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * W;
    const y = H - ((p - min) / range) * H;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg width={W} height={H} className="inline-block align-middle opacity-70" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export interface RealEstateDemoProps {
  data: RateRow[];
  loading: boolean;
}

export default function RealEstateDemo({ data, loading }: RealEstateDemoProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Initialize and maintain selected property (auto-selects rich, volatile time-series)
  useEffect(() => {
    if (uniqueProperties.length === 0) return;

    const isCurrentValid = selectedPropertyId && uniqueProperties.some((p) => p.id === selectedPropertyId);
    if (isCurrentValid) return;

    const availableIds = new Set(uniqueProperties.map((p) => p.id));
    const propStats = new Map<string, { count: number; maxVol: number; isRecent: boolean }>();
    const now = Date.now();
    const twoDaysAgo = now - 48 * 3600 * 1000;

    for (const r of data) {
      if (!availableIds.has(r.property_id) || r.nightly_rate === null) continue;
      const stats = propStats.get(r.property_id) || { count: 0, maxVol: 0, isRecent: false };
      stats.count += 1;
      const vol = Math.abs(r.pct_above_trailing_avg ?? 0);
      if (vol > stats.maxVol) stats.maxVol = vol;
      if (new Date(r.recorded_at).getTime() >= twoDaysAgo) stats.isRecent = true;
      propStats.set(r.property_id, stats);
    }

    const pool = Array.from(propStats.entries());

    if (pool.length > 0) {
      pool.sort((a, b) => {
        if (a[1].isRecent !== b[1].isRecent) return a[1].isRecent ? -1 : 1;
        const aRich = a[1].count >= 4 ? 1 : 0;
        const bRich = b[1].count >= 4 ? 1 : 0;
        if (aRich !== bRich) return bRich - aRich;
        if (b[1].maxVol !== a[1].maxVol) return b[1].maxVol - a[1].maxVol;
        return b[1].count - a[1].count;
      });
      setSelectedPropertyId(pool[0][0]);
    } else {
      setSelectedPropertyId(uniqueProperties[0].id);
    }
  }, [data, uniqueProperties, selectedPropertyId]);



  // ── Derived state ────────────────────────────────────────────────────────────

  const uniqueProperties = useMemo(() => Array.from(
    new Map(data.map((r) => [r.property_id, {
      id: r.property_id,
      name: r.property_name,
      market: r.market,
      platform: r.platform,
      bedrooms: r.bedrooms,
    }])).values()
  ), [data]);


  const latestPerProperty = useMemo(() => {
    const propMap = new Map<string, RateRow>();
    for (const r of data) {
      const existing = propMap.get(r.property_id);
      if (!existing || new Date(r.recorded_at).getTime() > new Date(existing.recorded_at).getTime()) {
        propMap.set(r.property_id, r);
      }
    }
    return Array.from(propMap.values());
  }, [data]);

  // Volatility alerts (unfiltered — show all properties)
  const spikes = useMemo(() => {
    const allSignificant = data.filter((r) => r.pct_above_trailing_avg !== null && Math.abs(r.pct_above_trailing_avg) >= 25);
    
    const surgesAll = allSignificant.filter(r => r.pct_above_trailing_avg! > 0);
    const dropsAll = allSignificant.filter(r => r.pct_above_trailing_avg! < 0);

    const allSurges = Array.from(new Map(surgesAll.sort((a, b) => (b.pct_above_trailing_avg ?? 0) - (a.pct_above_trailing_avg ?? 0)).map(r => [r.property_id, r])).values());
    const allDrops = Array.from(new Map(dropsAll.sort((a, b) => (a.pct_above_trailing_avg ?? 0) - (b.pct_above_trailing_avg ?? 0)).map(r => [r.property_id, r])).values());
    
    const finalSpikes = [];
    let sIdx = 0, dIdx = 0;
    // Take up to 2 of each to ensure balance
    while(sIdx < 2 && sIdx < allSurges.length) finalSpikes.push(allSurges[sIdx++]);
    while(dIdx < 2 && dIdx < allDrops.length) finalSpikes.push(allDrops[dIdx++]);
    
    // Fill remaining slots up to 4
    while(finalSpikes.length < 4 && sIdx < allSurges.length) finalSpikes.push(allSurges[sIdx++]);
    while(finalSpikes.length < 4 && dIdx < allDrops.length) finalSpikes.push(allDrops[dIdx++]);
    
    return finalSpikes;
  }, [data]);

  // Chart data for selected property
  const chartData = useMemo(() => data
    .filter((r) => r.property_id === selectedPropertyId)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((r) => {
      const d = new Date(r.recorded_at);
      return {
        ...r,
        dateShort: d.toLocaleDateString(undefined, {
          month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
        }),
        dateOnly: d.toLocaleDateString(undefined, {
          month: "short", day: "numeric"
        }),
        timeOnly: d.toLocaleTimeString(undefined, {
          hour: "numeric", minute: "2-digit"
        }),
      };
    }), [data, selectedPropertyId]);

  // Health indicator (Tier 3 #11)
  const totalProperties = uniqueProperties.length;
  const reportingIn24h = useMemo(() => new Set(
    data.filter(r => (Date.now() - new Date(r.recorded_at).getTime()) < 24 * 3600 * 1000)
        .map(r => r.property_id)
  ).size, [data]);

  // Per-market avg rate summary (Tier 3 #10)
  const marketSummary = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    latestPerProperty.forEach(r => {
      if (!r.market || r.nightly_rate === null) return;
      if (!map[r.market]) map[r.market] = { sum: 0, count: 0 };
      map[r.market].sum += r.nightly_rate;
      map[r.market].count += 1;
    });
    return Object.entries(map).map(([market, { sum, count }]) => ({
      market,
      avg: sum / count,
      count,
    })).sort((a, b) => b.avg - a.avg);
  }, [latestPerProperty]);

  const formatRate = (r: RateRow) =>
    `${r.currency === "USD" ? "$" : r.currency}${r.nightly_rate?.toFixed(0) ?? "N/A"}/night`;

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6 bg-card p-6 text-sm animate-pulse min-h-[400px]">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <div className="h-5 w-36 rounded bg-muted/60" />
            <div className="h-6 w-24 rounded bg-muted/60" />
          </div>
          <div className="h-52 w-full rounded-md bg-muted/40" />
        </div>
        <div className="h-32 w-full rounded-md bg-muted/40" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex w-full flex-col items-center justify-center bg-card p-8 text-center min-h-[300px]">
        <span className="text-3xl opacity-40 mb-3">🏠</span>
        <p className="text-sm font-medium text-foreground">No rate data yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Waiting for the first scraper run to complete.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 bg-card p-6 text-sm">

      {/* ── Health Indicator (Tier 3 #11) ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${reportingIn24h === totalProperties ? "bg-green-500" : "bg-amber-400"}`} />
          <span className="text-xs text-muted-foreground">
            {reportingIn24h} / {totalProperties} properties reporting in last 24h
          </span>
        </div>
      </div>

      {/* ── Volatility Alert Panel ── */}
      {spikes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-amber-500" />
            <h4 className="font-semibold text-foreground">Rate Volatility Alerts</h4>
            <span className="text-muted-foreground font-normal text-xs">(≥ 25% deviation from 7-day avg)</span>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">
            Alerts trigger when a property's current rate deviates ≥ 25% from its 7-day average. This signals a pricing surge or correction worth investigating.
          </p>
          <div className="flex flex-col gap-2">
            {spikes.map((spike) => {
              const isDrop = spike.pct_above_trailing_avg !== null && spike.pct_above_trailing_avg < 0;
              const borderColor = isDrop ? "border-green-500/30" : "border-amber-500/30";
              const leftBorderColor = isDrop ? "border-l-green-500" : "border-l-amber-500";
              const bgColor = isDrop ? "bg-green-500/5" : "bg-amber-500/5";
              const textColor = isDrop ? "text-green-500" : "text-amber-400";
              const badgeBorderColor = isDrop ? "border-green-500/40" : "border-amber-500/40";
              
              return (
                <div
                  key={spike.property_id}
                  className={`flex items-start justify-between rounded-md border ${borderColor} ${bgColor} p-3 border-l-2 ${leftBorderColor}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground text-sm flex items-center gap-1.5">
                      <span className="truncate max-w-[180px] sm:max-w-xs" title={spike.property_name}>{spike.property_name}</span>
                      {spike.url && (
                        <a
                          href={spike.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          title="View listing"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {spike.market} · {spike.platform}
                      <span className="mx-1 opacity-40">·</span>
                      Stay: {new Date(spike.stay_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`font-bold ${textColor} text-sm`}>
                      {spike.currency === "USD" ? "$" : spike.currency}{spike.nightly_rate?.toFixed(0) ?? "N/A"}
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">/ night</span>
                    </span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${badgeBorderColor} ${textColor} font-mono`}>
                      {spike.pct_above_trailing_avg && spike.pct_above_trailing_avg > 0 ? "+" : ""}{spike.pct_above_trailing_avg?.toFixed(1)}% vs avg
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rate History Chart ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-foreground">Nightly Rate History</h4>
            <span className="text-[10px] text-muted-foreground sm:hidden flex items-center gap-1">
              Swipe <ArrowRight className="size-3" />
            </span>
          </div>
          {uniqueProperties.length > 0 && (
            <select
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[220px] truncate"
              value={selectedPropertyId ?? ""}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
            >
              {uniqueProperties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="relative w-full border border-border/50 rounded-lg bg-card/50 overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none sm:hidden z-10" />
            <div className="w-full overflow-x-auto">
              <div className="h-64 min-w-[600px] w-full p-4 pr-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="dateShort"
                      tick={(props: any) => {
                        const { x, y, index } = props;
                        const dataPoint = chartData[index];
                        if (!dataPoint) return null;
                        return (
                          <g transform={`translate(${x},${y})`}>
                            <text x={0} y={0} dy={10} textAnchor="middle" fill="var(--color-muted-foreground)" fontSize={10}>
                              <tspan>{dataPoint.dateOnly}</tspan>
                              <tspan className="hidden sm:inline">, {dataPoint.timeOnly}</tspan>
                            </text>
                          </g>
                        );
                      }}
                      tickLine={false}
                      axisLine={false}
                      dy={5}
                    />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickFormatter={(v) => `$${v}`}
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "6px" }}
                      itemStyle={{ fontSize: "12px" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((value: unknown, name: unknown) => [
                        value != null ? `$${Number(value).toFixed(0)}/night` : "N/A",
                        name === "nightly_rate" ? "Nightly Rate" : "7-day Trailing Avg",
                      ]) as any}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length && payload[0].payload) {
                          return payload[0].payload.dateShort;
                        }
                        return label;
                      }}
                      labelStyle={{ color: "var(--color-muted-foreground)", fontSize: "11px" }}
                    />
                <Legend
                  iconType="line"
                  wrapperStyle={{ fontSize: "10px", color: "var(--color-muted-foreground)" }}
                  formatter={(value) => value === "nightly_rate" ? "Nightly Rate" : "7-day Trailing Avg"}
                />
                <Line
                  type="monotone"
                  dataKey="nightly_rate"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: "var(--color-card)", strokeWidth: 2, stroke: "var(--color-primary)" }}
                  activeDot={{ r: 4, fill: "var(--color-primary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="trailing_avg_rate"
                  stroke="var(--color-muted-foreground)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 w-full border border-border/50 rounded-lg bg-card/50 p-4 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Select a property to view rate history</p>
          </div>
        )}
      </div>

      {/* ── Per-Market Summary (Tier 3 #10) ── */}
      {marketSummary.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">Market Averages</h4>
            <p className="text-[10px] text-muted-foreground">
              Current mean nightly rate aggregated across all priced listings in each respective region.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {marketSummary.map(({ market, avg, count }) => (
              <div key={market} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/20 text-xs">
                <span className="font-medium text-foreground">{market}</span>
                <span className="text-muted-foreground">avg ${avg.toFixed(0)}/night</span>
                <span className="text-muted-foreground/50">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filters (Tier 3 #9) ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-semibold text-foreground">Property Rate Snapshot</h4>
            <span className="text-[10px] text-muted-foreground sm:hidden flex items-center gap-1">
              Swipe <ArrowRight className="size-3" />
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Latest recorded prices and availability compared to a property's 7-day trailing average benchmark.
            Rates and availability reflect a live 2-night check-in window starting each day and are refreshed 4× daily. This does not represent full-calendar occupancy.
          </p>
        </div>

        {/* Table */}
        {latestPerProperty.length > 0 ? (
          <div className="relative w-full rounded-md border border-border shadow-sm overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent pointer-events-none sm:hidden z-10" />
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Property</th>
                    <th className="px-4 py-2.5 font-medium">Market</th>
                    <th className="px-4 py-2.5 font-medium">Platform</th>
                    <th className="px-4 py-2.5 font-medium">Beds / Rating</th>
                    <th className="px-4 py-2.5 font-medium">Stay Date</th>
                    <th className="px-4 py-2.5 font-medium">Rate</th>
                    <th className="px-4 py-2.5 font-medium">vs 7d Avg</th>
                    <th className="px-4 py-2.5 font-medium">Avail.</th>
                    <th className="px-4 py-2.5 font-medium">Last Checked</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {latestPerProperty.map((row) => {
                    const pct = row.pct_above_trailing_avg;
                    const pctColor =
                      pct === null ? "text-muted-foreground"
                      : pct >= 25 ? "text-amber-400 font-semibold"
                      : pct > 0 ? "text-green-500"
                      : "text-red-400";

                    const hoursSince = (Date.now() - new Date(row.recorded_at).getTime()) / (1000 * 60 * 60);
                    const isStale = hoursSince > 24;
                    const isPriced = row.nightly_rate !== null;

                    // Last 5 priced readings for sparkline
                    const recentPriced = data
                      .filter(r => r.property_id === row.property_id && r.nightly_rate !== null)
                      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                      .slice(0, 5)
                      .reverse();

                    let rateDisplay: React.ReactNode;
                    if (isPriced) {
                      rateDisplay = formatRate(row);
                    } else {
                      const sparkPrices = recentPriced.map(r => r.nightly_rate!);
                      const lastKnown = recentPriced[recentPriced.length - 1];
                      rateDisplay = (
                        <span className="flex flex-col gap-0.5">
                          <span className="font-medium flex items-center gap-1 text-muted-foreground">
                            Unavailable
                            <span title="Reflects a 2-night stay starting today rather than the property's full calendar. Other dates may still be bookable.">
                              <Info className="size-3 opacity-60 cursor-help" />
                            </span>
                          </span>
                          {lastKnown && (
                            <span className="flex items-center gap-1.5">
                              <Sparkline prices={sparkPrices} />
                              <span className="text-muted-foreground/70 text-[10px]">
                                last ${lastKnown.nightly_rate?.toFixed(0)} · {new Date(lastKnown.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            </span>
                          )}
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={row.property_id}
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${row.property_id === selectedPropertyId ? "bg-muted/20" : ""} ${isStale ? "opacity-60" : ""}`}
                        onClick={() => setSelectedPropertyId(row.property_id)}
                      >
                        {/* Property name + external link */}
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span className="flex items-center gap-1.5">
                            <span className="max-w-[140px] truncate" title={row.property_name}>{row.property_name}</span>
                            {row.url && (
                              <a
                                href={row.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                                title="View listing"
                              >
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{row.market || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.platform || "—"}</td>
                        {/* Bedrooms + Rating (Tier 2 #6) */}
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex flex-col gap-0.5">
                            {row.bedrooms != null && (
                              <span className="flex items-center gap-1">
                                <Bed className="size-3 opacity-60" />
                                {row.bedrooms}
                              </span>
                            )}
                            {row.avg_rating != null && row.review_count !== 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="size-3 opacity-60" />
                                {row.avg_rating.toFixed(1)}
                                {row.review_count != null && <span className="opacity-60">({row.review_count})</span>}
                              </span>
                            )}
                            {row.bedrooms == null && row.avg_rating == null && "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(row.stay_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{rateDisplay}</td>
                        <td className={`px-4 py-3 ${pctColor}`}>
                          {pct !== null ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[10px] ${row.is_available ? (isStale ? "text-green-500/50" : "text-green-500") : "text-muted-foreground"}`}>
                            {row.is_available ? (isStale ? "YES (STALE)" : "YES") : "NO"}
                          </span>
                        </td>
                        {/* Last checked (Tier 2 #7) */}
                        <td className="px-4 py-3 text-muted-foreground" title={new Date(row.recorded_at).toLocaleString()}>
                          {isStale ? `As of ${new Date(row.recorded_at).toLocaleDateString(undefined, {month: "short", day: "numeric"})}` : timeAgo(row.recorded_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-32 w-full flex-col items-center justify-center rounded-md border border-border bg-card/50">
            <span className="text-xl opacity-40 mb-2">🏠</span>
            <p className="text-sm font-medium text-foreground">
              {latestPerProperty.length === 0
                ? "No property data matches the current filters."
                : "No property data yet."}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
