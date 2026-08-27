/**
 * RealEstateDemo.tsx
 * Real estate rate volatility widget for /real-estate.
 *
 * Temporal UX: Adapts all labels, descriptions, and visual logic based on
 * whether the active stay date range is in the present, historical past, or
 * the future — so that every visual remains contextually meaningful.
 *
 * Chart Selection: Tracks whether the user manually picked a property.
 * Auto-selection (scoring by data density + recency + volatility) always
 * re-runs when the dataset changes due to a filter change, but respects a
 * manual user selection if that property is still in the filtered dataset.
 */
import React, { useState, useEffect, useRef, useMemo } from "react";

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
import { TrendingUp, ArrowRight, ExternalLink, Star, Bed, Info, Clock, Calendar } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

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

type TemporalContext = "present" | "historical" | "future";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Classify the active date range as present, historical, or future. */
function getTemporalContext(startDate?: string | null, endDate?: string | null): TemporalContext {
  if (!startDate && !endDate) return "present";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end   = endDate   ? new Date(endDate)   : null;
  const start = startDate ? new Date(startDate) : null;
  if (end && end < today) return "historical";
  if (start && start > today) return "future";
  return "present";
}

/** Format a date range label, e.g. "Jun 1 – Jul 31" */
function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
  if (startDate) return `from ${fmt(startDate)}`;
  if (endDate)   return `through ${fmt(endDate)}`;
  return "";
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

// ── Props ─────────────────────────────────────────────────────────────────────

