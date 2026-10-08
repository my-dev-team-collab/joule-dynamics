import { useState, useEffect, useRef, useMemo } from "react";
import config from "@/data/config.json";
import type { PortfolioProject } from "@/types/data";

interface PortfolioIsoFigureProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  hoveredCategory?: string | null;
  onHoverCategory?: (category: string | null) => void;
  onSelectProject?: (project: PortfolioProject) => void;
}

interface TowerMeta {
  id: string;
  category: string;
  shortName: string;
  x: number;
  y: number;
  crownType: "routing" | "quant" | "conveyor" | "ultrasonic";
  leaderElbow: [number, number];
  leaderShelfEnd: [number, number];
  titlePos: [number, number];
  countPos: [number, number];
  textAnchor: "start" | "end";
}

export function PortfolioIsoFigure({
  selectedCategory = "All",
  onSelectCategory,
  hoveredCategory,
  onHoverCategory,
  onSelectProject,
}: PortfolioIsoFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const towerRefs = useRef<(SVGGElement | null)[]>([]);

  const [hoveredTowerId, setHoveredTowerId] = useState<string | null>(null);
  const [hoveredFloorKey, setHoveredFloorKey] = useState<string | null>(null);
  const [hoveredProject, setHoveredProject] = useState<PortfolioProject | null>(null);

  const [idleTowerIndex, setIdleTowerIndex] = useState<number>(0);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(true);

  // Group projects from real config.json data
  const projects = useMemo(() => {
    return (config.projects as PortfolioProject[]) || [];
  }, []);

  const towers: TowerMeta[] = [
    {
      id: "agentic-rag",
      category: "Agentic RAG",
      shortName: "Agentic RAG",
      x: -125,
      y: -20,
      crownType: "routing",
      leaderElbow: [140, 74],
      leaderShelfEnd: [20, 74],
      titlePos: [20, 50],
      countPos: [20, 68],
      textAnchor: "start",
    },
    {
      id: "model-training",
      category: "Model Training & Fine-Tuning",
      shortName: "Model Training & Fine-Tuning",
      x: -20,
      y: -125,
      crownType: "quant",
      leaderElbow: [500, 74],
      leaderShelfEnd: [620, 74],
      titlePos: [620, 50],
      countPos: [620, 68],
      textAnchor: "end",
    },
    {
      id: "data-intel",
      category: "Data & Web Intelligence",
      shortName: "Data & Web Intelligence",
      x: -50,
      y: 85,
      crownType: "conveyor",
      leaderElbow: [140, 406],
      leaderShelfEnd: [20, 406],
      titlePos: [20, 424],
      countPos: [20, 442],
      textAnchor: "start",
    },
    {
      id: "embedded-robotics",
      category: "Embedded & Robotics",
      shortName: "Embedded & Robotics",
      x: 85,
      y: -50,
      crownType: "ultrasonic",
      leaderElbow: [500, 406],
      leaderShelfEnd: [620, 406],
      titlePos: [620, 424],
      countPos: [620, 442],
      textAnchor: "end",
    },
  ];

  // Map category to projects list
  const categoryProjectsMap = useMemo(() => {
    const map = new Map<string, PortfolioProject[]>();
    towers.forEach((t) => {
      map.set(
        t.category,
        projects.filter((p) => p.category === t.category)
      );
    });
    return map;
  }, [projects]);

  // Isometric projection constants: 30-degree angle
  const C = Math.cos(Math.PI / 6);
  const S = Math.sin(Math.PI / 6);
  const OX = 320;
  const OY = 240;

  const P = (x: number, y: number, z: number): [number, number] => [
    (x - y) * C + OX,
    (x + y) * S - z + OY,
  ];

  // Idle pulse timer: pulses one tower at a time every 5.5s, pausing when hidden or offscreen
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    let timer: number | null = null;

    const startTimer = () => {
      if (timer === null && isIntersecting && !document.hidden) {
        timer = window.setInterval(() => {
          setIdleTowerIndex((prev) => (prev + 1) % towers.length);
        }, 5500);
      }
    };

    const stopTimer = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    startTimer();

    const handleVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopTimer();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isIntersecting, towers.length]);

  // IntersectionObserver to pause idle pulse when off-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleTowerClick = (category: string) => {
    if (onSelectCategory) {
      if (selectedCategory === category) {
        onSelectCategory("All");
      } else {
        onSelectCategory(category);
      }
    }
  };

  const handleTowerKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    category: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTowerClick(category);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onSelectCategory?.("All");
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (index + 1) % towers.length;
      towerRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (index + towers.length - 1) % towers.length;
      towerRefs.current[prev]?.focus();
    }
  };

  // Dimensions: taller towers so each floor is a clearly defined, hoverable band
  const W = 68;
  const D = 68;
  const FLOOR_H = 26;
  const FLOOR_GAP = 5;
  const BASE_Z = 8;

  // Selected state info
  const selectedCount =
    selectedCategory !== "All"
      ? (categoryProjectsMap.get(selectedCategory) || []).length
      : 0;

  return (
    <div
      ref={containerRef}
      className="w-full select-none flex flex-col items-center"
    >
      <div className="relative w-full">
        {/* Interactive SVG Stage without constricting outer box */}
        <div className="relative w-full">
          <svg
            viewBox="0 0 640 480"
            className="w-full h-auto aspect-[4/3] block"
            role="region"
            aria-label="Interactive isometric domain filter figure"
          >
            <defs>
              <filter
                id="iso-cyan-glow"
                filterUnits="userSpaceOnUse"
                x="-200%"
                y="-200%"
                width="500%"
                height="500%"
              >
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <style>{`
                @keyframes iso-idle-sweep {
                  0% { opacity: 0; transform: translateY(8px); }
                  50% { opacity: 1; }
                  100% { opacity: 0; transform: translateY(-30px); }
                }
                @keyframes iso-sonar-ping {
                  0% { r: 6px; opacity: 0.9; }
                  100% { r: 24px; opacity: 0; }
                }
                @keyframes iso-conveyor-packet {
                  0% { transform: translate(0px, 0px); opacity: 0; }
                  20% { opacity: 1; }
                  80% { opacity: 1; }
                  100% { transform: translate(22px, -13px); opacity: 0; }
                }
                .iso-idle-beam {
                  animation: iso-idle-sweep 2.2s ease-in-out infinite;
                }
                .iso-sonar-wave {
                  animation: iso-sonar-ping 2.6s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
                }
                .iso-packet-anim {
                  animation: iso-conveyor-packet 2.8s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                  .iso-idle-beam, .iso-sonar-wave, .iso-packet-anim {
                    animation: none !important;
                  }
                }
              `}</style>
            </defs>

            {/* Base Motherboard Ground Plate */}
            {(() => {
              const bX = -155;
              const bY = -155;
              const bW = 310;
              const bD = 310;
              const p1 = P(bX + bW, bY, 0);
              const p2 = P(bX + bW, bY + bD, 0);
              const p3 = P(bX, bY + bD, 0);

              const pt0 = P(bX, bY, BASE_Z);
              const pt1 = P(bX + bW, bY, BASE_Z);
              const pt2 = P(bX + bW, bY + bD, BASE_Z);
              const pt3 = P(bX, bY + bD, BASE_Z);

              return (
                <g className="pointer-events-none">
                  {/* Base Left Face */}
                  <polygon
                    points={`${pt3[0]},${pt3[1]} ${pt2[0]},${pt2[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`}
                    fill="var(--iso-left)"
                    stroke="var(--iso-edge)"
                    strokeWidth="1"
                  />
                  {/* Base Right Face */}
                  <polygon
                    points={`${pt1[0]},${pt1[1]} ${pt2[0]},${pt2[1]} ${p2[0]},${p2[1]} ${p1[0]},${p1[1]}`}
                    fill="var(--iso-right)"
                    stroke="var(--iso-edge)"
                    strokeWidth="1"
                  />
                  {/* Base Top Face */}
                  <polygon
                    points={`${pt0[0]},${pt0[1]} ${pt1[0]},${pt1[1]} ${pt2[0]},${pt2[1]} ${pt3[0]},${pt3[1]}`}
                    fill="var(--iso-top)"
                    stroke="var(--iso-edge)"
                    strokeWidth="1"
                  />

                  {/* Grid Circuit Traces on Base Top */}
                  {(() => {
                    const cCenter = P(0, 0, BASE_Z + 0.2);
                    const cT0 = P(-95, 15, BASE_Z + 0.2);
                    const cT1 = P(15, -95, BASE_Z + 0.2);
                    const cT2 = P(-15, 115, BASE_Z + 0.2);
                    const cT3 = P(115, -15, BASE_Z + 0.2);
                    return (
                      <g
                        stroke="var(--iso-edge)"
                        strokeWidth="1"
                        strokeDasharray="4 3"
                        fill="none"
                      >
                        <path
                          d={`M ${cCenter[0]} ${cCenter[1]} L ${cT0[0]} ${cT0[1]}`}
                        />
                        <path
                          d={`M ${cCenter[0]} ${cCenter[1]} L ${cT1[0]} ${cT1[1]}`}
                        />
                        <path
                          d={`M ${cCenter[0]} ${cCenter[1]} L ${cT2[0]} ${cT2[1]}`}
                        />
                        <path
                          d={`M ${cCenter[0]} ${cCenter[1]} L ${cT3[0]} ${cT3[1]}`}
                        />
                        <circle
                          cx={cCenter[0]}
                          cy={cCenter[1]}
                          r="3"
                          fill="var(--iso-edge-active)"
                        />
                      </g>
                    );
                  })()}
                </g>
              );
            })()}

            {/* Render Towers in Depth-Sorted Order (Back to Front) */}
            {towers.map((tower, towerIdx) => {
              const towerProjects =
                categoryProjectsMap.get(tower.category) || [];
              const floorCount = Math.max(1, towerProjects.length);
              const towerHeight =
                floorCount * FLOOR_H + (floorCount - 1) * FLOOR_GAP;
              const apexZ = BASE_Z + towerHeight;

              const isSelected = selectedCategory === tower.category;
              const isAnySelected =
                selectedCategory !== "All" && selectedCategory !== "";
              const isDimmed = isAnySelected && !isSelected;

              const isHovered =
                hoveredTowerId === tower.id ||
                hoveredCategory === tower.category;
              const isIdlePulse = idleTowerIndex === towerIdx;

              // Anchor coordinates for leader line
              const anchorPt = P(tower.x + W / 2, tower.y + D / 2, apexZ);

              return (
                <g
                  key={tower.id}
                  ref={(el) => {
                    towerRefs.current[towerIdx] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${tower.category}, ${floorCount} projects. Filter by domain.`}
                  aria-pressed={isSelected}
                  onKeyDown={(e) =>
                    handleTowerKeyDown(e, towerIdx, tower.category)
                  }
                  onClick={() => handleTowerClick(tower.category)}
                  onMouseEnter={() => {
                    setHoveredTowerId(tower.id);
                    onHoverCategory?.(tower.category);
                  }}
                  onMouseLeave={() => {
                    setHoveredTowerId(null);
                    onHoverCategory?.(null);
                  }}
                  className="cursor-pointer focus:outline-none"
                  style={{
                    opacity: isDimmed ? 0.6 : 1,
                    transition:
                      "opacity 0.25s ease, transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    transform: isHovered
                      ? "translateY(-6px)"
                      : "translateY(0px)",
                  }}
                >
                  {/* Tower hit area polygon */}
                  {(() => {
                    const h0 = P(tower.x - 8, tower.y - 8, BASE_Z);
                    const h1 = P(tower.x + W + 8, tower.y - 8, BASE_Z);
                    const h2 = P(tower.x + W + 8, tower.y + D + 8, apexZ + 30);
                    const h3 = P(tower.x - 8, tower.y + D + 8, apexZ + 30);
                    return (
                      <polygon
                        points={`${h0[0]},${h0[1]} ${h1[0]},${h1[1]} ${h2[0]},${h2[1]} ${h3[0]},${h3[1]}`}
                        fill="transparent"
                        className="pointer-events-auto"
                      />
                    );
                  })()}

                  {/* Render Floors: One floor per project */}
                  {Array.from({ length: floorCount }).map((_, floorIdx) => {
                    const project = towerProjects[floorIdx];
                    const floorZ =
                      BASE_Z + floorIdx * (FLOOR_H + FLOOR_GAP);
                    const floorKey = `${tower.id}-${floorIdx}`;
                    const isFloorHovered = hoveredFloorKey === floorKey;

                    // Vertices for Top face
                    const pt0 = P(tower.x, tower.y, floorZ + FLOOR_H);
                    const pt1 = P(tower.x + W, tower.y, floorZ + FLOOR_H);
                    const pt2 = P(tower.x + W, tower.y + D, floorZ + FLOOR_H);
                    const pt3 = P(tower.x, tower.y + D, floorZ + FLOOR_H);

                    // Vertices for Left face
                    const pb3 = P(tower.x, tower.y + D, floorZ);
                    const pb2 = P(tower.x + W, tower.y + D, floorZ);

                    // Vertices for Right face
                    const pb1 = P(tower.x + W, tower.y, floorZ);

                    // Stroke colors
                    const strokeColor =
                      isHovered || isSelected || isFloorHovered
                        ? "var(--iso-edge-active)"
                        : "var(--iso-edge)";
                    const strokeWidth =
                      isHovered || isSelected || isFloorHovered ? "1.6" : "1.2";

                    // Glow filter
                    const filterStyle =
                      (isSelected || isHovered)
                        ? "url(#iso-cyan-glow)"
                        : undefined;

                    return (
                      <g
                        key={floorKey}
                        onClick={(e) => {
                          if (project) {
                            e.stopPropagation();
                            onSelectProject?.(project);
                          }
                        }}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHoveredFloorKey(floorKey);
                          if (project) {
                            setHoveredProject(project);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredFloorKey(null);
                          setHoveredProject(null);
                        }}
                        className="transition-all duration-150"
                        filter={filterStyle}
                      >
                        {/* Floor Left Face */}
                        <polygon
                          points={`${pt3[0]},${pt3[1]} ${pt2[0]},${pt2[1]} ${pb2[0]},${pb2[1]} ${pb3[0]},${pb3[1]}`}
                          fill="var(--iso-left)"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                        />

                        {/* Floor Right Face */}
                        <polygon
                          points={`${pt1[0]},${pt1[1]} ${pt2[0]},${pt2[1]} ${pb2[0]},${pb2[1]} ${pb1[0]},${pb1[1]}`}
                          fill="var(--iso-right)"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                        />

                        {/* Floor Top Face */}
                        <polygon
                          points={`${pt0[0]},${pt0[1]} ${pt1[0]},${pt1[1]} ${pt2[0]},${pt2[1]} ${pt3[0]},${pt3[1]}`}
                          fill="var(--iso-top)"
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                        />

                        {/* Vertical Accent Ridge (Cyan tint even at rest) */}
                        <line
                          x1={pb2[0]}
                          y1={pb2[1]}
                          x2={pt2[0]}
                          y2={pt2[1]}
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.5"
                        />

                        {/* Status Marker Dot on Floor Front Edge */}
                        {(() => {
                          const dotP = P(
                            tower.x + 14,
                            tower.y + D,
                            floorZ + FLOOR_H / 2
                          );
                          const isDotAlert = isFloorHovered;
                          return (
                            <circle
                              cx={dotP[0]}
                              cy={dotP[1]}
                              r={isFloorHovered ? "3.5" : "2"}
                              fill={
                                isDotAlert
                                  ? "var(--iso-accent)"
                                  : isSelected
                                  ? "var(--iso-edge-active)"
                                  : "var(--iso-edge)"
                              }
                            />
                          );
                        })()}

                        {/* Floor groove slits */}
                        {(() => {
                          const s0 = P(
                            tower.x + 24,
                            tower.y + D,
                            floorZ + FLOOR_H / 2
                          );
                          const s1 = P(
                            tower.x + W - 10,
                            tower.y + D,
                            floorZ + FLOOR_H / 2
                          );
                          return (
                            <line
                              x1={s0[0]}
                              y1={s0[1]}
                              x2={s1[0]}
                              y2={s1[1]}
                              stroke="var(--iso-edge)"
                              strokeWidth="1"
                              strokeDasharray="3 2"
                            />
                          );
                        })()}
                      </g>
                    );
                  })}

                  {/* Distinct Tower Crowns */}
                  {/* Crown 1: Agentic RAG - Routing Beam entering and splitting */}
                  {tower.crownType === "routing" && (() => {
                    const topCenter = P(
                      tower.x + W / 2,
                      tower.y + D / 2,
                      apexZ
                    );
                    const beamTop = P(
                      tower.x + W / 2,
                      tower.y + D / 2,
                      apexZ + 20
                    );
                    const b0 = P(tower.x + 8, tower.y + 8, apexZ + 3);
                    const b1 = P(tower.x + W - 8, tower.y + 8, apexZ + 3);
                    const b2 = P(tower.x + W - 8, tower.y + D - 8, apexZ + 3);
                    const b3 = P(tower.x + 8, tower.y + D - 8, apexZ + 3);

                    return (
                      <g className="pointer-events-none">
                        {/* Main vertical incoming beam */}
                        <line
                          x1={beamTop[0]}
                          y1={beamTop[1]}
                          x2={topCenter[0]}
                          y2={topCenter[1]}
                          stroke="var(--iso-edge-active)"
                          strokeWidth="2"
                        />
                        <circle
                          cx={beamTop[0]}
                          cy={beamTop[1]}
                          r="3"
                          fill="var(--iso-edge-active)"
                        />

                        {/* Branching routing rays */}
                        <line
                          x1={topCenter[0]}
                          y1={topCenter[1]}
                          x2={b0[0]}
                          y2={b0[1]}
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line
                          x1={topCenter[0]}
                          y1={topCenter[1]}
                          x2={b1[0]}
                          y2={b1[1]}
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line
                          x1={topCenter[0]}
                          y1={topCenter[1]}
                          x2={b2[0]}
                          y2={b2[1]}
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />
                        <line
                          x1={topCenter[0]}
                          y1={topCenter[1]}
                          x2={b3[0]}
                          y2={b3[1]}
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                          strokeDasharray="3 2"
                        />

                        {/* Router node points */}
                        <circle
                          cx={topCenter[0]}
                          cy={topCenter[1]}
                          r="2.5"
                          fill="var(--iso-accent)"
                        />
                        <circle
                          cx={b0[0]}
                          cy={b0[1]}
                          r="1.8"
                          fill="var(--iso-edge-active)"
                        />
                        <circle
                          cx={b1[0]}
                          cy={b1[1]}
                          r="1.8"
                          fill="var(--iso-edge-active)"
                        />
                        <circle
                          cx={b2[0]}
                          cy={b2[1]}
                          r="1.8"
                          fill="var(--iso-edge-active)"
                        />
                        <circle
                          cx={b3[0]}
                          cy={b3[1]}
                          r="1.8"
                          fill="var(--iso-edge-active)"
                        />
                      </g>
                    );
                  })()}

                  {/* Crown 2: Model Training - INT8 Quantization Slab (shrinks on hover) */}
                  {tower.crownType === "quant" && (() => {
                    const pad = isHovered ? 18 : 6;
                    const slabZ = apexZ + 3;
                    const slabH = 6;
                    const q0 = P(tower.x + pad, tower.y + pad, slabZ + slabH);
                    const q1 = P(
                      tower.x + W - pad,
                      tower.y + pad,
                      slabZ + slabH
                    );
                    const q2 = P(
                      tower.x + W - pad,
                      tower.y + D - pad,
                      slabZ + slabH
                    );
                    const q3 = P(
                      tower.x + pad,
                      tower.y + D - pad,
                      slabZ + slabH
                    );

                    const qb2 = P(
                      tower.x + W - pad,
                      tower.y + D - pad,
                      slabZ
                    );
                    const qb3 = P(tower.x + pad, tower.y + D - pad, slabZ);
                    const qb1 = P(tower.x + W - pad, tower.y + pad, slabZ);

                    return (
                      <g
                        className="pointer-events-none"
                        style={{
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        <polygon
                          points={`${q3[0]},${q3[1]} ${q2[0]},${q2[1]} ${qb2[0]},${qb2[1]} ${qb3[0]},${qb3[1]}`}
                          fill="var(--iso-left)"
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                        />
                        <polygon
                          points={`${q1[0]},${q1[1]} ${q2[0]},${q2[1]} ${qb2[0]},${qb2[1]} ${qb1[0]},${qb1[1]}`}
                          fill="var(--iso-right)"
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                        />
                        <polygon
                          points={`${q0[0]},${q0[1]} ${q1[0]},${q1[1]} ${q2[0]},${q2[1]} ${q3[0]},${q3[1]}`}
                          fill="var(--iso-top)"
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                        />
                      </g>
                    );
                  })()}

                  {/* Crown 3: Data Intelligence - Packet conveyor belt at base */}
                  {tower.crownType === "conveyor" && (() => {
                    const cStart = P(tower.x + 8, tower.y + D + 26, BASE_Z);
                    const cEnd = P(tower.x + 8, tower.y + D, BASE_Z);
                    const cSideStart = P(
                      tower.x + 22,
                      tower.y + D + 26,
                      BASE_Z
                    );
                    const cSideEnd = P(tower.x + 22, tower.y + D, BASE_Z);

                    return (
                      <g className="pointer-events-none">
                        {/* Conveyor track */}
                        <polygon
                          points={`${cStart[0]},${cStart[1]} ${cSideStart[0]},${cSideStart[1]} ${cSideEnd[0]},${cSideEnd[1]} ${cEnd[0]},${cEnd[1]}`}
                          fill="var(--iso-left)"
                          stroke="var(--iso-edge)"
                          strokeWidth="1"
                        />
                        {/* Travelling packets */}
                        <g className="iso-packet-anim">
                          <circle
                            cx={cStart[0] + 4}
                            cy={cStart[1] - 2}
                            r="2.5"
                            fill="var(--iso-edge-active)"
                          />
                        </g>
                        <g
                          className="iso-packet-anim"
                          style={{ animationDelay: "1.4s" }}
                        >
                          <circle
                            cx={cStart[0] + 4}
                            cy={cStart[1] - 2}
                            r="2.5"
                            fill="var(--iso-accent)"
                          />
                        </g>
                      </g>
                    );
                  })()}

                  {/* Crown 4: Embedded & Robotics - Sensor turret with expanding ultrasonic arcs */}
                  {tower.crownType === "ultrasonic" && (() => {
                    const turretCenter = P(
                      tower.x + W / 2,
                      tower.y + D / 2,
                      apexZ + 6
                    );
                    return (
                      <g className="pointer-events-none">
                        {/* Sensor emitter cylinder */}
                        <circle
                          cx={turretCenter[0]}
                          cy={turretCenter[1]}
                          r="4"
                          fill="var(--iso-top)"
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.5"
                        />
                        <circle
                          cx={turretCenter[0]}
                          cy={turretCenter[1]}
                          r="2"
                          fill="var(--iso-accent)"
                        />

                        {/* Sonar / ultrasonic expanding waves */}
                        <ellipse
                          cx={turretCenter[0]}
                          cy={turretCenter[1]}
                          rx="10"
                          ry="5"
                          fill="none"
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1.2"
                          className="iso-sonar-wave"
                        />
                        <ellipse
                          cx={turretCenter[0]}
                          cy={turretCenter[1]}
                          rx="16"
                          ry="8"
                          fill="none"
                          stroke="var(--iso-edge-active)"
                          strokeWidth="1"
                          className="iso-sonar-wave"
                          style={{ animationDelay: "1.2s" }}
                        />
                      </g>
                    );
                  })()}

                  {/* Idle light pulse sweep */}
                  {isIdlePulse && (
                    <circle
                      cx={anchorPt[0]}
                      cy={anchorPt[1]}
                      r="4"
                      fill="var(--iso-edge-active)"
                      className="iso-idle-beam pointer-events-none"
                    />
                  )}

                  {/* Drafting Leader Lines and Always-Visible Labels */}
                  {(() => {
                    const elbow = tower.leaderElbow;
                    const shelfEnd = tower.leaderShelfEnd;
                    const anchor = anchorPt;

                    return (
                      <g className="pointer-events-none">
                        {/* Thin drafting leader line */}
                        <path
                          d={`M ${anchor[0]} ${anchor[1]} L ${elbow[0]} ${elbow[1]} L ${shelfEnd[0]} ${shelfEnd[1]}`}
                          fill="none"
                          stroke={
                            isSelected || isHovered
                              ? "var(--iso-edge-active)"
                              : "var(--iso-edge)"
                          }
                          strokeWidth="1"
                        />
                        {/* Anchor dot on tower */}
                        <circle
                          cx={anchor[0]}
                          cy={anchor[1]}
                          r="2.5"
                          fill={
                            isSelected || isHovered
                              ? "var(--iso-edge-active)"
                              : "var(--iso-edge)"
                          }
                        />

                        {/* Domain Category Label */}
                        <text
                          x={tower.titlePos[0]}
                          y={tower.titlePos[1]}
                          textAnchor={tower.textAnchor}
                          fontSize="14"
                          className="font-sans font-semibold text-[14px] fill-foreground"
                          style={{ fontSize: "14px" }}
                        >
                          {tower.shortName}
                        </text>

                        {/* Project Count Label */}
                        <text
                          x={tower.countPos[0]}
                          y={tower.countPos[1]}
                          textAnchor={tower.textAnchor}
                          fontSize="12"
                          className="font-mono text-[12px] fill-muted-foreground"
                          style={{ fontSize: "12px" }}
                        >
                          {floorCount} {floorCount === 1 ? "project" : "projects"}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </svg>

          {/* Docked Floor Readout: Pinned at bottom edge outside all blocks */}
          {hoveredProject && (
            <div
              className="absolute bottom-2 left-3 right-3 z-20 pointer-events-none rounded-sm border border-border bg-card/95 backdrop-blur-sm px-3 py-1.5 shadow-sm text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="size-2 rounded-full bg-accent shrink-0 animate-pulse" />
                <span className="text-foreground font-semibold truncate">
                  {hoveredProject.title}
                </span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  · {hoveredProject.status}
                </span>
              </div>
              <span className="text-primary text-xs underline shrink-0">
                Click floor for breakdown
              </span>
            </div>
          )}
        </div>

        {/* Readout Footer Strip: Never covers any block */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs sm:text-sm font-sans min-h-[44px]">
          {hoveredProject ? (
            <p className="text-foreground truncate pr-2">
              <span className="font-semibold">{hoveredProject.title}</span>{" "}
              <span className="text-xs font-mono text-muted-foreground">({hoveredProject.status})</span>.{" "}
              <span className="text-primary underline">Click floor to view details.</span>
            </p>
          ) : selectedCategory !== "All" ? (
            <p className="text-foreground">
              <span className="font-semibold">{selectedCategory}</span>,{" "}
              {selectedCount} {selectedCount === 1 ? "project" : "projects"}.{" "}
              <button
                type="button"
                onClick={() => onSelectCategory?.("All")}
                className="text-primary underline cursor-pointer hover:text-primary/90 ml-1"
              >
                Select again to clear.
              </button>
            </p>
          ) : (
            <p className="text-muted-foreground">
              Select a tower or floor to filter projects by domain.
            </p>
          )}

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{projects.length} BUILDS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
