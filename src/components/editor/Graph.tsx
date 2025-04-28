import * as d3 from "d3";
import { useRef, useEffect, useCallback, useState } from "react";
import { useEditorContext } from "@/contexts/EditorContext";
import Node from "@/interfaces/Node";
import Link from "@/interfaces/Link";

// Define animation data structure
interface ArcAnimation {
  sourceId: number;
  targetId: number;
  pathPoints: Array<{ x: number; y: number }>;
  progress: number;
  opacity: number;
  color: string;
  scale: number;
  reverse: boolean;
  startTime: number;
  duration: number;
  glow: 'standard' | 'bloom';
}

export interface GraphProps {
  showFPS?: boolean;
}

export default function Graph({ showFPS }: GraphProps) {
  const { nodes, links } = useEditorContext();

  // Refs for SVG, simulation, canvas, and animations
  const svgContainerRef = useRef<SVGSVGElement>(null);
  const d3SvgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined>>();
  const simulationRef = useRef<d3.Simulation<Node, Link>>();
  const hoveredNodeRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arcAnimations = useRef<ArcAnimation[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // FPS state
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastFpsUpdateTimeRef = useRef(performance.now());

  // Helper: calculate path points
  const calculatePathPoints = useCallback((source: { x: number; y: number }, target: { x: number; y: number }, pointCount = 100) => {
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      points.push({ x: source.x + (target.x - source.x) * t, y: source.y + (target.y - source.y) * t });
    }
    return points;
  }, []);

  // Opacity helpers
  const getNodeOpacity = useCallback((d: Node) => {
    const hovered = hoveredNodeRef.current;
    const anyHighlighted = nodes.some(n => n.highlighted);
    if (hovered != null) return d.id === hovered ? 1 : 0.3;
    if (anyHighlighted) return d.highlighted ? 1 : 0.3;
    return 1;
  }, [nodes]);

  const getLinkOpacity = useCallback((l: Link) => {
    const hovered = hoveredNodeRef.current;
    const anyHighlighted = nodes.some(n => n.highlighted);
    if (hovered != null) {
      return l.source.id === hovered || l.target.id === hovered ? 0.8 : 0.2;
    }
    if (anyHighlighted) {
      const s = nodes.find(n => n.id === l.source.id)?.highlighted;
      const t = nodes.find(n => n.id === l.target.id)?.highlighted;
      return s || t ? 0.8 : 0.2;
    }
    return 0.7;
  }, [nodes]);

  // D3 tick: update SVG positions and FPS
  const tick = useCallback(() => {
    if (!d3SvgRef.current) return;
    const svg = d3SvgRef.current;

    svg.selectAll<SVGLineElement, Link>(".link")
      .attr("x1", d => d.source.x!)
      .attr("y1", d => d.source.y!)
      .attr("x2", d => d.target.x!)
      .attr("y2", d => d.target.y!);

    svg.selectAll<SVGGElement, Node>(".node")
      .attr("transform", d => `translate(${d.x},${d.y})`);

    // FPS counter update
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFpsUpdateTimeRef.current > 500) {
      setFps(Math.round((frameCountRef.current / (now - lastFpsUpdateTimeRef.current)) * 1000));
      lastFpsUpdateTimeRef.current = now;
      frameCountRef.current = 0;
    }
  }, []);

  // Drag behavior
  const applyDrag = useCallback((selection: d3.Selection<SVGGElement, Node, any, any>) => {
    selection.call(
      d3.drag<SVGGElement, Node>()
        .on("start", (event, d) => {
          if (simulationRef.current && !event.active) simulationRef.current.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (simulationRef.current && !event.active) simulationRef.current.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );
  }, []);

  // Canvas draw loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentTime = performance.now();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const hovered = hoveredNodeRef.current;
    const anyHighlighted = nodes.some(n => n.highlighted);

    arcAnimations.current = arcAnimations.current.filter(anim => {
      // ... existing canvas animation logic (unchanged) ...
      return true;
    });

    animationFrameId.current = requestAnimationFrame(drawCanvas);
  }, [nodes, calculatePathPoints]);

  // Update canvas animations
  const updateCanvasAnimations = useCallback(() => {
    // ... existing update logic (unchanged) ...
  }, [nodes, links, drawCanvas, calculatePathPoints]);

  // Mount: init SVG, canvas loop, and simulation
  useEffect(() => {
    if (!svgContainerRef.current) return;
    const width = svgContainerRef.current.clientWidth;
    const height = svgContainerRef.current.clientHeight;
    const svg = d3.select(svgContainerRef.current);
    svg.append("g").attr("class", "links");
    svg.append("g").attr("class", "nodes");
    d3SvgRef.current = svg;

    simulationRef.current = d3.forceSimulation<Node, Link>()
      .force("charge", d3.forceManyBody().strength(-30))
      .force("collide", d3.forceCollide(40))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "link",
        d3.forceLink<Node, Link>()
          .id(d => d.id as any)
          .distance(d => {
            // ... distance logic unchanged ...
            return 30;
          })
          .strength(1)
      )
      .on("tick", tick);

    // start canvas
    if (animationFrameId.current === null) animationFrameId.current = requestAnimationFrame(drawCanvas);
    const hb = setInterval(() => {
      if (animationFrameId.current === null) animationFrameId.current = requestAnimationFrame(drawCanvas);
    }, 1000);

    return () => {
      clearInterval(hb);
      if (animationFrameId.current != null) cancelAnimationFrame(animationFrameId.current);
      arcAnimations.current = [];
    };
  }, [tick, drawCanvas]);

  // Patch simulation data when nodes/links change
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    const curr = sim.nodes();
    const map = new Map(curr.map(n => [n.id, n]));

    // update & add
    nodes.forEach(n => {
      const ex = map.get(n.id);
      if (ex) Object.assign(ex, n);
      else curr.push({ ...n, x: n.x ?? 0, y: n.y ?? 0, vx: n.vx ?? 0, vy: n.vy ?? 0 });
    });
    // remove
    const keep = new Set(nodes.map(n => n.id));
    sim.nodes(curr.filter(n => keep.has(n.id)));
    // patch links
    sim.force<d3.ForceLink<Node, Link>>("link")?.links(links);
    // restart
    sim.alpha(0.5).restart();
    // update canvas
    updateCanvasAnimations();
  }, [nodes, links, updateCanvasAnimations]);

  // Render/update SVG elements on nodes/links change
  useEffect(() => {
    if (!d3SvgRef.current) return;
    const svg = d3SvgRef.current;

    // LINKS
    const linkSel = svg.select<SVGGElement>(".links")
      .selectAll<SVGLineElement, Link>(".link")
      .data(links, d => `${d.source.id}-${d.target.id}`);

    linkSel.exit().transition().duration(200).attr("stroke-opacity", 0).remove();

    const linkEnter = linkSel.enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0)
      .transition().duration(200)
      .attr("stroke-opacity", getLinkOpacity as any);

    linkSel.transition().duration(500).attr("stroke-opacity", getLinkOpacity as any);

    // NODES
    const nodeSel = svg.select<SVGGElement>(".nodes")
      .selectAll<SVGGElement, Node>(".node")
      .data(nodes, d => d.id as any);

    nodeSel.exit().transition().duration(200).attr("opacity", 0).remove();

    const nodeEnter = nodeSel.enter()
      .append("g")
      .attr("class", "node")
      .attr("opacity", 0)
      .call(applyDrag)
      .on("mouseenter", (e, d) => {
        hoveredNodeRef.current = d.id;
        svg.selectAll<SVGCircleElement, Node>(".node circle").attr("opacity", getNodeOpacity as any);
        svg.selectAll<SVGLineElement, Link>(".link").attr("stroke-opacity", getLinkOpacity as any);
      })
      .on("mouseleave", () => {
        hoveredNodeRef.current = null;
        svg.selectAll<SVGCircleElement, Node>(".node circle").attr("opacity", getNodeOpacity as any);
        svg.selectAll<SVGLineElement, Link>(".link").attr("stroke-opacity", getLinkOpacity as any);
      });

    nodeEnter.append("circle")
      .attr("r", 10)
      .attr("fill", d => d.color || "#FFFFFF");

    nodeEnter.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .attr("fill", "white")
      .text(d => d.name);

    nodeEnter.transition().duration(800).attr("opacity", getNodeOpacity as any);
    nodeSel.transition().duration(500).attr("opacity", getNodeOpacity as any);
  }, [nodes, links, getNodeOpacity, getLinkOpacity, applyDrag]);

  // Render JSX
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        id="graph"
        ref={svgContainerRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      />
      <canvas
        id="graph-canvas"
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />
      {showFPS && (
        <div style={{ position: "absolute", top: 10, right: 10, color: "white", fontFamily: "monospace" }}>
          {fps} FPS
        </div>
      )}
    </div>
  );
}
