import { Button, Flex, SegmentedControl, Text, Title } from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react"
import { animate, svg as animeSVG, JSAnimation } from 'animejs';

import type Node from "@/interfaces/Node";

import * as d3 from "d3";

import styles from "@/styles/Editor.module.css";
import Header from "@/components/Header";
import NodesPanel from "@/components/editor/NodesPanel";
import type Link from "@/interfaces/Link";
import LinksPanel from "@/components/editor/LinksPanel";
import { EditorProvider, useEditorContext } from "@/contexts/EditorContext";

export default function Editor() {
  return (
    <EditorProvider>
      <TheActualPage />
    </EditorProvider>
  )
}

function TheActualPage() {
  const editorContext = useEditorContext();

  // Define the animation data structure
  interface ArcAnimation {
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

  const svgContainerRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const arcAnimations = useRef<ArcAnimation[]>([]);

  const fpsCounterRef = useRef<HTMLDivElement>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);

  const nodes = editorContext.nodes;
  const links = editorContext.links;

  const [tab, setTab] = useState<"nodes" | "links">("nodes");

  const d3SvgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined>>(null);
  const svgLinksRef = useRef<d3.Selection<SVGLineElement, Link, SVGGElement, unknown>>(null);
  // const svgAnimationGroupRef = useRef<SVGGElement>(null);
  const svgNodeGroupsRef = useRef<d3.Selection<SVGGElement, Node, SVGGElement, unknown>>(null);
  const svgTextsRef = useRef<d3.Selection<SVGTextElement, Node, SVGGElement, unknown>>(null);
  const svgNodesRef = useRef<d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>>(null);

  // Canvas draw function - called every frame
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

    // Calculate FPS
    const elapsed = currentTime - lastFrameTimeRef.current;
    lastFrameTimeRef.current = currentTime;

    // Keep only the last 60 frame times (1 second at 60fps)
    frameTimesRef.current.push(elapsed);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    // Calculate average FPS from the frame times
    const averageFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) /
      frameTimesRef.current.length;
    const fps = Math.round(1000 / averageFrameTime);

    // Update FPS counter display
    if (fpsCounterRef.current) {
      fpsCounterRef.current.textContent = `${fps} FPS`;

      // Add color coding based on performance
      if (fps >= 50) {
        fpsCounterRef.current.style.color = '#4CAF50'; // Green
      } else if (fps >= 30) {
        fpsCounterRef.current.style.color = '#FF9800'; // Orange
      } else {
        fpsCounterRef.current.style.color = '#F44336'; // Red
      }
    }

    // // Match canvas size to display size
    // const rect = canvas.getBoundingClientRect();
    // if (canvas.width !== rect.width || canvas.height !== rect.height) {
    //   canvas.width = rect.width;
    //   canvas.height = rect.height;
    // }

    // // Clear canvas
    // ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all arcs
    arcAnimations.current.forEach((anim) => {
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
  }, []);

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

  const setupCanvasAnimations = useCallback(() => {
    // Clear existing animations
    arcAnimations.current = [];

    // Create animated arcs for each link
    links.forEach(link => {
      if (!link.source.x || !link.target.x) return;

      // Calculate path points once
      const pathPoints = calculatePathPoints(
        { x: link.source.x, y: link.source.y },
        { x: link.target.x, y: link.target.y },
        100 // Number of points along path
      );

      // Calculate timing based on pings per minute (same as before)
      const toDelay = Math.floor(60000 / Math.max(link.toPPM.ppm, 1));
      const toBloomDelay = Math.floor(60000 / Math.max(link.toPPM.mppm, 1));
      const fromDelay = Math.floor(60000 / Math.max(link.fromPPM.ppm, 1));
      const fromBloomDelay = Math.floor(60000 / Math.max(link.fromPPM.mppm, 1));

      // Helper to create animation groups
      const createArcGroup = (count: number, interval: number, color: string,
        reverse: boolean, scale: number, glow: 'standard' | 'bloom') => {
        // Don't create arcs if the interval is too small
        if (interval < 300) return;

        // Reduce count for performance if needed
        const actualCount = interval < 1000 ? Math.min(2, count) : count;

        // Create staggered animations
        for (let i = 0; i < actualCount; i++) {
          const startTime = performance.now() + (i * (interval / actualCount));

          arcAnimations.current.push({
            pathPoints,
            progress: 0,
            opacity: 0,
            color,
            scale,
            reverse,
            speed: 1,
            startTime,
            duration: 2000, // 2 seconds to travel the path
            glow
          });
        }
      };

      // Create regular arcs from source to target (same logic as before)
      createArcGroup(5, toDelay, "#FF3030", false, 1, 'standard');

      // Create bloom arcs from source to target
      createArcGroup(3, toBloomDelay, "#FF0000", false, 1.2, 'bloom');

      // Create regular arcs from target to source
      createArcGroup(5, fromDelay, "#30A0FF", true, 1, 'standard');

      // Create bloom arcs from target to source
      createArcGroup(3, fromBloomDelay, "#00A0FF", true, 1.2, 'bloom');
    });

    // Start animation loop if not already running
    if (animationFrameId.current === null) {
      animationFrameId.current = requestAnimationFrame(drawCanvas);
    }
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

      // setupAnimations();
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
      .attr("fill", "white");
  }, [nodes]);

  const createLinks = useCallback(() => {
    if (!d3SvgRef.current) return;

    svgLinksRef.current = d3SvgRef.current.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "white")
      .attr("stroke-width", 2);
  }, [links]);

  useEffect(() => {
    if (!svgContainerRef.current || !canvasRef.current) return;

    // Clear existing elements
    d3.select(svgContainerRef.current).selectAll("*").remove();

    // Setup SVG elements (nodes and links only - no animations)
    d3SvgRef.current = d3.select(svgContainerRef.current);
    createLinks();
    createNodes();

    if (nodes.length > 0) {
      // Use a force simulation to position the nodes
      const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-30))
        .force("collide", d3.forceCollide(40))
        .force("center", d3.forceCenter(
          svgContainerRef.current.clientWidth / 2,
          svgContainerRef.current.clientHeight / 2
        ))
        .alphaDecay(0.05)
        .on("tick", () => {
          tick();
          // Update canvas whenever nodes/links move
          if (simulation.alpha() < 0.3) {
            setupCanvasAnimations();
          }
        });

      if (links.length > 0) {
        simulation.force("link", d3.forceLink(links).distance(200).strength(0.2))
      }

      // Setup animations when the simulation is mostly settled
      simulation.on("end", setupCanvasAnimations);
    }

    // Cleanup
    return () => {
      d3.forceSimulation().stop();
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }
  }, [
    nodes,
    links,
    tick,
    createNodes,
    createLinks,
    setupCanvasAnimations
  ]);

  return (
    <Flex direction={"column"}>
      <Header title="Editor">
        <Button>
          Import
        </Button>
        <Button>
          Export
        </Button>
      </Header>
      <Flex direction="row">
        <Flex flex={3}>
          {/* FPS Counter */}
          <div
            ref={fpsCounterRef}
            className={styles.fps}
          >
            0 FPS
          </div>

          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}>
            {/* Svg container. Should take up majority of page width */}
            <svg
              ref={svgContainerRef}
              style={{
                width: "100%",
                height: "100%",
                display: "block"
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
                pointerEvents: "none",
                zIndex: 1, // Ensure canvas is on top
              }}
            />
          </div>
        </Flex>
        <Flex
          flex={1}
          direction={"column"}
          className={styles.editorPanel}
          gap={10}
        >
          {/* Editor panel. Should take up remaining width */}

          <Title order={2}>Nodes & Links</Title>
          <SegmentedControl
            data={[
              { label: <Text>Nodes</Text>, value: "nodes" },
              { label: <Text>Connections</Text>, value: "links" },
            ]}
            defaultValue="nodes"
            onChange={(e) => {
              setTab(e as "nodes" | "links");
            }}
            value={tab}
          />

          {/* Add a scrollable container for the panels */}
          <div className={styles.panelContent}>
            {tab === "nodes" && <NodesPanel />}
            {tab === "links" && <LinksPanel />}
          </div>
        </Flex>
      </Flex>
    </Flex>
  )
}