export interface RealEstateDemoProps {
  data: RateRow[];
  loading: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RealEstateDemo({ data, loading, startDate, endDate }: RealEstateDemoProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  // Tracks whether the user explicitly picked a property via the dropdown.
  // When true, auto-selection respects the choice as long as the property is
  // still in the filtered dataset. When the user's pick drops out, this resets.
  const userHasManuallySelected = useRef(false);

  // Temporal context derived from active date filters
  const temporalContext: TemporalContext = useMemo(
    () => getTemporalContext(startDate, endDate),
    [startDate, endDate]
  );
  const dateRangeLabel = formatDateRange(startDate, endDate);

  // ── Derived state ──────────────────────────────────────────────────────────

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

  // ── Chart property selection ───────────────────────────────────────────────

  // Single-property lock: when exactly 1 property is in the filtered dataset,
  // always lock to it — skip scoring and manual-pick logic entirely.
  const isSinglePropertyLocked = uniqueProperties.length === 1;

  useEffect(() => {
    if (uniqueProperties.length === 0) {
      setSelectedPropertyId(null);
      userHasManuallySelected.current = false;
      return;
    }

    // Single-property lock takes full precedence
    if (isSinglePropertyLocked) {
      setSelectedPropertyId(uniqueProperties[0].id);
      userHasManuallySelected.current = false;
      return;
    }

    const availableIds = new Set(uniqueProperties.map((p) => p.id));

    // If user manually picked a property that's still in the dataset, keep it
    if (userHasManuallySelected.current && selectedPropertyId && availableIds.has(selectedPropertyId)) {
      return;
    }

    // Manual pick dropped out of dataset (filtered away) — reset and re-score
    if (userHasManuallySelected.current) {
      userHasManuallySelected.current = false;
    }

    // Always re-run scoring algorithm when data changes (filter change or mount)
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
    // data is intentionally the only dep — we want to re-score on every data change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Handle user manually picking a property from the dropdown
  const handleUserSelectProperty = (id: string) => {
    userHasManuallySelected.current = true;
    setSelectedPropertyId(id);
  };

  // ── Volatility alerts ──────────────────────────────────────────────────────
  const spikes = useMemo(() => {
    const allSignificant = data.filter((r) => r.pct_above_trailing_avg !== null && Math.abs(r.pct_above_trailing_avg) >= 25);

    const surgesAll = allSignificant.filter(r => r.pct_above_trailing_avg! > 0);
    const dropsAll  = allSignificant.filter(r => r.pct_above_trailing_avg! < 0);

    const allSurges = Array.from(new Map(surgesAll.sort((a, b) => (b.pct_above_trailing_avg ?? 0) - (a.pct_above_trailing_avg ?? 0)).map(r => [r.property_id, r])).values());
    const allDrops  = Array.from(new Map(dropsAll.sort((a, b)  => (a.pct_above_trailing_avg ?? 0) - (b.pct_above_trailing_avg ?? 0)).map(r => [r.property_id, r])).values());

    const finalSpikes: typeof allSurges = [];
    let sIdx = 0, dIdx = 0;
    while (sIdx < 2 && sIdx < allSurges.length) finalSpikes.push(allSurges[sIdx++]);
    while (dIdx < 2 && dIdx < allDrops.length)  finalSpikes.push(allDrops[dIdx++]);
    while (finalSpikes.length < 4 && sIdx < allSurges.length) finalSpikes.push(allSurges[sIdx++]);
    while (finalSpikes.length < 4 && dIdx < allDrops.length)  finalSpikes.push(allDrops[dIdx++]);
    return finalSpikes;
  }, [data]);

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = useMemo(() => data
    .filter((r) => r.property_id === selectedPropertyId)
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .map((r) => {
      const d = new Date(r.recorded_at);
      return {
        ...r,
        dateShort: d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        dateOnly:  d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        timeOnly:  d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
      };
    }), [data, selectedPropertyId]);

  // ── Health indicator — only meaningful in present mode ─────────────────────
  const totalProperties = uniqueProperties.length;
  const reportingIn24h = useMemo(() => new Set(
    data.filter(r => (Date.now() - new Date(r.recorded_at).getTime()) < 24 * 3600 * 1000)
        .map(r => r.property_id)
  ).size, [data]);

  // ── Market averages ────────────────────────────────────────────────────────
  const marketSummary = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    latestPerProperty.forEach(r => {
      if (!r.market || r.nightly_rate === null) return;
      if (!map[r.market]) map[r.market] = { sum: 0, count: 0 };
      map[r.market].sum += r.nightly_rate;
      map[r.market].count += 1;
    });
    return Object.entries(map).map(([market, { sum, count }]) => ({
      market, avg: sum / count, count,
    })).sort((a, b) => b.avg - a.avg);
  }, [latestPerProperty]);

  const formatRate = (r: RateRow) =>
    `${r.currency === "USD" ? "$" : r.currency}${r.nightly_rate?.toFixed(0) ?? "N/A"}/night`;

  // ── Temporal copy helpers ──────────────────────────────────────────────────
  const alertsTitle = temporalContext === "historical" ? "Historical Rate Anomalies"
    : temporalContext === "future" ? "Projected Rate Anomalies"
    : "Rate Volatility Alerts";

  const alertsSubtitle = temporalContext === "historical"
    ? `Rates that deviated ≥ 25% from their 7-day avg during ${dateRangeLabel}`
    : temporalContext === "future"
    ? `Forward-booked rates deviating ≥ 25% from their 7-day avg for ${dateRangeLabel}`
    : "(≥ 25% deviation from 7-day avg)";

  const alertsDescription = temporalContext === "historical"
    ? "These anomalies represent actual recorded pricing events from the selected historical window."
    : temporalContext === "future"
    ? "These represent pre-priced future listings where rate deviations vs the historical average were already detectable at scrape time."
    : "Alerts trigger when a property's current rate deviates ≥ 25% from its 7-day average. This signals a pricing surge or correction worth investigating.";

  const chartTitle = temporalContext === "historical" ? "Historical Rate History"
    : temporalContext === "future" ? "Rate Projections"
    : "Nightly Rate History";

  const trailingAvgLabel = temporalContext === "future"
    ? "Avg at time of first booking"
    : "7-day Trailing Avg";

  const chartEmptyMessage = temporalContext === "future"
    ? "No pricing data found for this future date range. Data will appear once the scraper captures rates for these dates."
    : temporalContext === "historical"
    ? "No rate history found for this property in the selected historical window."
    : "Select a property to view rate history";

  const marketAvgSubtitle = temporalContext === "historical"
    ? `Mean nightly rate across priced listings for ${dateRangeLabel}.`
    : temporalContext === "future"
    ? `Mean projected rate across pre-priced listings for ${dateRangeLabel}.`
    : "Current mean nightly rate aggregated across all priced listings in each respective region.";

  const snapshotDescription = temporalContext === "historical"
    ? `Historical pricing snapshot for stay dates ${dateRangeLabel}. Rates reflect actual prices recorded at the time.`
    : temporalContext === "future"
    ? `Forward pricing snapshot for stay dates ${dateRangeLabel}. Rates reflect prices quoted at the time of scraping.`
    : "Latest recorded prices and availability compared to a property's 7-day trailing average benchmark. Rates and availability reflect a live 2-night check-in window starting each day and are refreshed 4× daily. This does not represent full-calendar occupancy.";

  // ── Availability badge labels ──────────────────────────────────────────────
  const availLabel = (isAvailable: boolean, stale: boolean): { text: string; className: string } => {
    if (temporalContext === "historical") {
      return isAvailable
        ? { text: "Was Available", className: "text-teal-500/70" }
        : { text: "Was Booked",   className: "text-red-400/70" };
    }
    if (temporalContext === "future") {
      return isAvailable
        ? { text: stale ? "Pre-open" : "Pre-open", className: "text-blue-400" }
        : { text: "Pre-booked",  className: "text-red-400/70" };
    }
    // Present
    if (isAvailable) {
      return stale
        ? { text: "YES (STALE)", className: "text-green-500/50" }
        : { text: "YES",        className: "text-green-500" };
    }
    return { text: "NO", className: "text-muted-foreground" };
  };

  // ── Loading / empty states ─────────────────────────────────────────────────

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
        <span className="text-3xl opacity-40 mb-3">
          {temporalContext === "future" ? "📅" : temporalContext === "historical" ? "🗂️" : "🏠"}
        </span>
        <p className="text-sm font-medium text-foreground">
          {temporalContext === "future"
            ? "No pricing data for this future window yet."
            : temporalContext === "historical"
            ? "No historical data found for this date range."
            : "No rate data yet."}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {temporalContext === "future"
            ? "Data will appear once the scraper captures rates for these stay dates."
            : temporalContext === "historical"
            ? "Try widening the date range or adjusting other filters."
            : "Waiting for the first scraper run to complete."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8 bg-card p-6 text-sm">

      {/* ── Temporal context badge (non-present) OR Health Indicator (present) ── */}
      <div className="flex items-center justify-between">
        {temporalContext === "present" ? (
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${reportingIn24h === totalProperties ? "bg-green-500" : "bg-amber-400"}`} />
            <span className="text-xs text-muted-foreground">
              {reportingIn24h} / {totalProperties} properties reporting in last 24h
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {temporalContext === "historical"
              ? <Clock className="size-3 text-muted-foreground" />
              : <Calendar className="size-3 text-blue-400" />}
            <span className={`text-xs font-medium ${temporalContext === "future" ? "text-blue-400" : "text-muted-foreground"}`}>
              {temporalContext === "historical"
                ? `Viewing historical stay dates${dateRangeLabel ? ` (${dateRangeLabel})` : ""}`
                : `Showing projected availability for future dates${dateRangeLabel ? ` (${dateRangeLabel})` : ""}`}
            </span>
          </div>
        )}
      </div>

      {/* ── Volatility Alert Panel ── */}
      {spikes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-amber-500 shrink-0" />
              <h4 className="font-semibold text-foreground text-sm sm:text-base">{alertsTitle}</h4>
            </div>
            <span className="text-muted-foreground font-normal text-[11px] sm:text-xs">{alertsSubtitle}</span>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-1">{alertsDescription}</p>
          <div className="flex flex-col gap-2">
            {spikes.map((spike) => {
              const isDrop = spike.pct_above_trailing_avg !== null && spike.pct_above_trailing_avg < 0;
              const borderColor      = isDrop ? "border-green-500/30" : "border-amber-500/30";
              const leftBorderColor  = isDrop ? "border-l-green-500" : "border-l-amber-500";
              const bgColor          = isDrop ? "bg-green-500/5"     : "bg-amber-500/5";
              const textColor        = isDrop ? "text-green-500"     : "text-amber-400";
              const badgeBorderColor = isDrop ? "border-green-500/40": "border-amber-500/40";

              return (
                <div
                  key={spike.property_id}
                  onClick={() => handleUserSelectProperty(spike.property_id)}
                  className={`flex items-start justify-between gap-3 rounded-md border ${borderColor} ${bgColor} p-3 border-l-2 ${leftBorderColor} cursor-pointer hover:bg-muted/20 transition-colors`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="font-medium text-foreground text-sm flex items-center gap-1.5 min-w-0">
                      <span className="truncate" title={spike.property_name}>{spike.property_name}</span>
                      {spike.url && (
                        <a href={spike.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors shrink-0" title="View listing">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground truncate">
                      {spike.market} · {spike.platform}
                      <span className="mx-1 opacity-40">·</span>
                      Stay: {new Date(spike.stay_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`font-bold ${textColor} text-sm`}>
                      {spike.currency === "USD" ? "$" : spike.currency}{spike.nightly_rate?.toFixed(0) ?? "N/A"}
                      <span className="text-[10px] font-normal text-muted-foreground ml-0.5">/nt</span>
                    </span>
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${badgeBorderColor} ${textColor} font-mono shrink-0`}>
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
            <h4 className="font-semibold text-foreground text-sm sm:text-base">{chartTitle}</h4>
          </div>
          {uniqueProperties.length > 0 && (
            isSinglePropertyLocked ? (
              <span className="text-xs font-medium text-foreground truncate max-w-full sm:max-w-[240px]" title={uniqueProperties[0].name}>
                {uniqueProperties[0].name}
              </span>
            ) : (
              <select
                className="w-full sm:w-auto rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-full sm:max-w-[260px] truncate"
                value={selectedPropertyId ?? ""}
                onChange={(e) => handleUserSelectProperty(e.target.value)}
              >
                {uniqueProperties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )
          )}
        </div>

        {chartData.length > 0 ? (
          <div className="relative w-full border border-border/50 rounded-lg bg-card/50 overflow-hidden">
            <div className="w-full overflow-x-auto assistant-scrollbar">
              <div className="h-64 min-w-[500px] w-full p-4 pr-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                    <XAxis
                      dataKey="dateShort"
                      interval="preserveStartEnd"
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
                      contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "6px", maxWidth: "240px", padding: "8px" }}
                      itemStyle={{ fontSize: "11px" }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={((value: unknown, name: unknown) => [
                        value != null ? `$${Number(value).toFixed(0)}/night` : "N/A",
                        name === "nightly_rate" ? "Nightly Rate" : trailingAvgLabel,
                      ]) as any}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length && payload[0].payload) {
                          return payload[0].payload.dateShort;
                        }
                        return label;
                      }}
                      labelStyle={{ color: "var(--color-muted-foreground)", fontSize: "10px", marginBottom: "4px" }}
                    />
                    <Legend
                      iconType="line"
                      wrapperStyle={{ fontSize: "10px", color: "var(--color-muted-foreground)" }}
                      formatter={(value) => value === "nightly_rate" ? "Nightly Rate" : trailingAvgLabel}
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
            <p className="text-xs text-muted-foreground text-center max-w-xs">{chartEmptyMessage}</p>
          </div>
        )}
      </div>

