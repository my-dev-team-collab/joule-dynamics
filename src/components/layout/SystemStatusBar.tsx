/**
 * SystemStatusBar.tsx
 * Repurposed (revamp): adds the Dev Hub badge + tooltip from config.devHub,
 * alongside the existing telemetry readouts. The badge turns the Vercel subdomain
 * from a potential credibility gap into a transparency signal.
 */
import { useState, useEffect } from "react";
import config from "@/data/config.json";
import type { RootConfig } from "@/types/data";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoIcon, LogoLockup } from "@/components/ui/Logo";
import { Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface TelemetryData {
  uptime_pct: number;
  latency_ms: number;
  status: string;
}

const { devHub } = config as unknown as RootConfig;

export function SystemStatusBar() {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);

  useEffect(() => {
    async function fetchTelemetry() {
      try {
        const { data, error } = await supabase
          .from("v_latest_telemetry")
          .select("*")
          .limit(1)
          .maybeSingle();
        
        if (data && !error) {
          setTelemetry(data as TelemetryData);
        }
      } catch (err) {
        // Silently ignore, just means we won't render telemetry
      }
    }
    fetchTelemetry();
  }, []);

  const navLinks = [
    { label: "// SOLUTIONS", href: "/#solutions" },
    { label: "// HOW IT WORKS", href: "/#how-it-works" },
    { label: "// LIVE SYSTEMS", href: "/live-systems" },
    { label: "// ABOUT", href: "/#about" },
    { label: "// GET AUDIT", href: "/#contact" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between gap-4">

        {/* Left: Brand slug & Desktop Nav */}
        <div className="flex items-center gap-6">
          <span className="shrink-0 flex items-center">
            <a href="/" className="hover:opacity-80 transition-opacity flex items-center">
              {/* Icon-only on mobile, full lockup on sm+ */}
              <LogoIcon className="h-5 w-auto sm:hidden" />
              <LogoLockup className="h-5 w-auto hidden sm:block text-zinc-900 dark:text-white" />
            </a>
          </span>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-5">
            {navLinks.map((link) => (
              <a 
                key={link.label}
                href={link.href} 
                className="font-mono text-[10px] tracking-widest text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Center / Right: Dev Hub badge + telemetry + theme toggle */}
        <div className="flex items-center gap-3 ml-auto">

          {/* ── Dev Hub Badge ── */}
          <div className="relative hidden sm:flex">
            <button
              type="button"
              className="
                flex items-center gap-1.5 rounded-sm border border-amber-500/30
                bg-amber-500/8 px-2.5 py-1 font-mono text-[10px] tracking-wide
                text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/15
                transition-all duration-150 cursor-help
              "
              aria-label={devHub.tooltip}
              onMouseEnter={() => setTooltipVisible(true)}
              onMouseLeave={() => setTooltipVisible(false)}
              onFocus={() => setTooltipVisible(true)}
              onBlur={() => setTooltipVisible(false)}
            >
              {devHub.badgeLabel}
            </button>

            {/* Tooltip */}
            {tooltipVisible && (
              <div
                role="tooltip"
                className="
                  absolute top-full left-0 mt-2 z-50 w-72 rounded-md border border-border
                  bg-popover p-3 text-xs text-muted-foreground leading-relaxed shadow-lg
                "
              >
                {devHub.tooltip}
              </div>
            )}
          </div>

          {/* ── Telemetry readouts (hidden on very small screens) ── */}
          {telemetry && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">UPTIME</span>
                <span className="font-mono text-[10px] text-primary font-bold">{telemetry.uptime_pct}%</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] text-muted-foreground">LATENCY</span>
                <span className="font-mono text-[10px] text-primary font-bold">{telemetry.latency_ms}ms</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${telemetry.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${telemetry.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`} />
                </span>
                <span className={`font-mono text-[10px] font-bold tracking-widest ${telemetry.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}`}>
                  {telemetry.status}
                </span>
              </div>
            </div>
          )}

          {/* Theme toggle — always visible */}
          <ThemeToggle />

          {/* Mobile menu toggle */}
          <button 
            className="lg:hidden text-muted-foreground hover:text-foreground p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-3 shadow-lg">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a 
                key={link.label}
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="font-mono text-[10px] tracking-widest text-muted-foreground hover:text-primary transition-colors py-1"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
