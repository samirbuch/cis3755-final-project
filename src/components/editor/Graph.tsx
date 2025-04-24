import { JSAnimation, animate, svg as animeSVG } from "animejs";
import * as d3 from "d3";
import { useRef, useCallback, useEffect } from "react";
import Link from "@/interfaces/Link";
import Node from "@/interfaces/Node";
import { useEditorContext } from "@/contexts/EditorContext";

// Define the animation data structure
interface ArcAnimation {
  sourceId: number;                          // Store node IDs instead of path points
  targetId: number;
  pathPoints: Array<{ x: number, y: number }>; // Pre-calculated path points
  progress: number;                          // 0-1 for position along path
  opacity: number;                           // Current opacity
  color: string;                             // Arc color
  scale: number;                             // Size scale
  reverse: boolean;                          // Direction
  speed: number;                             // Animation speed
  startTime: number;                         // When this animation started
  duration: number;                          // How long it should last
  glow: 'standard' | 'bloom';                // Glow effect type
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

    const currentTime = performance.now();

    // // Calculate FPS
    // const elapsed = currentTime - lastFrameTimeRef.current;
    // lastFrameTimeRef.current = currentTime;

    // // Keep only the last 60 frame times (1 second at 60fps)
    // frameTimesRef.current.push(elapsed);
    // if (frameTimesRef.current.length > 60) {
    //   frameTimesRef.current.shift();
    // }

    // // Calculate average FPS from the frame times
    // const averageFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) /
    //   frameTimesRef.current.length;
    // const fps = Math.round(1000 / averageFrameTime);

    // // Update FPS counter display
    // if (fpsCounterRef.current) {
    //   fpsCounterRef.current.textContent = `${fps} FPS`;

    //   // Add color coding based on performance
    //   if (fps >= 50) {
    //     fpsCounterRef.current.style.color = '#4CAF50'; // Green
    //   } else if (fps >= 30) {
    //     fpsCounterRef.current.style.color = '#FF9800'; // Orange
    //   } else {
    //     fpsCounterRef.current.style.color = '#F44336'; // Red
    //   }
    // }

    // // Match canvas size to display size
    // const rect = canvas.getBoundingClientRect();
    // if (canvas.width !== rect.width || canvas.height !== rect.height) {
    //   canvas.width = rect.width;
    //   canvas.height = rect.height;
    // }

    // // Clear canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all arcs

    // Create a node map for quick lookups

    const nodeMap = new Map();
    nodes.forEach(node => {
      nodeMap.set(node.id, node);
    });

    arcAnimations.current.forEach((anim) => {
      // Look up current node positions
      const sourceNode = nodeMap.get(anim.sourceId);
      const targetNode = nodeMap.get(anim.targetId);

      // If nodes still exist, ensure path points are up-to-date
      if (sourceNode && targetNode) {
        // Only update path points if node positions have changed
        const firstPoint = anim.pathPoints[0];
        const lastPoint = anim.pathPoints[anim.pathPoints.length - 1];

        // Check if positions have moved significantly
        const sourceChanged = Math.abs(sourceNode.x - firstPoint.x) > 1 ||
          Math.abs(sourceNode.y - firstPoint.y) > 1;
        const targetChanged = Math.abs(targetNode.x - lastPoint.x) > 1 ||
          Math.abs(targetNode.y - lastPoint.y) > 1;

        if (sourceChanged || targetChanged) {
          // Update path points in real-time
          anim.pathPoints = calculatePathPoints(
            { x: sourceNode.x, y: sourceNode.y },
            { x: targetNode.x, y: targetNode.y },
            100
          );
        }
      }

      // Calculate animation progress
      const elapsed = currentTime - anim.startTime;
      anim.progress = (elapsed / anim.duration) % 1;

      // Calculate opacity based on progress
      if (anim.progress < 0.1) {
        anim.opacity = anim.progress * 10; // Fade in
      } else if (anim.progress > 0.9) {
        anim.opacity = (1 - anim.progress) * 10; // Fade out
      } else {
        anim.opacity = 1;
      }

      // Get position along the path
      const pathIndex = Math.floor(anim.progress * (anim.pathPoints.length - 1));
      const position = anim.pathPoints[anim.reverse ?
        anim.pathPoints.length - 1 - pathIndex : pathIndex];

      if (!position) return;

      // Calculate angle of motion by looking ahead/behind
      const lookIndex = anim.reverse ?
        Math.max(0, pathIndex - 5) :
        Math.min(anim.pathPoints.length - 1, pathIndex + 5);

      const lookPosition = anim.pathPoints[anim.reverse ?
        anim.pathPoints.length - 1 - lookIndex : lookIndex];

      if (!lookPosition) return;

      // Calculate angle of motion
      let angle = Math.atan2(
        lookPosition.y - position.y,
        lookPosition.x - position.x
      );

      // Adjust angle based on direction
      if (anim.reverse) {
        angle += Math.PI; // Flip 180 degrees if traveling in reverse
      }

      // Draw the arc
      ctx.save();
      ctx.globalAlpha = anim.opacity;

      // Position at the current point on the path
      ctx.translate(position.x, position.y);

      // Rotate to align with direction of travel
      ctx.rotate(angle - Math.PI / 2); // Rotate 90 degrees to align with arc

      // Set up glow effect
      if (anim.glow === 'bloom') {
        ctx.shadowBlur = 15;
        ctx.shadowColor = anim.color;
      } else {
        ctx.shadowBlur = 5;
        ctx.shadowColor = anim.color;
      }

      // Draw the arc shape
      ctx.beginPath();
      const radius = 8 * anim.scale;
      // Use consistent angle references now that we've rotated the context
      const startAngle = 0;
      const endAngle = Math.PI;

      // Draw outer arc
      ctx.arc(0, 0, radius, startAngle, endAngle);

      // Draw inner arc (to create the arc shape)
      ctx.arc(0, 0, radius * 0.6, endAngle, startAngle, true);

      ctx.closePath();
      ctx.fillStyle = anim.color;
      ctx.fill();

      ctx.restore();
    });