      {/* ── Per-Market Summary ── */}
      {marketSummary.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">Market Averages</h4>
            <p className="text-[10px] text-muted-foreground">{marketAvgSubtitle}</p>
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

      {/* ── Property Rate Snapshot Table & Mobile Card View ── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">Property Rate Snapshot</h4>
            <span className="text-[10px] text-muted-foreground hidden sm:flex md:hidden items-center gap-1">
              Swipe <ArrowRight className="size-3" />
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{snapshotDescription}</p>
        </div>

        {latestPerProperty.length > 0 ? (
          <>
            {/* Mobile Card List (block md:hidden) */}
            <div className="block md:hidden space-y-2.5">
              {latestPerProperty.map((row) => {
                const pct = row.pct_above_trailing_avg;
                const pctColor =
                  pct === null        ? "text-muted-foreground"
                  : pct >= 25         ? "text-amber-400 font-semibold"
                  : pct > 0           ? "text-green-500"
                  : "text-red-400";

                const hoursSince = (Date.now() - new Date(row.recorded_at).getTime()) / (1000 * 60 * 60);
                const isStale = temporalContext === "present" && hoursSince > 24;
                const isPriced = row.nightly_rate !== null;
                const { text: availText, className: availClass } = availLabel(row.is_available, isStale);

                const recentPriced = data
                  .filter(r => r.property_id === row.property_id && r.nightly_rate !== null)
                  .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                  .slice(0, 5)
                  .reverse();

                const isSelected = row.property_id === selectedPropertyId;

                return (
                  <div
                    key={row.property_id}
                    onClick={() => handleUserSelectProperty(row.property_id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary/80 bg-primary/5 shadow-sm"
                        : "border-border bg-card/60 hover:bg-card"
                    } ${isStale ? "opacity-70" : ""}`}
                  >
                    {/* Top Line: Name + Rate + Avail */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="font-semibold text-foreground text-sm truncate" title={row.property_name}>
                          {row.property_name}
                        </span>
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
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-bold text-foreground text-sm">
                          {isPriced ? formatRate(row) : <span className="text-xs text-muted-foreground font-normal">Unavailable</span>}
                        </span>
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border border-border/50 ${availClass}`}>
                          {availText}
                        </span>
                      </div>
                    </div>

                    {/* Meta Line: Market · Platform · Beds · Rating */}
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <span>{row.market || "—"}</span>
                        <span className="opacity-40">·</span>
                        <span className="capitalize">{row.platform || "—"}</span>
                        {row.bedrooms != null && (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="flex items-center gap-0.5"><Bed className="size-3 opacity-70" />{row.bedrooms} BR</span>
                          </>
                        )}
                        {row.avg_rating != null && (
                          <>
                            <span className="opacity-40">·</span>
                            <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                              <Star className="size-3 fill-amber-400/20" />{row.avg_rating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom Line: vs 7D Avg + Stay Date + Last Checked / Sparkline */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Stay: {new Date(row.stay_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        {pct !== null && (
                          <span className={`font-mono font-medium ${pctColor}`}>
                            {pct > 0 ? "+" : ""}{pct.toFixed(1)}% vs 7d
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isPriced && recentPriced.length > 1 && (
                          <Sparkline prices={recentPriced.map(r => r.nightly_rate!)} />
                        )}
                        <span>
                          {temporalContext === "present" && !isStale
                            ? timeAgo(row.recorded_at)
                            : new Date(row.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block relative w-full rounded-md border border-border shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto assistant-scrollbar">
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
                      <th className="px-4 py-2.5 font-medium">
                        {temporalContext === "present" ? "Last Checked" : "Recorded"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {latestPerProperty.map((row) => {
                      const pct = row.pct_above_trailing_avg;
                      const pctColor =
                        pct === null        ? "text-muted-foreground"
                        : pct >= 25         ? "text-amber-400 font-semibold"
                        : pct > 0           ? "text-green-500"
                        : "text-red-400";

                      const hoursSince = (Date.now() - new Date(row.recorded_at).getTime()) / (1000 * 60 * 60);
                      const isStale = temporalContext === "present" && hoursSince > 24;
                      const isPriced = row.nightly_rate !== null;

                      const { text: availText, className: availClass } = availLabel(row.is_available, isStale);

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
                        const lastKnown   = recentPriced[recentPriced.length - 1];
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

                      const lastCheckedDisplay = temporalContext === "present" && !isStale
                        ? timeAgo(row.recorded_at)
                        : new Date(row.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

                      return (
                        <tr
                          key={row.property_id}
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${row.property_id === selectedPropertyId ? "bg-muted/20" : ""} ${isStale ? "opacity-60" : ""}`}
                          onClick={() => handleUserSelectProperty(row.property_id)}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            <span className="flex items-center gap-1.5">
                              <span className="max-w-[200px] truncate" title={row.property_name}>{row.property_name}</span>
                              {row.url && (
                                <a href={row.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary transition-colors shrink-0" title="View listing">
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{row.market || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{row.platform || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <span className="flex flex-col gap-0.5">
                              {row.bedrooms != null && (
                                <span className="flex items-center gap-1"><Bed className="size-3 opacity-60" />{row.bedrooms}</span>
                              )}
                              {row.avg_rating != null && row.review_count !== 0 && (
                                <span className="flex items-center gap-1">
                                  <Star className="size-3 opacity-60" />{row.avg_rating.toFixed(1)}
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
                            <span className={`font-mono text-[10px] ${availClass}`}>{availText}</span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground" title={new Date(row.recorded_at).toLocaleString()}>
                            {lastCheckedDisplay}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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
