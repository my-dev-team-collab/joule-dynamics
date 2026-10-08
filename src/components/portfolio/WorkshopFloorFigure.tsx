import { useState, useEffect, useRef, useMemo } from "react";
import type { PortfolioProject, ChassisTier } from "@/types/data";
import { ArrowRight, Github, ExternalLink } from "lucide-react";

interface WorkshopFloorFigureProps {
  projects: PortfolioProject[];
  selectedCategory?: string;
  searchQuery?: string;
  onSelectProjectForModal: (project: PortfolioProject) => void;
}

export function WorkshopFloorFigure({
  projects,
  selectedCategory = "All",
  searchQuery = "",
  onSelectProjectForModal,
}: WorkshopFloorFigureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<SVGSVGElement>(null);

  // Filter projects according to category and search query
  const filteredCartridges = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" || project.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;
      const matchesSearch =
        project.title.toLowerCase().includes(q) ||
        project.subtitle.toLowerCase().includes(q) ||
        project.challenge.toLowerCase().includes(q) ||
        project.techStack.some((tech) => tech.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  // If filtered list is empty, section should collapse
  const isCollapsed = filteredCartridges.length === 0;

  // Selected cartridge ID and interactive trigger state
  const [selectedCartridgeId, setSelectedCartridgeId] = useState<string | null>(null);
  const [activeCartIdx, setActiveCartIdx] = useState<number | null>(null);
  const [animCounter, setAnimCounter] = useState<number>(0);
  const animTimersRef = useRef<number[]>([]);

  // Request counter per cartridge
  const [counts, setCounts] = useState<{ [id: string]: number }>({});
  const [totalRequests, setTotalRequests] = useState<number>(0);

  // Active project for the detail panel
  const activeProject = useMemo(() => {
    if (selectedCartridgeId) {
      const found = filteredCartridges.find((p) => p.id === selectedCartridgeId);
      if (found) return found;
    }
    return filteredCartridges[0] || null;
  }, [selectedCartridgeId, filteredCartridges]);

  // Derive dynamic chassis tiers for the active project
  const activeTiers = useMemo<ChassisTier[]>(() => {
    if (!activeProject) return [];
    if (activeProject.chassisTiers && activeProject.chassisTiers.length > 0) {
      return activeProject.chassisTiers;
    }
    return [
      {
        title: "SERVICE INGESTION",
        subtitle: `${activeProject.category} Ingestion Layer`,
        badge: "ACTIVE",
        accent: true,
      },
      {
        title: "TRANSFORMATION ENGINE",
        subtitle: `${activeProject.techStack.slice(0, 2).join(" / ")} Logic`,
        badge: "READY",
      },
      {
        title: "DATA PERSISTENCE",
        subtitle: activeProject.highlightMetric,
        badge: "SYNCED",
      },
    ];
  }, [activeProject]);

  // Isometric Projection Kernel from system_stack.html
  const C = Math.cos(Math.PI / 6); // 0.866025
  const S = Math.sin(Math.PI / 6); // 0.5

  const P = (x: number, y: number, z: number, ox: number, oy: number): [number, number] => [
    (x - y) * C + ox,
    (x + y) * S - z + oy,
  ];

  const D = (x: number, y: number, z: number): [number, number] => [
    (x - y) * C,
    (x + y) * S - z,
  ];

  const plane = (
    O: [number, number, number],
    U: [number, number, number],
    V: [number, number, number],
    ox: number,
    oy: number
  ): string => {
    const o = P(O[0], O[1], O[2], ox, oy);
    const u = D(U[0], U[1], U[2]);
    const v = D(V[0], V[1], V[2]);
    return `matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})`;
  };

  const slits = (
    a0: number,
    a1: number,
    step: number,
    b0: number,
    b1: number,
    vertical = true,
    cls = "detail"
  ): string => {
    let s = "";
    for (let a = a0; a <= a1 + 1e-6; a += step) {
      s += vertical
        ? `<line class="${cls}" x1="${a}" y1="${b0}" x2="${a}" y2="${b1}"/>`
        : `<line class="${cls}" x1="${b0}" y1="${a}" x2="${b1}" y2="${a}"/>`;
    }
    return s;
  };

  const path = (pts: [number, number, number][], ox: number, oy: number): string =>
    "M" + pts.map((p) => P(p[0], p[1], p[2], ox, oy).map((n) => n.toFixed(2)).join(" ")).join("L");

  // Rounded box algorithm from system_stack.html
  const rounded = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    r: number,
    cls: string,
    ox: number,
    oy: number
  ): string => {
    r = Math.min(r, w / 2, d / 2);
    const n = 10;
    const z1 = z + h;
    const q = Math.PI / 4;
    const H = Math.PI / 2;
    const c = cls ? " " + cls : "";
    const arc = (cx: number, cy: number, a0: number, a1: number): [number, number][] => {
      const o: [number, number][] = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return o;
    };
    const ring = [
      ...arc(x + w - r, y + r, -H, 0),
      ...arc(x + w - r, y + d - r, 0, H),
      ...arc(x + r, y + d - r, H, 2 * H),
      ...arc(x + r, y + r, 2 * H, 3 * H),
    ];
    const vis = [
      ...arc(x + w - r, y + r, -q, 0),
      ...arc(x + w - r, y + d - r, 0, H),
      ...arc(x + r, y + d - r, H, 3 * q),
    ];
    const d3 = (pts: [number, number, number][]) =>
      "M" + pts.map((p) => P(p[0], p[1], p[2], ox, oy).map((v) => v.toFixed(2)).join(" ")).join("L") + "Z";
    const wall: [number, number, number][] = [
      ...vis.map(([a, b]) => [a, b, z] as [number, number, number]),
      ...vis
        .slice()
        .reverse()
        .map(([a, b]) => [a, b, z1] as [number, number, number]),
    ];
    return `<path class="face${c}" d="${d3(wall)}"/><path class="face top${c}" d="${d3(
      ring.map(([a, b]) => [a, b, z1] as [number, number, number])
    )}"/>`;
  };

  const box = (
    x: number,
    y: number,
    z: number,
    w: number,
    d: number,
    h: number,
    r: number,
    ox: number,
    oy: number
  ): string => rounded(x, y, z, w, d, h, r, "", ox, oy);

  // SVG Geometry Dimensions
  const SX = 200;
  const SY = 0;
  const SW = 180;
  const SD = 160;
  const SF = SY + SD;
  const WH = 6;
  const IH = 8;
  const TH = 6;
  const CX = 0;
  const CL = 170;
  const CW = 20;
  const CH = 6;

  const N = Math.max(1, filteredCartridges.length);
  const cy = (i: number) => 180 + 26 * i;

  // Dynamic stack height based on active tiers
  const numWorkers = activeTiers.length;
  const WZ = useMemo(() => {
    return Array.from({ length: numWorkers }, (_, k) => k * 32);
  }, [numWorkers]);

  // Coplanar vertical alignment:
  // Connecting slab base elevation
  const IZ = (WZ[WZ.length - 1] ?? 64) + 36;
  // Wire elevation is at exact vertical center of connecting slab front face (height IH = 8)
  const WIREZ = IZ + IH / 2;
  // Cartridge base elevation (height CH = 6) is vertically centered with wire
  const CZ = WIREZ - CH / 2;
  // Top supervisor slabs base elevation
  const TZ = IZ + 44;

  // Center-justified holes and wire targets across slab front width (SW = 180)
  const totalHolesSpan = (N - 1) * 20 + 8;
  const startLocalX = (SW - totalHolesSpan) / 2;
  const xw = (i: number) => SX + startLocalX + 4 + i * 20;

  // Frame calculation for viewBox
  const frameCorners: [number, number, number][] = [
    [SX, SY, TZ + TH + 32],
    [SX + SW, SY, TZ + TH + 32],
    [SX + SW, SF, -30],
    [SX, SF, -30],
    [CX, cy(0), CZ + CH],
    [CX, cy(N - 1) + CW, CZ],
    [CX + CL, cy(N - 1) + CW, CZ],
  ];

  const dProjections = frameCorners.map(([x, y, z]) => [(x - y) * C, (x + y) * S - z]);
  const minX = Math.min(...dProjections.map((p) => p[0]));
  const maxX = Math.max(...dProjections.map((p) => p[0]));
  const minY = Math.min(...dProjections.map((p) => p[1]));
  const maxY = Math.max(...dProjections.map((p) => p[1]));

  const padX = 14;
  const padY = 14;
  const vW = maxX - minX + 2 * padX;
  const vH = maxY - minY + 2 * padY;
  const ox = padX - minX;
  const oy = padY - minY;

  const viewBox = `0 0 ${vW.toFixed(1)} ${vH.toFixed(1)}`;

  const TOP = (x: number, y: number, z: number) =>
    plane([x, y, z], [1, 0, 0], [0, 1, 0], ox, oy);
  const FRONT = (x: number, y: number, z: number) =>
    plane([x, y, z], [1, 0, 0], [0, 0, -1], ox, oy);
  const SIDE = (x: number, y: number, z: number) =>
    plane([x, y, z], [0, -1, 0], [0, 0, -1], ox, oy);

  // Wire paths with smooth 90-degree corner arc (R = 9)
  const R = 9;
  const wireD = (i: number): string => {
    const yVal = cy(i) + CW / 2;
    const xVal = xw(i);
    const pts: [number, number, number][] = [
      [CX + CL, yVal, WIREZ],
      [xVal - R, yVal, WIREZ],
    ];
    for (let t = 1; t <= 8; t++) {
      const a = (t / 8) * (Math.PI / 2);
      pts.push([
        xVal - R + R * Math.sin(a),
        yVal - R + R * Math.cos(a),
        WIREZ,
      ]);
    }
    pts.push([xVal, SF, WIREZ]);
    return path(pts, ox, oy);
  };

  const formatCategory = (cat: string) => {
    if (cat === "Data & Web Intelligence") return "DATA INGESTION PIPELINE";
    if (cat === "Model Training & Fine-Tuning") return "MODEL INFERENCE PIPELINE";
    if (cat === "Embedded & Robotics") return "EDGE HARDWARE PIPELINE";
    if (cat === "Agentic RAG") return "RAG ORCHESTRATION PIPELINE";
    return cat.toUpperCase();
  };

  // Generate SVG markup
  const svgMarkup = useMemo(() => {
    let s = "";

    // 1. Faint plate-shaped shadow outline below the floating stack
    s += `<g transform="${TOP(SX - 10, SY - 10, -30)}">
      <rect class="shadow" width="${SW + 20}" height="${SD + 20}" rx="12"/>
      <rect class="shadow" x="10" y="10" width="${SW}" height="${SD}" rx="6" opacity=".5"/>
    </g>`;

    // 2. Dashed exploded-view leaders
    const lead = (z0: number, z1: number) => {
      const a = P(SX + SW, SF, z0, ox, oy);
      const b = P(SX + SW, SF, z1, ox, oy);
      return `<line class="detail lead" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;
    };
    s += lead(-30, WZ[0] || 0);

    // 3. Worker slabs
    WZ.forEach((z, k) => {
      const tier = activeTiers[k] || activeTiers[0];
      const tierLabel = tier.title.toUpperCase();

      s += `<g id="stack-w${k}" class="slab worker">`;
      s += `<g transform="${TOP(SX, SY, z + WH)}">
        <rect class="halo" x="-6" y="-6" width="${SW + 12}" height="${SD + 12}" rx="10" filter="url(#bloom)"/>
      </g>`;
      s += box(SX, SY, z, SW, SD, WH, 6, ox, oy);
      s += `<g transform="${TOP(SX, SY, z + WH)}">
        <rect class="detail" x="5" y="5" width="${SW - 10}" height="${SD - 10}" rx="3"/>
        <text class="label" x="12" y="${SD - 12}" font-size="7.5" letter-spacing="0.8" clip-path="url(#slab-text-clip)">${tierLabel}</text>
        ${slits(SW - 60, SW - 14, 4, SD - 22, SD - 11)}
      </g>`;
      s += `<g transform="${FRONT(SX, SF, z + WH)}">${slits(12, 60, 4, 1.6, WH - 1.6)}</g>`;
      s += `</g>`;
      s += lead(z + WH, k < WZ.length - 1 ? WZ[k + 1] : IZ);
    });

    // 4. Interpreter / Transformation Ingestion Slab
    s += `<g id="stack-interp" class="slab interp">`;
    s += box(SX, SY, IZ, SW, SD, IH, 6, ox, oy);
    s += `<g transform="${TOP(SX, SY, IZ + IH)}">
      <rect class="detail" x="5" y="5" width="${SW - 10}" height="${SD - 10}" rx="3"/>
      <text class="label" x="12" y="${SD - 13}" font-size="8" letter-spacing="1" clip-path="url(#slab-text-clip)">
        ${formatCategory(activeProject ? activeProject.category : "PROCESSING PIPELINE")}
      </text>
    </g>`;
    s += `<g transform="${FRONT(SX, SF, IZ + IH)}">${filteredCartridges
      .map((_, i) => `<rect class="face recess" x="${startLocalX + i * 20}" y="2" width="8" height="${IH - 4}" rx="1"/>`)
      .join("")}</g>`;
    s += `</g>`;
    s += lead(IZ + IH, TZ);

    // 5. Cartridges (arrayed along y axis)
    filteredCartridges.forEach((project, i) => {
      const yVal = cy(i);
      const labelText = project.shortName || project.bladeCode || `0${i + 1}`;
      const count = counts[project.id] || 0;
      const isSelected = i === activeCartIdx;

      s += `<g class="press cart${isSelected ? " selected" : ""}" id="stack-c${i}" data-i="${i}" data-id="${project.id}">`;
      s += box(CX, yVal, CZ, CL, CW, CH, 3, ox, oy);
      s += `<g transform="${TOP(CX, yVal, CZ + CH)}">
        <rect class="face recess" x="6" y="6" width="8" height="8" rx="4"/>
        <text class="label" x="20" y="13.4" font-size="7.5" letter-spacing="0.6" clip-path="url(#cart-text-clip)">${labelText}</text>
        <text class="cnt" id="stack-n${i}" x="${CL - 66}" y="13.2" font-size="6" text-anchor="end">${count}</text>
        ${slits(CL - 58, CL - 18, 2.5, 4, CW - 4)}${slits(4, CW - 4, 2.5, CL - 58, CL - 18, false)}
        <rect class="scr-accent" filter="url(#soft)" x="${CL - 12}" y="6" width="5" height="8" rx="1"/>
      </g>`;
      s += `<g transform="${SIDE(CX + CL, yVal + CW, CZ + CH)}">
        <rect class="face recess" x="${CW / 2 - 3}" y="1.5" width="6" height="3" rx="1"/>
      </g>`;
      s += `</g>`;
    });

    // 6. Wires & Pulse Paths
    filteredCartridges.forEach((_, i) => {
      const d = wireD(i);
      const isSelected = i === activeCartIdx;
      s += `<path class="wire-under" d="${d}"/>`;
      s += `<path class="wire${isSelected ? " active-wire" : ""}" id="stack-wire${i}" d="${d}"/>`;
      s += `<path class="pulse" id="stack-p${i}" filter="url(#glow)" pathLength="1000" d="${d}"/>`;
    });

    // 7. Top Supervisor and Gateway Slabs
    [
      ["SYSTEM ORCHESTRATOR", SX, "sup"],
      ["API GATEWAY", SX + 96, "rpc"],
    ].forEach(([label, xPos, id]) => {
      s += `<g id="stack-${id}" class="slab top-slab">`;
      s += box(xPos as number, SY, TZ, 84, SD, TH, 6, ox, oy);
      s += `<g transform="${TOP(xPos as number, SY, TZ + TH)}">
        <rect class="detail" x="5" y="5" width="74" height="${SD - 10}" rx="3"/>
        <g transform="rotate(90 42 70)">
          <text class="label" x="42" y="73" font-size="6.8" letter-spacing="0.8" text-anchor="middle">
            ${label}
          </text>
        </g>
        ${slits(16, 68, 4, SD - 24, SD - 12)}
      </g>`;
      s += `</g>`;
    });

    return s;
  }, [filteredCartridges, activeTiers, counts, activeProject, ox, oy, WZ, IZ, TZ, N, activeCartIdx, startLocalX]);

  // Sequential Tray Activation and Physical Z-Axis Wedge Displacement
  const runActivationSequence = (cartIdx: number, workerCount: number) => {
    const stage = stageRef.current;
    if (!stage) return;

    // 1. Instantly clear any running animation timers
    animTimersRef.current.forEach((t) => clearTimeout(t));
    animTimersRef.current = [];

    // Helper to reset all stack slabs to default idle state
    const resetStackToDefault = () => {
      stage.querySelectorAll(".worker").forEach((el) => {
        el.classList.remove("on");
        (el as HTMLElement).style.transform = "translateY(0px)";
        const halo = el.querySelector(".halo");
        if (halo) halo.classList.remove("hot");
      });
      const interpEl = stage.querySelector("#stack-interp") as HTMLElement | null;
      if (interpEl) {
        interpEl.classList.remove("hot");
        interpEl.style.transform = "translateY(0px)";
      }
      const supEl = stage.querySelector("#stack-sup") as HTMLElement | null;
      const rpcEl = stage.querySelector("#stack-rpc") as HTMLElement | null;
      if (supEl) {
        supEl.classList.remove("on");
        supEl.style.transform = "translateY(0px)";
      }
      if (rpcEl) {
        rpcEl.classList.remove("on");
        rpcEl.style.transform = "translateY(0px)";
      }
    };

    // 2. State Reset: Extinguish previous active states and reset transforms
    stage.querySelectorAll(".cart").forEach((el) => {
      el.classList.remove("selected", "lit", "down");
    });
    stage.querySelectorAll(".wire").forEach((el) => {
      el.classList.remove("active-wire", "hot");
    });
    stage.querySelectorAll(".cnt").forEach((el) => {
      el.classList.remove("hot");
    });
    resetStackToDefault();

    // 3. Immediately activate selected cartridge and path
    const cartEl = stage.querySelector(`#stack-c${cartIdx}`);
    const wireEl = stage.querySelector(`#stack-wire${cartIdx}`);
    const cntEl = stage.querySelector(`#stack-n${cartIdx}`);
    const pulseEl = stage.querySelector(`#stack-p${cartIdx}`);

    if (cartEl) {
      cartEl.classList.add("selected");
    }
    if (wireEl) {
      wireEl.classList.add("active-wire");
    }
    if (cntEl) {
      cntEl.classList.add("hot");
    }
    if (pulseEl) {
      pulseEl.classList.remove("go");
      void (pulseEl as HTMLElement).offsetWidth;
      pulseEl.classList.add("go");
    }

    // 4. Generate random sequential order for all worker trays
    const trayOrder = Array.from({ length: workerCount }, (_, i) => i);
    for (let i = trayOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [trayOrder[i], trayOrder[j]] = [trayOrder[j], trayOrder[i]];
    }

    const DELTA_Z = 7; // Physical lift per activating tray in px
    const startDelay = 220; // Time for trace illumination
    const stepDuration = 240; // Active duration per individual tray

    // Sequentially activate each tray: one by one!
    // As the next is activating, the previous goes back to default!
    trayOrder.forEach((currTrayIdx, stepIndex) => {
      const stepStartTime = startDelay + stepIndex * stepDuration;

      const tId = window.setTimeout(() => {
        // Reset all stack trays so previous active tray goes back to default
        resetStackToDefault();

        // Now activate ONLY currTrayIdx
        const trayEl = stage.querySelector(`#stack-w${currTrayIdx}`) as HTMLElement | null;
        if (trayEl) {
          trayEl.classList.add("on");
          const halo = trayEl.querySelector(".halo");
          if (halo) halo.classList.add("hot");
          trayEl.style.transform = `translateY(-${DELTA_Z}px)`;
        }

        // Physically elevate worker trays located above currTrayIdx within the worker section
        for (let j = currTrayIdx + 1; j < workerCount; j++) {
          const aboveTrayEl = stage.querySelector(`#stack-w${j}`) as HTMLElement | null;
          if (aboveTrayEl) {
            aboveTrayEl.style.transform = `translateY(-${DELTA_Z}px)`;
          }
        }

        // The connecting slab (stack-interp) and wire lines remain firmly connected at all times:
        // Do NOT elevate interpEl, completely eliminating any disjoint or line disconnection!
      }, stepStartTime);

      animTimersRef.current.push(tId);
    });

    // 5. After the last worker tray finishes, return stack to default and trigger connecting slab
    const afterWorkersTime = startDelay + workerCount * stepDuration;
    const interpTimer = window.setTimeout(() => {
      resetStackToDefault();
      const interpEl = stage.querySelector("#stack-interp") as HTMLElement | null;
      if (interpEl) {
        interpEl.classList.add("hot");
      }
    }, afterWorkersTime);
    animTimersRef.current.push(interpTimer);

    // 6. Top two slabs on the same plane activate
    const topActivateTime = afterWorkersTime + 130;
    const topTimer = window.setTimeout(() => {
      const interpEl = stage.querySelector("#stack-interp") as HTMLElement | null;
      if (interpEl) interpEl.classList.remove("hot");

      const supEl = stage.querySelector("#stack-sup") as HTMLElement | null;
      const rpcEl = stage.querySelector("#stack-rpc") as HTMLElement | null;
      if (supEl) {
        supEl.classList.add("on");
        supEl.style.transform = "translateY(-6px)";
      }
      if (rpcEl) {
        rpcEl.classList.add("on");
        rpcEl.style.transform = "translateY(-6px)";
      }
    }, topActivateTime);
    animTimersRef.current.push(topTimer);

    // 7. Snappy return to default: top two slabs extinguish after 450ms
    const revertTopTime = topActivateTime + 450;
    const revertTopTimer = window.setTimeout(() => {
      const supEl = stage.querySelector("#stack-sup") as HTMLElement | null;
      const rpcEl = stage.querySelector("#stack-rpc") as HTMLElement | null;
      if (supEl) {
        supEl.classList.remove("on");
        supEl.style.transform = "translateY(0px)";
      }
      if (rpcEl) {
        rpcEl.classList.remove("on");
        rpcEl.style.transform = "translateY(0px)";
      }
    }, revertTopTime);
    animTimersRef.current.push(revertTopTimer);
  };

  // Request trigger
  const sendRequest = (index: number) => {
    if (index < 0 || index >= filteredCartridges.length) return;
    const targetProject = filteredCartridges[index];
    setSelectedCartridgeId(targetProject.id);
    setActiveCartIdx(index);
    setAnimCounter((c) => c + 1);

    const newTotal = totalRequests + 1;
    setTotalRequests(newTotal);

    setCounts((prev) => ({
      ...prev,
      [targetProject.id]: (prev[targetProject.id] || 0) + 1,
    }));
  };

  // Run activation sequence after render updates DOM
  useEffect(() => {
    if (activeCartIdx === null) return;
    runActivationSequence(activeCartIdx, activeTiers.length);
  }, [activeCartIdx, animCounter, activeTiers.length]);

  // Clean up animation timers on unmount
  useEffect(() => {
    return () => {
      animTimersRef.current.forEach((t) => clearTimeout(t));
      animTimersRef.current = [];
    };
  }, []);

  // Attach click listener directly to SVG cartridges
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const clickHandler = (e: MouseEvent) => {
      const cart = (e.target as Element).closest(".cart");
      if (cart) {
        const i = cart.getAttribute("data-i");
        if (i !== null) sendRequest(parseInt(i, 10));
      }
    };

    stage.addEventListener("click", clickHandler);
    return () => stage.removeEventListener("click", clickHandler);
  }, [filteredCartridges, numWorkers, totalRequests, activeTiers]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredCartridges.length === 0) return;
    const currentIndex = filteredCartridges.findIndex(
      (p) => p.id === (selectedCartridgeId || filteredCartridges[0].id)
    );

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const next = (currentIndex + 1) % filteredCartridges.length;
      sendRequest(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (currentIndex + filteredCartridges.length - 1) % filteredCartridges.length;
      sendRequest(prev);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setSelectedCartridgeId(null);
      setActiveCartIdx(null);
    } else if (/^[1-9]$/.test(e.key)) {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= filteredCartridges.length) {
        e.preventDefault();
        sendRequest(num - 1);
      }
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="space-y-6 pt-8 focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Modular Systems Stack Figure"
    >
      <style>{`
        .system-fig text { font-family: var(--font-mono); }
        .system-fig .face { fill: var(--iso-left); stroke: var(--iso-edge); stroke-width: 1; vector-effect: non-scaling-stroke; stroke-linejoin: round; }
        .system-fig .face.top { fill: var(--iso-top); }
        .system-fig .face.recess { fill: var(--iso-right); }
        .system-fig .detail { fill: none; stroke: var(--iso-edge); stroke-width: 1; vector-effect: non-scaling-stroke; }
        .system-fig .label { fill: var(--muted-foreground); font-family: var(--font-mono); }
        .system-fig .halo { fill: var(--iso-edge-active); opacity: 0; transition: opacity 0.3s; }
        .system-fig .halo.hot { opacity: 0.35; }
        .system-fig .scr-accent { fill: var(--iso-edge-active); }

        .system-fig .wire { fill: none; stroke: var(--iso-edge); stroke-width: 1; vector-effect: non-scaling-stroke; stroke-linecap: round; stroke-linejoin: round; transition: stroke 0.2s, stroke-width 0.2s; }
        .system-fig .wire.active-wire { stroke: var(--iso-edge-active) !important; stroke-width: 2.2 !important; filter: drop-shadow(0 0 5px var(--iso-edge-active)); }
        .system-fig .wire-under { fill: none; stroke: var(--card); stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
        .system-fig .pulse { fill: none; stroke: var(--iso-edge-active); stroke-width: 2.2; stroke-linecap: round; vector-effect: non-scaling-stroke; stroke-dasharray: 70 1200; stroke-dashoffset: 70; opacity: 0; }
        .system-fig .pulse.go { animation: flow 0.65s linear; }
        @keyframes flow { 0% { stroke-dashoffset: 70; opacity: 1; } 90% { opacity: 1; } 100% { stroke-dashoffset: -1000; opacity: 0; } }

        .system-fig .press { cursor: pointer; }
        .system-fig .press .face { transition: fill 0.2s ease-out, stroke 0.2s ease-out; }
        .system-fig .press:hover .face.top { stroke: var(--iso-edge-active); }
        .system-fig .press.selected .face { fill: var(--iso-edge-active) !important; stroke: var(--iso-edge-active) !important; }
        .system-fig .press.selected .face.top { fill: var(--iso-edge-active) !important; }
        .system-fig .press.selected .face.recess { fill: var(--iso-left) !important; }
        .system-fig .press.selected .label { fill: var(--primary-foreground) !important; font-weight: 600; }
        .system-fig .press.selected .cnt { fill: var(--primary-foreground) !important; }
        .system-fig .press.selected .detail { stroke: var(--primary-foreground) !important; }
        .system-fig .press.selected { filter: drop-shadow(0 0 8px var(--iso-edge-active)); }

        .system-fig .slab { transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1); }
        .system-fig .slab .face { transition: fill 0.3s ease-out, stroke 0.3s ease-out; }
        .system-fig .slab .label { transition: fill 0.3s ease-out; }

        .system-fig .slab.worker.on .face { fill: var(--iso-edge-active) !important; stroke: var(--iso-edge-active) !important; }
        .system-fig .slab.worker.on .face.top { fill: var(--iso-edge-active) !important; }
        .system-fig .slab.worker.on .label { fill: var(--primary-foreground) !important; font-weight: 600; }
        .system-fig .slab.worker.on .detail { stroke: var(--primary-foreground) !important; }
        .system-fig .slab.worker.on { filter: drop-shadow(0 0 10px var(--iso-edge-active)); }

        .system-fig .interp .face { stroke: var(--iso-edge); }
        .system-fig .interp .label { fill: var(--foreground); }
        .system-fig .interp.hot .face { stroke: var(--iso-edge-active); fill: var(--iso-top); }
        .system-fig .interp.hot .label { fill: var(--iso-edge-active); font-weight: 600; }
        .system-fig .interp.hot { filter: drop-shadow(0 0 8px var(--iso-edge-active)); }

        .system-fig .top-slab.on .face { fill: var(--iso-edge-active); stroke: var(--iso-edge-active); }
        .system-fig .top-slab.on .face.top { fill: var(--iso-edge-active); }
        .system-fig .top-slab.on .label { fill: var(--primary-foreground); font-weight: 600; }
        .system-fig .top-slab.on { filter: drop-shadow(0 0 8px var(--iso-edge-active)); }

        .system-fig .shadow { fill: none; stroke: var(--iso-edge); stroke-dasharray: 5 5; vector-effect: non-scaling-stroke; }
        .system-fig .lead { stroke-dasharray: 3 3; }
        .system-fig .cnt { fill: var(--iso-edge); transition: fill 0.3s; font-family: var(--font-mono); }
        .system-fig .cnt.hot { fill: var(--iso-edge-active); }

        @media (prefers-reduced-motion: reduce) {
          .system-fig .press, .system-fig .press .face, .system-fig .wire, .system-fig .slab { transition: none !important; }
          .system-fig .pulse.go { animation: none; }
        }
      `}</style>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-[13px] font-mono font-normal tracking-normal text-muted-foreground uppercase">
            // ARCHITECTURAL BLUEPRINTS · PRODUCTION SYSTEMS
          </p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            System Architecture Overview
          </h2>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-accent" />
          <span>
            {filteredCartridges.length} SERVICES · {activeTiers.length} TIERS
          </span>
        </div>
      </div>

      {/* Main 12-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 of 12): Isometric System Stack */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="system-fig relative w-full rounded-sm border border-border bg-card p-2 sm:p-5 overflow-hidden flex flex-col justify-between select-none">
            {/* Top Plate Headers */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-border/40 pb-2 px-1">
              <span className="text-foreground font-semibold uppercase tracking-wider text-[11px]">
                SYSTEM ARCHITECTURE MAP
              </span>
              <span className="tracking-wider uppercase text-[11px] hidden sm:inline">
                INTERACTIVE COMPONENT SELECTOR
              </span>
            </div>

            {/* Isometric SVG Canvas */}
            <div className="w-full flex-1 flex items-center justify-center py-2 sm:py-4">
              <svg
                ref={stageRef}
                viewBox={viewBox}
                className="w-full h-auto max-h-[380px] sm:max-h-[520px] overflow-visible"
                style={{ shapeRendering: "geometricPrecision" }}
              >
                <defs>
                  <filter id="glow" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
                    <feGaussianBlur stdDeviation="4" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="soft" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
                    <feGaussianBlur stdDeviation="2.2" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="bloom" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000">
                    <feGaussianBlur stdDeviation="9" />
                  </filter>
                  <clipPath id="cart-text-clip" clipPathUnits="userSpaceOnUse">
                    <rect x="18" y="0" width="76" height="20" />
                  </clipPath>
                  <clipPath id="slab-text-clip" clipPathUnits="userSpaceOnUse">
                    <rect x="10" y="0" width="100" height="160" />
                  </clipPath>
                </defs>

                {/* Injected System Stack SVG Structure */}
                <g dangerouslySetInnerHTML={{ __html: svgMarkup }} />
              </svg>
            </div>

            {/* Bottom Plain Caption */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/40 pt-3 px-1 text-xs font-mono">
              <span className="text-muted-foreground">
                Select a service to highlight its architecture tiers (keys 1 to {filteredCartridges.length})
              </span>
              <div className="flex items-center gap-1.5 text-foreground font-semibold">
                <span>{activeProject ? `Selected: ${activeProject.title.split(":")[0]}` : "Select a service to inspect"}</span>
              </div>
            </div>
          </div>

          {/* Accessible Control Rail underneath the figure */}
          <div className="flex flex-wrap items-center gap-2 pt-1" role="tablist">
            {filteredCartridges.map((c, idx) => {
              const isSelected = c.id === activeProject?.id;
              const code = c.bladeCode || `0${idx + 1}`;
              const label = c.title.split(":")[0];

              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-pressed={isSelected}
                  onClick={() => sendRequest(idx)}
                  className={`px-3 py-2 min-h-[44px] rounded-sm text-xs font-mono transition-all flex items-center gap-2 border ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground font-bold shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      isSelected ? "bg-accent animate-pulse" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span>
                    {c.shortName ? `${code} · ${c.shortName}` : `${code}: ${label}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 of 12): Sticky Detail Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          {activeProject ? (
            <div className="rounded-sm border border-border bg-card p-5 sm:p-6 space-y-5 transition-all">
              {/* Card Header: Status Badge and Category */}
              <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-mono font-medium border border-border bg-background text-foreground">
                  {activeProject.status}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {activeProject.category}
                </span>
              </div>

              {/* Title and Business Use Case */}
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold tracking-tight text-foreground leading-snug">
                  {activeProject.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {activeProject.businessUseCase || activeProject.subtitle}
                </p>
              </div>

              {/* Highlight Metric Callout */}
              <div className="rounded-sm border border-border/80 bg-background/50 p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  PRODUCTION METRIC
                </span>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {activeProject.highlightMetric}
                </span>
              </div>

              {/* Stack Tiers Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">
                  ARCHITECTURE & PIPELINE LAYERS ({activeTiers.length})
                </span>
                <div className="space-y-1.5">
                  {activeTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="rounded-sm border border-border/60 bg-background/30 p-2 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono font-medium text-foreground block">
                          {tier.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">
                          {tier.subtitle}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-sm border shrink-0 ${
                          tier.accent
                            ? "border-accent/40 bg-accent/10 text-accent"
                            : "border-primary/40 bg-primary/10 text-primary"
                        }`}
                      >
                        {tier.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack Pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">
                  TECHNOLOGY STACK
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeProject.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-0.5 rounded-sm bg-background border border-border text-[11px] font-mono text-muted-foreground"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons: View Breakdown Modal + GitHub/Live Links */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSelectProjectForModal(activeProject)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <span>View Breakdown</span>
                  <ArrowRight className="size-3" />
                </button>

                <div className="flex items-center gap-2">
                  {activeProject.githubUrl && (
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View Source on GitHub"
                      className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Github className="size-4" />
                    </a>
                  )}
                  {activeProject.liveUrl && !activeProject.liveUrl.startsWith("/") && (
                    <a
                      href={activeProject.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View Live Project"
                      className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-border bg-card p-6 text-center text-xs text-muted-foreground font-mono">
              SELECT A SERVICE TO INSPECT ARCHITECTURE
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