    // Request next frame
    animationFrameId.current = requestAnimationFrame(drawCanvas);
  }, [calculatePathPoints, nodes]);

  const updateCanvasAnimations = useCallback(() => {
    // Don't interrupt ongoing animation frame loop
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(drawCanvas);
    }

    // Don't recreate animations if no links
    if (links.length === 0) return;

    // Create a map of existing animations by source-target pair
    const existingAnimsByNodePair: Record<string, ArcAnimation[]> = {};

    arcAnimations.current.forEach(anim => {
      const key = anim.reverse
        ? `${anim.targetId}-${anim.sourceId}`
        : `${anim.sourceId}-${anim.targetId}`;

      if (!existingAnimsByNodePair[key]) {
        existingAnimsByNodePair[key] = [];
      }

      existingAnimsByNodePair[key].push(anim);
    });

    const newAnimations: ArcAnimation[] = [];

    // Process all links
    links.forEach(link => {
      if (!link.source.x || !link.target.x) return;

      // Create animation source-target key
      const sourceToTargetKey = `${link.source.id}-${link.target.id}`;
      const targetToSourceKey = `${link.target.id}-${link.source.id}`;

      // Always update path points for all animations to match current node positions
      const pathPoints = calculatePathPoints(
        { x: link.source.x, y: link.source.y },
        { x: link.target.x, y: link.target.y },
        100
      );

      // Helper function to create or update animations
      const updateOrCreateArcGroup = (
        count: number,
        interval: number,
        color: string,
        reverse: boolean,
        scale: number,
        glow: 'standard' | 'bloom'
      ) => {
        if (interval < 300) return;

        const key = reverse ? targetToSourceKey : sourceToTargetKey;
        const existingAnims = existingAnimsByNodePair[key]?.filter(
          a => a.color === color && a.glow === glow
        ) || [];

        // If we have existing animations, update them
        if (existingAnims.length > 0) {
          existingAnims.forEach(anim => {
            // Just update path points
            anim.pathPoints = pathPoints;
            newAnimations.push(anim);
          });
        }
        // Otherwise create new animations
        else {
          const actualCount = interval < 1000 ? Math.min(2, count) : count;

          for (let i = 0; i < actualCount; i++) {
            const startTime = performance.now() + (i * (interval / actualCount));
            newAnimations.push({
              sourceId: link.source.id,
              targetId: link.target.id,
              pathPoints, // Initial path points
              progress: 0,
              opacity: 0,
              color,
              scale,
              reverse,
              speed: 1,
              startTime,
              duration: 2000,
              glow
            });
          }
        }
      };

      // Calculate intervals based on PPM values
      const toDelay = Math.floor(60000 / Math.max(link.sourceToTargetPPM.ppm, 1));
      const toBloomDelay = Math.floor(60000 / Math.max(link.sourceToTargetPPM.mppm, 1));
      const fromDelay = Math.floor(60000 / Math.max(link.targetToSourcePPM.ppm, 1));
      const fromBloomDelay = Math.floor(60000 / Math.max(link.targetToSourcePPM.mppm, 1));

      // Update or create all animation types
      updateOrCreateArcGroup(5, toDelay, "#FF3030", false, 1, 'standard');
      updateOrCreateArcGroup(3, toBloomDelay, "#FF0000", false, 1.2, 'bloom');
      updateOrCreateArcGroup(5, fromDelay, "#30A0FF", true, 1, 'standard');
      updateOrCreateArcGroup(3, fromBloomDelay, "#00A0FF", true, 1.2, 'bloom');
    });

    // Replace the animations array with our preserved+new animations
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
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;

          updateCanvasAnimations();
        })
        .on("end", (event, d) => {
          if (!event.active && simulationRef.current)
            simulationRef.current.alphaTarget(0);

          updateCanvasAnimations();

          // Clear the fixed position after updating state
          d.fx = null;
          d.fy = null;
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
        .on("tick", () => {
          tick();
          if (simulationRef.current && simulationRef.current.alpha() < 0.3) {
            updateCanvasAnimations();
          }
        });

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

      // setupAnimations();

      simulationRef.current.on("end", updateCanvasAnimations);
    }

    // Cleanup
    return () => {
      simulationRef.current?.restart();
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
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