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

  const hoveredNodeRef = useRef<number | null>(null);

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

  // Create helper functions to determine opacity
  const getNodeOpacity = useCallback((node: Node): number => {
    const hoveredId = hoveredNodeRef.current;
    const hasHighlighted = nodes.some(n => n.highlighted);

    // Case 1: A node is being hovered
    if (hoveredId !== null) {
      return node.id === hoveredId ? 1 : 0.3;
    }
    // Case 2: Some nodes are highlighted
    else if (hasHighlighted) {
      return node.highlighted ? 1 : 0.3;
    }
    // Case 3: Default state - all nodes fully visible
    return 1;
  }, [nodes]);

  // Helper function for link opacity
  const getLinkOpacity = useCallback((link: Link): number => {
    const hoveredId = hoveredNodeRef.current;
    const hasHighlighted = nodes.some(n => n.highlighted);

    // Case 1: A node is being hovered
    if (hoveredId !== null) {
      return (link.source.id === hoveredId || link.target.id === hoveredId) ? 0.8 : 0.2;
    }
    // Case 2: Some nodes are highlighted
    else if (hasHighlighted) {
      const isHighlighted =
        nodes.find(n => n.id === link.source.id)?.highlighted ||
        nodes.find(n => n.id === link.target.id)?.highlighted;
      return isHighlighted ? 0.8 : 0.2;
    }
    // Case 3: Default state - all links visible
    return 0.7;
  }, [nodes]);

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

    // Get current hover/highlight state
    const hoveredId = hoveredNodeRef.current;
    const hasHighlighted = nodes.some(node => node.highlighted);

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

      // Calculate animation opacity based on hover/highlight state
      let baseOpacity = anim.opacity; // The original fade-in/out opacity

      // Determine if this animation should be dimmed based on hover/highlight state
      if (hoveredId !== null) {
        // If a node is hovered, dim animations not connected to it
        const isConnected = anim.sourceId === hoveredId || anim.targetId === hoveredId;
        baseOpacity *= isConnected ? 1 : 0.25;
      }
      else if (hasHighlighted) {
        // If some nodes are highlighted, dim animations not connected to highlighted nodes
        const sourceHighlighted = nodeMap.get(anim.sourceId)?.highlighted || false;
        const targetHighlighted = nodeMap.get(anim.targetId)?.highlighted || false;
        baseOpacity *= (sourceHighlighted || targetHighlighted) ? 1 : 0.25;
      }

      
      // Draw the arc
      ctx.save();
      // Apply the calculated opacity
      ctx.globalAlpha = baseOpacity;
      // ctx.globalAlpha = baseOpacity;
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
    if (!svgContainerRef.current) return;

    console.log("Running updateCanvasAnimations with", links.length, "links");

    // CRITICAL: Ensure animation frame is running
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(drawCanvas);
    }

    // Create a map of current node positions for quick lookups
    const nodeMap = new Map();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Create a map of existing animations by link ID
    const linkAnimMap = new Map();

    // First update existing animations with fresh path points
    arcAnimations.current.forEach(anim => {
      const sourceNode = nodeMap.get(anim.sourceId);
      const targetNode = nodeMap.get(anim.targetId);

      if (sourceNode && targetNode) {
        // Update path points
        anim.pathPoints = calculatePathPoints(
          { x: sourceNode.x, y: sourceNode.y },
          { x: targetNode.x, y: targetNode.y },
          100
        );

        // Track that we have an animation for this link direction
        const key = `${anim.sourceId}-${anim.targetId}-${anim.reverse}-${anim.glow}`;
        if (!linkAnimMap.has(key)) {
          linkAnimMap.set(key, []);
        }
        linkAnimMap.get(key).push(anim);
      }
    });

    // Store the updated animations
    const updatedAnimations = [...arcAnimations.current];

    // DEBUG: Log the links being processed
    console.log("Processing links:", links.map(l => ({
      source: l.source.id,
      target: l.target.id,
      fromPPM: l.sourceToTargetPPM?.ppm,
      fromMPPM: l.sourceToTargetPPM?.mppm,
      toPPM: l.targetToSourcePPM?.ppm,
      toMPPM: l.targetToSourcePPM?.mppm,
      hasPositions: Boolean(l.source.x && l.target.x)
    })));

    // Now add new animations for any links that don't have them yet
    links.forEach(link => {
      // CRITICAL FIX: Handle links that may not have positions yet
      // Use node positions from nodeMap if available, or fallback to center
      const sourcePos = nodeMap.get(link.source.id) || {
        x: svgContainerRef.current!.clientWidth / 2 || 500,
        y: svgContainerRef.current!.clientHeight / 2 || 300
      };

      const targetPos = nodeMap.get(link.target.id) || {
        x: (svgContainerRef.current!.clientWidth / 2 || 500) + 50, // Offset to avoid overlap
        y: (svgContainerRef.current!.clientHeight / 2 || 300) + 50
      };

      const pathPoints = calculatePathPoints(
        { x: sourcePos.x, y: sourcePos.y },
        { x: targetPos.x, y: targetPos.y },
        100
      );

      // CRITICAL FIX: More robust PPM value extraction with better debugging
      // Use explicit fallbacks that preserve 0 values
      const sourceToPPM = link.sourceToTargetPPM && typeof link.sourceToTargetPPM.ppm === 'number' ?
        link.sourceToTargetPPM.ppm : 0;

      const sourceToMPPM = link.sourceToTargetPPM && typeof link.sourceToTargetPPM.mppm === 'number' ?
        link.sourceToTargetPPM.mppm : 0;

      const targetToPPM = link.targetToSourcePPM && typeof link.targetToSourcePPM.ppm === 'number' ?
        link.targetToSourcePPM.ppm : 0;

      const targetToMPPM = link.targetToSourcePPM && typeof link.targetToSourcePPM.mppm === 'number' ?
        link.targetToSourcePPM.mppm : 0;

      // Debug log the exact PPM values for this link
      console.log(`Link ${link.source.id} → ${link.target.id} PPM values:`, {
        sourceToPPM, sourceToMPPM, targetToPPM, targetToMPPM,
        rawSourceTo: link.sourceToTargetPPM,
        rawTargetTo: link.targetToSourcePPM
      });

      // Helper to check if we need new animations and create them if needed
      const createMissingAnimations = (
        ppmValue: number,
        reverse: boolean,
        color: string,
        scale: number,
        glow: 'standard' | 'bloom'
      ) => {
        // CRITICAL FIX: The existing check is causing PPM=5 to be ignored in some cases
        // Change this condition to explicitly check for positive values
        if (ppmValue <= 0) {
          return;
        }

        const key = `${link.source.id}-${link.target.id}-${reverse}-${glow}`;
        const existingAnims = linkAnimMap.get(key) || [];

        // If we don't have any animations for this type, create them
        if (existingAnims.length === 0) {
          // CRITICAL FIX: Ensure we're correctly calculating interval & count for PPM=5
          const interval = 60000 / Math.max(ppmValue, 0.1); // Avoid division by very small values

          // For PPM=5, this would create at least 3 animations 
          // (ensuring enough visibility without overwhelming)
          const count = Math.min(5, Math.max(2, Math.ceil(ppmValue / 1.5)));

          console.log(`Creating ${count} animations for ${reverse ? "reverse" : "forward"} 
            between ${link.source.id}-${link.target.id} with ${glow} - PPM is ${ppmValue}`);

          for (let i = 0; i < count; i++) {
            updatedAnimations.push({
              sourceId: link.source.id,
              targetId: link.target.id,
              pathPoints,
              progress: i / count,
              opacity: 0.8,
              color,
              scale,
              reverse,
              startTime: performance.now() - (i * (interval / count)),
              duration: 2000,
              glow
            });
          }
        }
      };

      // Check and create animations for each direction/type
      createMissingAnimations(sourceToPPM, false, "#FF3030", 1, 'standard');
      createMissingAnimations(sourceToMPPM, false, "#FF0000", 1.2, 'bloom');
      createMissingAnimations(targetToPPM, true, "#30A0FF", 1, 'standard');
      createMissingAnimations(targetToMPPM, true, "#00A0FF", 1.2, 'bloom');
    });

    // Update animations reference with both updated and new animations
    arcAnimations.current = updatedAnimations;
    console.log("Animation count:", updatedAnimations.length);
  }, [links, nodes, drawCanvas, calculatePathPoints]);

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
      .attr("opacity", d => getNodeOpacity(d))
      .on("mouseenter", function (event, d) {
        // Store hovered node ID
        hoveredNodeRef.current = d.id;

        // Enlarge this node
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 14);

        // Update all node opacities based on hover state
        if (svgNodesRef.current) {
          svgNodesRef.current
            .transition()
            .duration(200)
            .attr("opacity", node => getNodeOpacity(node));
        }

        // Update all text opacities
        if (svgTextsRef.current) {
          svgTextsRef.current
            .transition()
            .duration(200)
            .attr("opacity", node => getNodeOpacity(node));
        }

        // Highlight connected links
        if (svgLinksRef.current) {
          svgLinksRef.current
            .transition()
            .duration(200)
            .attr("stroke-width", link => {
              return (link.source.id === d.id || link.target.id === d.id) ? 4 : 2;
            })
            .attr("stroke-opacity", link => getLinkOpacity(link));
        }
      })
      .on("mouseleave", function () {
        // Clear hovered node reference
        hoveredNodeRef.current = null;

        // Reset this node
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 10);

        // Reset opacities
        if (svgNodesRef.current) {
          svgNodesRef.current
            .transition()
            .duration(200)
            .attr("opacity", d => getNodeOpacity(d));
        }

        // Reset text opacities
        if (svgTextsRef.current) {
          svgTextsRef.current
            .transition()
            .duration(200)
            .attr("opacity", d => getNodeOpacity(d));
        }

        // Reset all links
        if (svgLinksRef.current) {
          svgLinksRef.current
            .transition()
            .duration(200)
            .attr("stroke-width", 2)
            .attr("stroke-opacity", link => getLinkOpacity(link));
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

          // This prevents freezing by refreshing path points based on current positions
          if (arcAnimations.current.length > 0) {
            const nodeMap = new Map();
            nodes.forEach(node => nodeMap.set(node.id, node));

            arcAnimations.current.forEach(anim => {
              const sourceNode = nodeMap.get(anim.sourceId);
              const targetNode = nodeMap.get(anim.targetId);

              if (sourceNode && targetNode) {
                // Update path points during drag without resetting progress
                anim.pathPoints = calculatePathPoints(
                  { x: sourceNode.x, y: sourceNode.y },
                  { x: targetNode.x, y: targetNode.y },
                  100
                );
              }
            });
          }
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
  }, [calculatePathPoints, getLinkOpacity, getNodeOpacity, nodes, updateCanvasAnimations]);

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
      .attr("stroke-opacity", link => getLinkOpacity(link)); // Set initial opacity
  }, [getLinkOpacity, links]);

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

  useEffect(() => {
    // Start animation frame loop that runs independently of other state changes
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(drawCanvas);
    }

    return () => {
      // Only cancel animation when component unmounts
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [drawCanvas]);

  // Add an additional useEffect to ensure animations restart if they stop
  useEffect(() => {
    // Create a heartbeat timer to check if animations are running
    const heartbeat = setInterval(() => {
      if (animationFrameId.current === null && canvasRef.current) {
        console.log("Animation heartbeat: Restarting animation loop");
        animationFrameId.current = requestAnimationFrame(drawCanvas);
      }
    }, 1000); // Check every second

    return () => {
      clearInterval(heartbeat);
    };
  }, [drawCanvas]);

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