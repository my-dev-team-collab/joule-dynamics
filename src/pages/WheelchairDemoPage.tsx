import { useState } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LogoLockup } from "@/components/ui/Logo";
import {
  Download,
  ExternalLink,
  Github,
  Copy,
  Check,
  Lock,
} from "lucide-react";

const VIDEO_STREAM_URL =
  "https://fra.cloud.appwrite.io/v1/storage/buckets/6a70ad87003e167ad223/files/6af4535a0012fa2b1bb1/view?project=6a70abbf00231780f102";

const VIDEO_DOWNLOAD_URL =
  "https://fra.cloud.appwrite.io/v1/storage/buckets/6a70ad87003e167ad223/files/6af4535a0012fa2b1bb1/download?project=6a70abbf00231780f102";

const GITHUB_REPO_URL =
  "https://github.com/JohnJodinho/smart-assistive-wheelchair";

export default function WheelchairDemoPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoLockup />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-muted text-[11px] font-mono text-muted-foreground border border-border">
              <Lock className="size-3 text-accent" />
              <span>DEMO</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground transition-colors min-h-[36px]"
              title="Copy page link"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-primary" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 text-muted-foreground" />
                  <span>SHARE LINK</span>
                </>
              )}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Video Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 w-full">
        {/* Title & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-muted text-foreground border border-border text-xs font-mono">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>EMBEDDED & ROBOTICS</span>
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              FIELD TEST RIDE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Smart Assistive Wheelchair: Test Ride Video
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground">
            100kg tested steel chassis · Sub-50ms deterministic sensing · Dual 12V DC motor control
          </p>
        </div>

        {/* Video Player */}
        <div className="rounded-lg border border-border bg-card/60 backdrop-blur-sm p-2 sm:p-3 shadow-xl space-y-3">
          <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black flex items-center justify-center">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain bg-black"
              aria-label="Smart Assistive Wheelchair field test ride video"
            >
              <source src={VIDEO_STREAM_URL} type="video/mp4" />
              Your browser does not support HTML5 video streaming. You can download the video below.
            </video>
          </div>

          {/* Action Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={VIDEO_DOWNLOAD_URL}
                download="Smart_Assistive_Wheelchair_Test_Ride.mp4"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors min-h-[36px]"
              >
                <Download className="size-3.5" />
                <span>Download MP4</span>
              </a>

              <a
                href={VIDEO_STREAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground transition-colors min-h-[36px]"
              >
                <ExternalLink className="size-3.5" />
                <span>Direct Stream</span>
              </a>

              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-border bg-card hover:bg-muted text-xs font-mono text-foreground transition-colors min-h-[36px]"
              >
                <Github className="size-3.5" />
                <span>GitHub</span>
              </a>
            </div>

            <span className="text-[11px] font-mono text-muted-foreground">
              1080p MP4
            </span>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-border bg-card py-5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span>Joule Dynamics</span>
          
        </div>
      </footer>
    </div>
  );
}
