import { JSAnimation, animate, svg as animeSVG } from "animejs";
import * as d3 from "d3";
import { useRef, useCallback, useEffect } from "react";
import Link from "@/interfaces/Link";
import Node from "@/interfaces/Node";
import { useEditorContext } from "@/contexts/EditorContext";

// Define the animation data structure
interface ArcAnimation {
  sourceId: number;
  targetId: number;
  pathPoints: Array<{ x: number, y: number }>;
  progress: number;
  opacity: number;
  color: string;
  scale: number;
  reverse: boolean;
  startTime: number;
  duration: number;
  glow: 'standard' | 'bloom';
}

export default function Graph() {
  const { nodes, links } = useEditorContext();

  const d3SvgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined>>(null);
  const svgLinksRef = useRef<d3.Selection<SVGLineElement, Link, SVGGElement, unknown>>(null);
  // const svgAnimationGroupRef = useRef<SVGGElement>(null);
  const svgNodeGroupsRef = useRef<d3.Selection<SVGGElement, Node, SVGGElement, unknown>>(null);
  const svgTextsRef = useRef<d3.Selection<SVGTextElement, Node, SVGGElement, unknown>>(null);
  const svgNodesRef = useRef<d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>>(null);

  const svgContainerRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const animationFrameId = useRef<number | null>(null);
  const arcAnimations = useRef<ArcAnimation[]>([]);

  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  // Function to calculate points along a path
  const calculatePathPoints = useCallback((source: { x: number, y: number }, target: { x: number, y: number }, pointCount = 100) => {
    const points = [];

    for (let i = 0; i <= pointCount; i++) {
      const t = i / pointCount;
      points.push({
        x: source.x + (target.x - source.x) * t,
        y: source.y + (target.y - source.y) * t
      });
    }

    return points;
  }, []);

  // Canvas draw function - called every frame
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to display size
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Current time for animation calculations
    const currentTime = performance.now();

    // Create node map for quick lookups
    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    // Draw and update each animation
    arcAnimations.current = arcAnimations.current.filter(anim => {
      // Get current node positions
      const sourceNode = nodeMap.get(anim.sourceId);
      const targetNode = nodeMap.get(anim.targetId);

      // Skip if nodes no longer exist
      if (!sourceNode || !targetNode) return false;

      // Update path if needed
      if (anim.pathPoints.length === 0 ||
        Math.abs(sourceNode.x - anim.pathPoints[0].x) > 1 ||
        Math.abs(sourceNode.y - anim.pathPoints[0].y) > 1 ||
        Math.abs(targetNode.x - anim.pathPoints[anim.pathPoints.length - 1].x) > 1 ||
        Math.abs(targetNode.y - anim.pathPoints[anim.pathPoints.length - 1].y) > 1) {

        anim.pathPoints = calculatePathPoints(
          { x: sourceNode.x, y: sourceNode.y },
          { x: targetNode.x, y: targetNode.y },
          100
        );
      }

      // Calculate elapsed time and progress
      const elapsed = currentTime - anim.startTime;
      const rawProgress = (elapsed % anim.duration) / anim.duration;
      anim.progress = rawProgress;

      // Calculate opacity based on progress
      if (rawProgress < 0.1) {
        anim.opacity = rawProgress * 10; // Fade in
      } else if (rawProgress > 0.9) {
        anim.opacity = (1 - rawProgress) * 10; // Fade out
      } else {
        anim.opacity = 1;
      }

      // Get position along the path
      const pathIndex = Math.floor(rawProgress * (anim.pathPoints.length - 1));
      const position = anim.reverse ?
        anim.pathPoints[anim.pathPoints.length - 1 - pathIndex] :
        anim.pathPoints[pathIndex];

      // Skip if position is undefined
      if (!position) return true;

      // Calculate angle of motion by looking ahead/behind
      const lookAhead = 5;
      const lookIndex = anim.reverse ?
        Math.max(0, pathIndex - lookAhead) :
        Math.min(anim.pathPoints.length - 1, pathIndex + lookAhead);

      const lookPosition = anim.reverse ?
        anim.pathPoints[anim.pathPoints.length - 1 - lookIndex] :
        anim.pathPoints[lookIndex];

      // Skip if lookPosition is undefined
      if (!lookPosition) return true;

      // Calculate angle
      const angle = Math.atan2(
        lookPosition.y - position.y,
        lookPosition.x - position.x
      ) + (anim.reverse ? Math.PI : 0);

      // Draw the arc
      ctx.save();
      ctx.globalAlpha = anim.opacity;
      ctx.translate(position.x, position.y);
      ctx.rotate(angle - Math.PI / 2);

      // Set glow effect
      if (anim.glow === 'bloom') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = anim.color;
      } else {
        ctx.shadowBlur = 5;
        ctx.shadowColor = anim.color;
      }

      // Draw arc shape
      ctx.beginPath();
      const radius = 8 * anim.scale;
      ctx.arc(0, 0, radius, 0, Math.PI); // Outer arc
      ctx.arc(0, 0, radius * 0.6, Math.PI, 0, true); // Inner arc
      ctx.closePath();
      ctx.fillStyle = anim.color;
      ctx.fill();

      ctx.restore();

      // Keep animation
      return true;
    });

    // Request next animation frame
    animationFrameId.current = requestAnimationFrame(drawCanvas);
  }, [calculatePathPoints, nodes]);

  const updateCanvasAnimations = useCallback(() => {
    // Ensure animation loop is running
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(drawCanvas);
    }

    // Start fresh with animations
    const newAnimations: ArcAnimation[] = [];

    // Process each link exactly once
    links.forEach(link => {
      // Skip links without positions
      if (!link.source.x || !link.target.x) return;

      // Create path points for this link
      const pathPoints = calculatePathPoints(
        { x: link.source.x, y: link.source.y },
        { x: link.target.x, y: link.target.y },
        100
      );

      // Extract PPM values as plain numbers - CRITICAL FIX
      // Force to numeric values with explicit fallback to 0
      const sourceToPPM = typeof link.sourceToTargetPPM?.ppm === 'number' ? link.sourceToTargetPPM.ppm : 0;
      const sourceToMPPM = typeof link.sourceToTargetPPM?.mppm === 'number' ? link.sourceToTargetPPM.mppm : 0;
      const targetToPPM = typeof link.targetToSourcePPM?.ppm === 'number' ? link.targetToSourcePPM.ppm : 0;
      const targetToMPPM = typeof link.targetToSourcePPM?.mppm === 'number' ? link.targetToSourcePPM.mppm : 0;

      console.log("Animation values:", {
        sourceToPPM, sourceToMPPM, targetToPPM, targetToMPPM,
        rawSourcePPM: link.sourceToTargetPPM?.ppm,
        rawSourceMPPM: link.sourceToTargetPPM?.mppm
      });

      // Create animations for source -> target regular pings
      if (sourceToPPM > 0) {
        const interval = 60000 / sourceToPPM; // One ping every X ms
        const count = Math.min(5, Math.max(1, Math.ceil(sourceToPPM / 2)));

        // Create staggered animations
        for (let i = 0; i < count; i++) {
          newAnimations.push({
            sourceId: link.source.id,
            targetId: link.target.id,
            pathPoints,
            progress: i / count, // Stagger starting positions
            opacity: 0.8,
            color: "#FF3030", // Standard red
            scale: 1,
            reverse: false,
            startTime: performance.now() - (i * (interval / count)),
            duration: 2000,
            glow: 'standard'
          });
        }
      }

      // Create animations for source -> target mass pings
      if (sourceToMPPM > 0) {
        const interval = 60000 / sourceToMPPM;
        const count = Math.min(3, Math.max(1, Math.ceil(sourceToMPPM / 3)));

        for (let i = 0; i < count; i++) {
          newAnimations.push({
            sourceId: link.source.id,
            targetId: link.target.id,
            pathPoints,
            progress: i / count,
            opacity: 1,
            color: "#FF0000", // Bright red
            scale: 1.2,
            reverse: false,
            startTime: performance.now() - (i * (interval / count)),
            duration: 2000,
            glow: 'bloom'
          });
        }
      }

      // Create animations for target -> source regular pings
      if (targetToPPM > 0) {
        const interval = 60000 / targetToPPM;
        const count = Math.min(5, Math.max(1, Math.ceil(targetToPPM / 2)));

        for (let i = 0; i < count; i++) {
          newAnimations.push({
            sourceId: link.source.id,
            targetId: link.target.id,
            pathPoints,
            progress: i / count,
            opacity: 0.8,
            color: "#30A0FF", // Standard blue
            scale: 1,
            reverse: true, // Coming from target
            startTime: performance.now() - (i * (interval / count)),
            duration: 2000,
            glow: 'standard'
          });
        }
      }

      // Create animations for target -> source mass pings
      if (targetToMPPM > 0) {
        const interval = 60000 / targetToMPPM;
        const count = Math.min(3, Math.max(1, Math.ceil(targetToMPPM / 3)));

        for (let i = 0; i < count; i++) {
          newAnimations.push({
            sourceId: link.source.id,
            targetId: link.target.id,
            pathPoints,
            progress: i / count,
            opacity: 1,
            color: "#00A0FF", // Bright blue
            scale: 1.2,
            reverse: true,
            startTime: performance.now() - (i * (interval / count)),
            duration: 2000,
            glow: 'bloom'
          });
        }
      }
    });

    // Replace all animations
    arcAnimations.current = newAnimations;
  }, [links, calculatePathPoints, drawCanvas]);

  const tick = useCallback(() => {
    if (!svgNodesRef.current || !svgTextsRef.current || !svgLinksRef.current) return;

    if (nodes.length > 0) {
      svgNodesRef.current
        .attr("cx", (d: Node) => d.x)
        .attr("cy", (d: Node) => d.y);

      svgTextsRef.current
        .attr("x", (d: Node) => d.x + 15)
        .attr("y", (d: Node) => d.y + 5)
        .text((d: Node) => d.name);
    }

    if (links.length > 0) {
      svgLinksRef.current
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)
        .attr("id", (d) => `SOURCE${d.source.id}_TARGET${d.target.id}`);
    }
  }, [nodes, links]);

  const createNodes = useCallback(() => {
    if (!d3SvgRef.current) return;

    // Create node groups containing both circle and text
    svgNodeGroupsRef.current = d3SvgRef.current.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g");

    // Add text to each group
    svgTextsRef.current = svgNodeGroupsRef.current.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .attr("fill", "white")
      .text(d => d.name);

    // Add circles to each group
    svgNodesRef.current = svgNodeGroupsRef.current.append("circle")
      .attr("r", 10)
      .attr("fill", "white")
      .attr("opacity", (d) => {
        if (nodes.some(node => node.highlighted)) {
          return d.highlighted ? 1 : 0.5;
        }
        return 1;
      })
      // Add hover interactions
      .on("mouseenter", function (event, d) {
        // Enlarge this node
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 14); // Increase radius

        // Highlight connected links
        if (svgLinksRef.current) {
          svgLinksRef.current
            .transition()
            .duration(200)
            .attr("stroke-width", link => {
              // Check if this link connects to the hovered node
              return (link.source.id === d.id || link.target.id === d.id) ? 4 : 2;
            });
        }
      })
      .on("mouseleave", function () {
        // Reset this node
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10); // Return to original radius

        // Reset all links
        if (svgLinksRef.current) {
          svgLinksRef.current
            .transition()
            .duration(200)
            .attr("stroke-width", 2); // Return to original width
        }
      })
      // Add drag behavior to nodes
      .call(d3.drag<SVGCircleElement, Node>()
        .on("start", (event, d) => {
          if (!event.active && simulationRef.current)
            simulationRef.current.alphaTarget(0.3).restart();

          d.fx = d.x;
          d.fy = d.y;

          updateCanvasAnimations();
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;

          // updateCanvasAnimations();
        })
        .on("end", (event, d) => {
          if (!event.active && simulationRef.current)
            simulationRef.current.alphaTarget(0);

          // Clear the fixed position after updating state
          d.fx = null;
          d.fy = null;

          updateCanvasAnimations();
        })
      );;
  }, [nodes, updateCanvasAnimations]);

  const createLinks = useCallback(() => {
    if (!d3SvgRef.current) return;

    svgLinksRef.current = d3SvgRef.current.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("data-source", d => d.source.id) // Add data attributes for easier selection
      .attr("data-target", d => d.target.id)
      .attr("stroke-opacity", 0.7); // Slightly transparent by default;
  }, [links]);

  useEffect(() => {
    if (!svgContainerRef.current) return;

    // Clear existing elements
    d3.select(svgContainerRef.current).selectAll("*").remove();

    d3SvgRef.current = d3.select(svgContainerRef.current);

    // Order of operations is important here.
    // We want links to be on the bottom then nodes on top.
    createLinks();
    createNodes();

    if (nodes.length > 0) {
      // Use a force simulation to position the nodes
      simulationRef.current = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-30))
        .force("collide", d3.forceCollide(40))
        .force("center", d3.forceCenter(
          svgContainerRef.current.clientWidth / 2,
          svgContainerRef.current.clientHeight / 2
        ))
        .alphaDecay(0.05)
        .on("tick", tick);

      if (links.length > 0) {
        simulationRef.current.force(
          "link",
          d3.forceLink(links)
            .distance((d) => {
              // Calculate total PPM in both directions with more dramatic weighting
              // Since PPM and MPPM both range from 0-10, we can apply stronger weights
              const totalPPM = (d.sourceToTargetPPM?.ppm || 0) * 1 +
                (d.targetToSourcePPM?.ppm || 0) * 1 +
                (d.sourceToTargetPPM?.mppm || 0) * 10 + // Much stronger weight for MPPM
                (d.targetToSourcePPM?.mppm || 0) * 10;  // Much stronger weight for MPPM

              // For no communication, use maximum distance
              if (totalPPM === 0) return 500; // Increased max distance for no communication

              // For low communication (total < 10), scale distance more dramatically
              if (totalPPM < 10) {
                return 300 - (totalPPM * 5); // Range from 300 down to 250
              }

              // For medium communication (10-40), scale more aggressively
              if (totalPPM < 40) {
                return 250 - ((totalPPM - 10) * 4); // Range from 250 down to 130
              }

              // For high communication (> 40), get very close
              const minDistance = 30; // Minimum distance to prevent overlap
              const scaleFactor = Math.pow(totalPPM, 1.2); // More aggressive power scaling

              return Math.max(minDistance, 130 - (scaleFactor / 10));
            })
            .strength(1)
        )
      }

      // Set up animations after brief delay to ensure simulation has started positioning
      setTimeout(() => updateCanvasAnimations(), 100);

      // Update animations when simulation stabilizes
      simulationRef.current.on("end", updateCanvasAnimations);
    }

    // Cleanup
    return () => {
      simulationRef.current?.restart();

      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }

      arcAnimations.current = [];
      // animationsRef.current.forEach(anim => anim.pause());
      // animationsRef.current = [];
    }
  }, [nodes, links, tick, createNodes, createLinks, updateCanvasAnimations]);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      display: "flex",
      flex: "1 1 auto",
      overflow: "hidden",
    }}>
      <svg
        ref={svgContainerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Allow mouse events to pass through
          zIndex: 10, // Ensure canvas is above the SVG
        }}
      />
    </div>
  )
}