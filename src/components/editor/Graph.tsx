import * as d3 from "d3";
import { useRef, useCallback, useEffect, useState } from "react";
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

export interface GraphProps {
  showFPS?: boolean
}

export function diffNodes(prevNodes: Node[], newNodes: Node[]) {
  const added = newNodes.filter(node => !prevNodes.some(prevNode => prevNode.id === node.id));
  const removed = prevNodes.filter(prevNode => !newNodes.some(node => node.id === prevNode.id));
  const existing = newNodes.filter(node => prevNodes.some(prevNode => prevNode.id === node.id));
  return { added, removed, existing };
}

export default function Graph(props: GraphProps) {
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

  // State to track nodes with transition effects
  const prevNodesRef = useRef<Node[]>([]);

  // Add these at the top with other state
  const [fps, setFps] = useState<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateTimeRef = useRef<number>(0);

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

    // Calculate FPS
    const now = performance.now();
    frameCountRef.current++;

    // Update FPS every 500ms for stability
    if (now - lastFpsUpdateTimeRef.current > 500) {
      const elapsed = now - lastFpsUpdateTimeRef.current;
      const currentFps = Math.round((frameCountRef.current / elapsed) * 1000);
      setFps(currentFps);

      // Reset counters
      lastFpsUpdateTimeRef.current = now;
      frameCountRef.current = 0;
    }

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

    // Draw FPS counter if enabled
    if (props.showFPS) {
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 3;
      ctx.fillText(`${fps} FPS`, canvas.width - 20, 30);
      ctx.restore();
    }

    // Request next animation frame
    animationFrameId.current = requestAnimationFrame(drawCanvas);
  }, [calculatePathPoints, fps, nodes, props.showFPS]);

  const updateCanvasAnimations = useCallback(() => {
    if (!svgContainerRef.current) return;

    // console.log("Running updateCanvasAnimations with", links.length, "links");

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
    // console.log("Processing links:", links.map(l => ({
    //   source: l.source.id,
    //   target: l.target.id,
    //   fromPPM: l.sourceToTargetPPM?.ppm,
    //   fromMPPM: l.sourceToTargetPPM?.mppm,
    //   toPPM: l.targetToSourcePPM?.ppm,
    //   toMPPM: l.targetToSourcePPM?.mppm,
    //   hasPositions: Boolean(l.source.x && l.target.x)
    // })));

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
      // console.log(`Link ${link.source.id} → ${link.target.id} PPM values:`, {
      //   sourceToPPM, sourceToMPPM, targetToPPM, targetToMPPM,
      //   rawSourceTo: link.sourceToTargetPPM,
      //   rawTargetTo: link.targetToSourcePPM
      // });

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

          // console.log(`Creating ${count} animations for ${reverse ? "reverse" : "forward"} 
          //   between ${link.source.id}-${link.target.id} with ${glow} - PPM is ${ppmValue}`);

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
      createMissingAnimations(sourceToPPM, false, link.source.color ?? "#FFFFFF", 1, 'standard');
      createMissingAnimations(sourceToMPPM, false, link.source.color ?? "#FFFFFF", 1.2, 'bloom');
      createMissingAnimations(targetToPPM, true, link.target.color ?? "#FFFFFF", 1, 'standard');
      createMissingAnimations(targetToMPPM, true, link.target.color ?? "#FFFFFF", 1.2, 'bloom');
    });

    // Update animations reference with both updated and new animations
    arcAnimations.current = updatedAnimations;
    // console.log("Animation count:", updatedAnimations.length);
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

  const addNodeInteractions = useCallback(() => {
    if (!d3SvgRef.current) return;

    const nodeGroups = d3SvgRef.current.select(".nodes")
      .selectAll<SVGGElement, Node>("g");

    nodeGroups
      .on("mouseenter", function (event, d) {
        hoveredNodeRef.current = d.id;

        // Fade out all other nodes
        svgNodesRef.current?.transition()
          .duration(200)
          .attr("opacity", (node: Node) => getNodeOpacity(node));

        // Fade out all other links
        svgLinksRef.current?.transition()
          .duration(200)
          .attr("stroke-opacity", (link: Link) => getLinkOpacity(link));
      })
      .on("mouseleave", function () {
        hoveredNodeRef.current = null;

        // Fade in all nodes
        svgNodesRef.current?.transition()
          .duration(200)
          .attr("opacity", (node: Node) => getNodeOpacity(node));
        // Fade in all links
        svgLinksRef.current?.transition()
          .duration(200)
          .attr("stroke-opacity", (link: Link) => getLinkOpacity(link));
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", function (event, d) {
          if (!event.active && simulationRef.current)
            simulationRef.current.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", function (event, d) {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", function (event, d) {
          if (!event.active && simulationRef.current)
            simulationRef.current.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );
  }, [getLinkOpacity, getNodeOpacity]);

  const createNodes = useCallback(() => {
    if (!d3SvgRef.current) return;

    // Select all node groups and bind data
    const nodeGroups = d3SvgRef.current.select<SVGGElement>(".nodes")
      .selectAll<SVGGElement, Node>("g")
      .data<Node>(nodes, (d: Node) => d.id);

    // Handle exiting nodes (fade out and remove)
    nodeGroups.exit<Node>()
      .transition()
      .duration(200)
      .attr("opacity", 0)
      .remove();

    // Handle entering nodes (fade in)
    const enteringNodes = nodeGroups.enter()
      .append("g")
      .attr("opacity", 0); // Start fully transparent

    enteringNodes.append("circle")
      .attr("r", 10)
      .attr("fill", (d: Node) => d.color || "#FFFFFF");

    enteringNodes.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .attr("fill", "white")
      .text((d: Node) => d.name);

    // Fade in the new nodes
    enteringNodes.transition()
      .duration(800)
      .attr("opacity", (d) => getNodeOpacity(d));

    // Update existing nodes
    const existingNodes = nodeGroups
      .transition()
      .duration(500)
      .attr("opacity", (d) => getNodeOpacity(d));

    existingNodes.select("circle")
      .attr("fill", (d: Node) => d.color || "#FFFFFF");

    existingNodes.select("text")
      .text((d: Node) => d.name);

    // Remove the merge line since we're not using allNodes
    // const allNodes = nodeGroups.merge(enteringNodes);

    // Add interaction handlers
    addNodeInteractions();

    // Store references to use during simulation updates
    svgNodesRef.current = d3SvgRef.current.select<SVGGElement>(".nodes")
      .selectAll<SVGCircleElement, Node>("circle");
    svgTextsRef.current = d3SvgRef.current.select<SVGGElement>(".nodes")
      .selectAll<SVGTextElement, Node>("text");
    svgNodeGroupsRef.current = d3SvgRef.current.select<SVGGElement>(".nodes")
      .selectAll<SVGGElement, Node>("g");

    // Update the previous nodes reference for next comparison
    prevNodesRef.current = [...nodes];
  }, [nodes, addNodeInteractions, getNodeOpacity]); // Remove getNodeOpacity from dependencies

  const createLinks = useCallback(() => {
    if (!d3SvgRef.current) return;

    // Clean up any existing links group
    if (d3SvgRef.current.select(".links").empty()) {
      d3SvgRef.current.append("g").attr("class", "links");
    }

    // Select all links and bind data
    const linkElements = d3SvgRef.current.select<SVGGElement>(".links")
      .selectAll<SVGLineElement, Link>("line")
      .data<Link>(links, (d: Link) => `${d.source.id}-${d.target.id}`);

    // Handle exiting links
    linkElements.exit<Link>()
      .transition()
      .duration(200)
      .attr("stroke-opacity", 0)
      .remove();

    // Handle entering links
    const enteringLinks = linkElements.enter()
      .append("line")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("data-source", (d: Link) => d.source.id)
      .attr("data-target", (d: Link) => d.target.id)
      .attr("stroke-opacity", 0); // Start with 0 opacity

    enteringLinks.transition()
      .duration(200)
      .attr("stroke-opacity", (link: Link) => getLinkOpacity(link));

    // Handle updating links
    linkElements.transition()
      .duration(500)
      .attr("stroke-opacity", (link: Link) => getLinkOpacity(link));

    // Store reference to all links
    svgLinksRef.current = d3SvgRef.current.select<SVGGElement>(".links")
      .selectAll<SVGLineElement, Link>("line");
  }, [getLinkOpacity, links]);

  useEffect(() => {
    if (!svgContainerRef.current) return;

    // Initialize D3 SVG if not already done
    if (!d3SvgRef.current) {
      d3SvgRef.current = d3.select(svgContainerRef.current);
    }

    // Ensure we have groups for nodes and links
    if (d3SvgRef.current.select(".nodes").empty()) {
      d3SvgRef.current.append("g").attr("class", "nodes");
    }

    if (d3SvgRef.current.select(".links").empty()) {
      d3SvgRef.current.append("g").attr("class", "links");
    }

    // Order is important: links first, then nodes on top
    createLinks();
    createNodes();

    // Set up force simulation if we have nodes
    if (nodes.length > 0) {
      if (!simulationRef.current) {
        // Initialize simulation
        simulationRef.current = d3.forceSimulation(nodes)
          .force("charge", d3.forceManyBody().strength(-30))
          .force("collide", d3.forceCollide(40))
          .force("center", d3.forceCenter(
            svgContainerRef.current.clientWidth / 2,
            svgContainerRef.current.clientHeight / 2
          ))
          .alphaDecay(0.05)
          .on("tick", tick);
      } else {
        // Update existing simulation
        simulationRef.current
          .nodes(nodes)
          .alpha(0.3) // Lower alpha for smoother transitions
          .restart();
      }

      // Configure link forces if we have links
      if (links.length > 0) {
        simulationRef.current.force("link", d3.forceLink(links)
          // @ts-expect-error // no idea why ts is complaining lol
          .id((d: Node) => d.id)
          .distance((d) => {
            // Your existing distance calculation code...
            const totalPPM = (d.sourceToTargetPPM?.ppm || 0) * 1 +
              (d.targetToSourcePPM?.ppm || 0) * 1 +
              (d.sourceToTargetPPM?.mppm || 0) * 10 +
              (d.targetToSourcePPM?.mppm || 0) * 10;

            if (totalPPM === 0) return 500;
            if (totalPPM < 10) return 300 - (totalPPM * 5);
            if (totalPPM < 40) return 250 - ((totalPPM - 10) * 4);

            const minDistance = 30;
            const scaleFactor = Math.pow(totalPPM, 1.2);
            return Math.max(minDistance, 130 - (scaleFactor / 10));
          })
          .strength(1)
        );
      }

      // Set up animations
      setTimeout(() => updateCanvasAnimations(), 100);
      simulationRef.current.on("end", updateCanvasAnimations);
    }

    // Cleanup
    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      arcAnimations.current = [];
    };
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
        id="graph"
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
        id="graph-canvas"
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