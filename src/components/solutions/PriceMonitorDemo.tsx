import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  ComposedChart
} from "recharts";
import { Bell, ArrowDownRight, ArrowUpRight, ChevronRight, ChevronDown } from "lucide-react";

interface SpreadRow {
  sku: string;
  name: string;
  category: string;
  retailers_tracked: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  spread: number;
  spread_pct: number;
  last_checked: string;
}

interface CategoryTrendRow {
  category: string;
  bucket: string;
  products_reporting: number;
  category_index: number;
}

interface VolatilityRow {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  retailer: string;
  category: string;
  created_at: string;
  price: number;
  trailing_avg_price: number | null;
  pct_above_trailing_avg: number | null;
}

interface AlertRow {
  id: string;
  alert_type: string;
  product_name: string;
  url: string;
  price_at_alert: number;
  target_price: number | null;
  previous_price: number | null;
  pct_change: number | null;
  created_at: string;
  acknowledged: boolean;
}

const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-md p-3 shadow-md z-50">
        <p className="text-muted-foreground text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry: any, index: number) => {
          const cat = entry.dataKey;
          const reporting = entry.payload[`${cat}_reporting`] || 0;
          const total = entry.payload[`${cat}_total`] || 0;
          const isLowConfidence = total > 0 && reporting < total / 2;
          
          return (
            <div key={index} className="flex flex-col mb-1.5 last:mb-0">
              <div className="flex justify-between gap-4 items-center">
                <span className="text-foreground text-xs font-medium" style={{ color: entry.color }}>
                  {entry.name}:
                </span>
                <span className="font-bold text-xs">{Number(entry.value).toFixed(2)}</span>
              </div>
              {total > 0 && (
                <span className={`text-xs ${isLowConfidence ? 'text-warning-foreground font-medium' : 'text-muted-foreground'}`}>
                  based on {reporting} of {total} products
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

const CustomConfidenceDot = (props: any) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (cx == null || cy == null) return null;
  
  const cat = dataKey;
  const reporting = payload[`${cat}_reporting`] || 0;
  const total = payload[`${cat}_total`] || 0;
  const isLowConfidence = total > 0 && reporting < total / 2;

  if (isLowConfidence) {
    return (
      <circle cx={cx} cy={cy} r={4} fill="var(--color-card)" stroke={stroke} strokeWidth={2} opacity={0.6} strokeDasharray="2 2" />
    );
  }
  return (
    <circle cx={cx} cy={cy} r={3} fill={stroke} stroke="none" />
  );
};

export default function PriceMonitorDemo() {
  const [spreadData, setSpreadData] = useState<SpreadRow[]>([]);
  const [trendData, setTrendData] = useState<CategoryTrendRow[]>([]);
  const [volatilityData, setVolatilityData] = useState<VolatilityRow[]>([]);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [expandedSku, setExpandedSku] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [spreadRes, trendRes, volRes] = await Promise.all([
        supabase.from("v_price_spread_latest").select("*").order("spread_pct", { ascending: false }),
        supabase.from("v_category_price_index").select("*").order("bucket", { ascending: true }),
        supabase.from("v_price_volatility").select("*").order("created_at", { ascending: true })
      ]);

      if (spreadRes.error) console.error("Error fetching spread:", spreadRes.error);
      else setSpreadData((spreadRes.data as unknown as SpreadRow[]) || []);

      if (trendRes.error) console.error("Error fetching trend:", trendRes.error);
      else setTrendData((trendRes.data as unknown as CategoryTrendRow[]) || []);

      if (volRes.error) console.error("Error fetching volatility:", volRes.error);
      else setVolatilityData((volRes.data as unknown as VolatilityRow[]) || []);

    } catch (err) {
      console.error("Unexpected error fetching pricing data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data: rows, error } = await supabase
        .from("v_recent_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching alerts:", error);
      else setAlerts((rows as unknown as AlertRow[]) || []);
    } catch (err) {
      console.error("Unexpected error fetching alerts:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    void fetchData();
    void fetchAlerts();

    const priceChannel = supabase
      .channel('public:price_history')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_history' }, () => {
        void fetchData();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel('public:price_alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'price_alerts' }, () => {
        void fetchAlerts();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(priceChannel);
      void supabase.removeChannel(alertsChannel);
    };
  }, []);

  // Calculate total tracked products per category from spreadData
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    spreadData.forEach(r => {
      const cat = r.category || "Uncategorized";
      totals[cat] = (totals[cat] || 0) + r.retailers_tracked;
    });
    return totals;
  }, [spreadData]);

  if (loading || loadingAlerts) {
    return (
      <div className="flex w-full flex-col gap-6 bg-card p-6 text-sm animate-pulse min-h-[400px]">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
             <div className="h-5 w-32 rounded bg-muted/60"></div>
             <div className="h-6 w-24 rounded bg-muted/60"></div>
          </div>
          <div className="h-48 w-full rounded-md bg-muted/40"></div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-5 w-48 rounded bg-muted/60"></div>
          <div className="h-32 w-full rounded-md bg-muted/40"></div>
        </div>
      </div>
    );
  }

  // Color helpers
  const getPctChangeColor = (pct: number | null) => {
    if (pct === null || pct === 0) return "text-muted-foreground";
    return pct < 0 ? "text-red-500" : "text-green-500";
  };
  
  const formatPct = (pct: number | null) => {
    if (pct === null) return "First reading";
    const sign = pct > 0 ? "+" : "";
    return `${sign}${pct.toFixed(1)}%`;
  };

  // Process Category Trend Data
  const categories = Array.from(new Set(trendData.map(d => d.category || "Uncategorized")));
  
  // Pivot trendData: { dayShort: '...', timestamp: 12345, Electronics: 105, Electronics_reporting: 5, Electronics_total: 10 }
  const trendPivotMap = new Map<string, any>();
  trendData.forEach(r => {
    const d = new Date(r.bucket);
    const dShort = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (!trendPivotMap.has(dShort)) {
      trendPivotMap.set(dShort, { dayShort: dShort, timestamp: d.getTime() });
    }
    const cat = r.category || "Uncategorized";
    const bucketObj = trendPivotMap.get(dShort);
    bucketObj[cat] = r.category_index;
    bucketObj[`${cat}_reporting`] = r.products_reporting;
    bucketObj[`${cat}_total`] = categoryTotals[cat] || 0;
  });
  const chartTrendData = Array.from(trendPivotMap.values()).sort((a, b) => a.timestamp - b.timestamp);

  const categoryColors = [
    "var(--color-primary)",
    "#10b981", // green-500
    "#f59e0b", // amber-500
    "#6366f1", // indigo-500
    "#ec4899", // pink-500
  ];

  return (
    <div className="flex w-full flex-col gap-8 bg-card p-6 text-sm">
      
      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h4 className="font-semibold text-foreground">Actionable Alerts</h4>
          </div>
          <div className="flex flex-col gap-2">
            {alerts.slice(0, 3).map((alert) => (
              <div 
                key={alert.id} 
                className={`flex items-start justify-between rounded-md border border-border p-3 transition-opacity ${alert.acknowledged ? 'opacity-60 bg-muted/20' : 'bg-background shadow-sm border-l-2 border-l-primary'}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-foreground text-sm truncate max-w-[200px] sm:max-w-xs">{alert.product_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {alert.alert_type === 'target_reached' 
                      ? `Hit target of $${alert.target_price?.toFixed(2)}` 
                      : alert.previous_price === null 
                        ? `Initial price logged` 
                        : `Changed from $${alert.previous_price.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className={`flex items-center gap-1 font-bold ${getPctChangeColor(alert.pct_change)}`}>
                    {alert.pct_change && alert.pct_change < 0 ? <ArrowDownRight className="size-3" /> : alert.pct_change && alert.pct_change > 0 ? <ArrowUpRight className="size-3" /> : null}
                    ${alert.price_at_alert.toFixed(2)} {alert.pct_change !== null && `(${formatPct(alert.pct_change)})`}
                  </div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Trend Section */}
      <div className="flex flex-col gap-3">
        <h4 className="font-semibold text-foreground">Category Price Index (Base 100)</h4>
        {chartTrendData.length > 0 ? (
          <div className="h-64 w-full border border-border/50 rounded-lg bg-card/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartTrendData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="dayShort" 
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} 
                  tickLine={false}
                  axisLine={false}
                  dy={5}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  dx={-5}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                {categories.map((cat, i) => (
                  <Line 
                    key={cat}
                    type="monotone" 
                    dataKey={cat} 
                    name={cat}
                    stroke={categoryColors[i % categoryColors.length]} 
                    strokeWidth={2} 
                    dot={<CustomConfidenceDot />}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 w-full border border-border/50 rounded-lg bg-card/50 p-4 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No trend data yet.</p>
          </div>
        )}
      </div>

      {/* Market Spreads Section */}
      <div className="flex flex-col gap-3">
        <h4 className="font-semibold text-foreground">Market Spread per SKU</h4>
        
        {spreadData.length > 0 ? (
          <div className="relative w-full rounded-md border border-border shadow-sm overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium w-8"></th>
                    <th className="px-4 py-2.5 font-medium">Product / SKU</th>
                    <th className="px-4 py-2.5 font-medium">Category</th>
                    <th className="px-4 py-2.5 font-medium">Spread Range</th>
                    <th className="px-4 py-2.5 font-medium text-right">Spread %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {spreadData.map((row) => {
                    const isExpanded = expandedSku === row.sku;
                    return (
                      <React.Fragment key={row.sku}>
                        <tr 
                          className={`hover:bg-muted/30 transition-colors cursor-pointer ${isExpanded ? 'bg-muted/20' : ''}`}
                          onClick={() => setExpandedSku(isExpanded ? null : row.sku)}
                        >
                          <td className="px-4 py-3 text-muted-foreground">
                            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground max-w-[200px] truncate" title={row.name}>{row.name}</span>
                              <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{row.sku}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {row.category || "—"}
                          </td>
                          <td className="px-4 py-3 min-w-[200px]">
                            {row.retailers_tracked > 1 ? (
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[10px]">${row.min_price.toFixed(2)}</span>
                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
                                  {/* Just a visual indicator of the spread */}
                                  <div className="absolute top-0 bottom-0 left-0 right-0 bg-primary/20 rounded-full" />
                                  <div 
                                    className="absolute top-0 bottom-0 bg-primary rounded-full w-1.5 h-1.5 -ml-[0.75rem]" 
                                    style={{ left: `${((row.avg_price - row.min_price) / (row.max_price - row.min_price)) * 100}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[10px]">${row.max_price.toFixed(2)}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <span>${row.avg_price.toFixed(2)}</span>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-muted-foreground/70 bg-transparent">1 RETAILER</Badge>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.retailers_tracked > 1 ? (
                              <span className="font-semibold text-foreground">{row.spread_pct.toFixed(1)}%</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                        
                        {/* Expanded Drill-down */}
                        {isExpanded && (
                          <tr className="bg-muted/10 border-b-0">
                            <td colSpan={5} className="p-0">
                              <DrillDownChart sku={row.sku} volatilityData={volatilityData} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex h-32 w-full flex-col items-center justify-center rounded-md border border-border bg-card/50 text-center">
            <span className="text-xl opacity-40 mb-2">📉</span>
            <p className="text-sm font-medium text-foreground">No price data yet.</p>
          </div>
        )}
      </div>

    </div>
  );
}

// Sub-component for the expanded drill-down chart
function DrillDownChart({ sku, volatilityData }: { sku: string; volatilityData: VolatilityRow[] }) {
  const skuData = useMemo(() => {
    return volatilityData.filter(d => d.sku === sku);
  }, [sku, volatilityData]);

  if (skuData.length === 0) {
    return <div className="p-4 text-center text-xs text-muted-foreground border-t border-border/50">No history available for this SKU.</div>;
  }

  // Pivot data by retailer
  const retailers = Array.from(new Set(skuData.map(d => d.retailer || "Unknown")));
  const pivotMap = new Map<string, any>();
  
  skuData.forEach(r => {
    const dShort = new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (!pivotMap.has(dShort)) {
      pivotMap.set(dShort, { dateShort: dShort, timestamp: new Date(r.created_at).getTime() });
    }
    const ret = r.retailer || "Unknown";
    pivotMap.get(dShort)[ret] = r.price;
  });

  const chartData = Array.from(pivotMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  
  const colors = [
    "var(--color-primary)",
    "#10b981",
    "#f59e0b",
    "#ec4899"
  ];

  const hasMultiplePoints = chartData.length > 1;

  return (
    <div className="p-4 border-t border-border/50 bg-background/50 flex flex-col gap-3 shadow-inner">
      <div className="flex items-center justify-between px-2">
        <h5 className="font-medium text-xs text-foreground flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-primary" />
          Retailer History
        </h5>
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="dateShort" 
              tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }} 
              tickLine={false}
              axisLine={false}
              dy={5}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
              tickFormatter={(val) => `$${val}`}
              tickLine={false}
              axisLine={false}
              dx={-5}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", borderRadius: "6px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              itemStyle={{ color: "var(--color-foreground)", fontSize: "11px", fontWeight: 500 }}
              labelStyle={{ color: "var(--color-muted-foreground)", marginBottom: "4px", fontSize: "10px" }}
              formatter={(value: any, name: any) => [`$${Number(value).toFixed(2)}`, String(name)]}
            />
            {retailers.map((ret, i) => {
              if (hasMultiplePoints) {
                return (
                  <Line 
                    key={ret}
                    type="monotone" 
                    dataKey={ret} 
                    name={ret}
                    stroke={colors[i % colors.length]} 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: "var(--color-card)", strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                );
              } else {
                return (
                  <Scatter 
                    key={ret} 
                    dataKey={ret} 
                    name={ret} 
                    fill={colors[i % colors.length]} 
                    shape="circle"
                  />
                );
              }
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
