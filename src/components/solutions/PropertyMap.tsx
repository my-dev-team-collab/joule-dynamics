/**
 * PropertyMap.tsx
 * Pattern: useRef + useEffect (official Mapbox React pattern from skill).
 */
import { useRef, useEffect, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import { useTheme } from "../theme-provider";

interface PropertyPoint {
  property_id: string;
  property_name: string;
  url: string;
  market: string;
  platform: string;
  latitude: number;
  longitude: number;
  nightly_rate: number | null;
  is_available: boolean;
  currency: string;
  pct_above_trailing_avg: number | null;
}

interface PropertyMapProps {
  data: PropertyPoint[];
  loading: boolean;
  totalProperties?: number;
}

export default function PropertyMap({ data, loading, totalProperties }: PropertyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { theme } = useTheme();

  const [mapReady, setMapReady] = useState(false);

  // Deduplicate properties (one marker per location)
  const properties = useMemo(() => {
    const seen = new Set<string>();
    const unique: PropertyPoint[] = [];
    for (const row of data) {
      if (!seen.has(row.property_id) && row.latitude !== null && row.longitude !== null) {
        seen.add(row.property_id);
        unique.push(row);
      }
    }
    return unique;
  }, [data]);

  // ── Initialise Mapbox map ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = import.meta.env.VITE_MAP_BOX_API_KEY as string | undefined;
    if (!token) {
      console.error("PropertyMap: VITE_MAP_BOX_API_KEY is not set");
      return;
    }

    const initialStyle = theme === 'light' 
      ? "mapbox://styles/mapbox/light-v11" 
      : "mapbox://styles/mapbox/dark-v11";

    mapRef.current = new mapboxgl.Map({
      accessToken: token,
      container: mapContainerRef.current,
      style: initialStyle,
      center: [-74.006, 40.7128], // NYC default
      zoom: 9,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    mapRef.current.on("load", () => {
      setMapReady(true);
    });

    // CRITICAL: cleanup to prevent memory leaks (per Mapbox skill requirement)
    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // Run once on mount

  // ── Sync Mapbox Style with Theme ──────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const style = theme === 'light' 
      ? "mapbox://styles/mapbox/light-v11" 
      : "mapbox://styles/mapbox/dark-v11";
    mapRef.current.setStyle(style);
  }, [theme, mapReady]);

  // ── Add/update markers when properties or map is ready ───────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || properties.length === 0) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    properties.forEach((prop: PropertyPoint) => {
      const isSurge = prop.pct_above_trailing_avg !== null && prop.pct_above_trailing_avg >= 25;
      const isDrop  = prop.pct_above_trailing_avg !== null && prop.pct_above_trailing_avg <= -25;
      const isUnavailable = !prop.is_available;

      const markerColor = isSurge ? "#f59e0b" : (isDrop ? "#10b981" : (isUnavailable ? "#6b7280" : "#f97316"));
      const markerBg = isSurge ? "rgba(245,158,11,0.15)" : (isDrop ? "rgba(16,185,129,0.15)" : (isUnavailable ? "rgba(107,114,128,0.15)" : "rgba(249,115,22,0.15)"));

      // Wrapper with 0 width/height ensures Mapbox calculates 0 offset,
      // and we manually position the marker center using left/top on the inner container.
      const el = document.createElement("div");
      el.style.cssText = "width: 0px; height: 0px;";

      const markerContainer = document.createElement("div");
      markerContainer.className = "property-map-marker";
      markerContainer.style.cssText = `
        position: absolute;
        left: -14px;
        top: -14px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `;

      const inner = document.createElement("div");
      inner.style.cssText = `
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid ${markerColor};
        background: ${markerBg};
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        transition: transform 0.15s ease-out;
      `;
      inner.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="${markerColor}"><circle cx="12" cy="12" r="6"/></svg>`;
      
      markerContainer.appendChild(inner);
      el.appendChild(markerContainer);

      markerContainer.addEventListener("mouseenter", () => { inner.style.transform = "scale(1.2)"; });
      markerContainer.addEventListener("mouseleave", () => { inner.style.transform = "scale(1)"; });

      // Popup content
      const rateStr = prop.nightly_rate != null
        ? `${prop.currency === "USD" ? "$" : prop.currency}${prop.nightly_rate.toFixed(0)}/night`
        : "Rate unavailable";
      
      const pctColor = isSurge ? "#fbbf24" : (isDrop ? "#34d399" : "#9ca3af");
      const pctBadge = isSurge ? "▲ SURGE" : (isDrop ? "▼ DROP" : "");
      const pctStr = prop.pct_above_trailing_avg != null
        ? `<div style="color:${pctColor};font-size:11px;margin-bottom:4px;display:flex;align-items:center;gap:4px">
            <span>${prop.pct_above_trailing_avg > 0 ? "▲ +" : (prop.pct_above_trailing_avg < 0 ? "▼ " : "")}${prop.pct_above_trailing_avg.toFixed(1)}% vs 7d avg</span>
            ${pctBadge ? `<span style="font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;background:rgba(255,255,255,0.1);border:1px solid currentColor">${pctBadge}</span>` : ""}
          </div>`
        : "";

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: true, maxWidth: "260px" })
        .setHTML(`
          <div style="font-family:system-ui,sans-serif;font-size:12px;padding:4px 0;color:#e5e7eb">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px;color:#9ca3af">${prop.property_name}</div>
            <div style="color:#9ca3af;margin-bottom:6px">${prop.market} · ${prop.platform}</div>
            <div style="font-weight:700;font-size:14px;color:${isSurge ? "#f59e0b" : isDrop ? "#10b981" : "#9ca3af"};margin-bottom:2px">${rateStr}</div>
            ${pctStr}
            <div style="color:${prop.is_available ? "#4ade80" : "#9ca3af"};font-size:11px">${prop.is_available ? "✓ Available" : "Unavailable"}</div>
            ${prop.url ? `<a href="${prop.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:6px;color:#f97316;font-size:11px;text-decoration:none">View listing →</a>` : ""}
          </div>
        `);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([prop.longitude, prop.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    // Auto-fit bounds to all markers
    if (properties.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      properties.forEach((p: PropertyPoint) => bounds.extend([p.longitude, p.latitude]));
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 800 });
    } else if (properties.length === 1) {
      mapRef.current.flyTo({ center: [properties[0].longitude, properties[0].latitude], zoom: 12 });
    }
  }, [mapReady, properties]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <MapPin className="size-4 text-primary" />
        <h4 className="font-semibold text-foreground">Property Locations</h4>
        {!loading && properties.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            {totalProperties && totalProperties > properties.length 
              ? `${properties.length} of ${totalProperties} mapped (${totalProperties - properties.length} missing location data)`
              : `${properties.length} tracked ${properties.length === 1 ? "property" : "properties"}`}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground -mt-1">
        Geographic distribution of tracked inventory colored by current availability and pricing anomalies.
      </p>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary/80 border border-primary" />
          Active
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500/30 border border-amber-500" />
          Rate spike ≥ 25%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-muted/40 border border-muted-foreground/40" />
          Unavailable
        </span>
      </div>

      <div className="relative w-full rounded-lg border border-border overflow-hidden">
        {/* Loading skeleton */}
        {loading && (
          <div className="absolute inset-0 bg-muted/20 animate-pulse flex items-center justify-center z-10">
            <span className="text-xs text-muted-foreground">Loading map…</span>
          </div>
        )}

        {/* No coordinates message */}
        {!loading && properties.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-card/80 gap-2">
            <MapPin className="size-6 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground">No coordinate data yet. Latitude and longitude will populate after the view update runs.</p>
          </div>
        )}

        {/* Map container — always rendered so Mapbox can attach */}
        <div
          ref={mapContainerRef}
          style={{ height: "380px", width: "100%" }}
          className="bg-muted/10"
        />
      </div>
    </div>
  );
}
