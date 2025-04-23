import { JSAnimation, animate, svg as animeSVG } from "animejs";
import * as d3 from "d3";
import { useRef, useCallback, useEffect } from "react";
import Link from "@/interfaces/Link";
import Node from "@/interfaces/Node";
import { useEditorContext } from "@/contexts/EditorContext";

export default function Graph() {
  const { nodes, links } = useEditorContext();

  // Store all animations so they can be cleaned up later
  const animationsRef = useRef<JSAnimation[]>([]);

  const d3SvgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined>>(null);
  const svgLinksRef = useRef<d3.Selection<SVGLineElement, Link, SVGGElement, unknown>>(null);
  // const svgAnimationGroupRef = useRef<SVGGElement>(null);
  const svgNodeGroupsRef = useRef<d3.Selection<SVGGElement, Node, SVGGElement, unknown>>(null);
  const svgTextsRef = useRef<d3.Selection<SVGTextElement, Node, SVGGElement, unknown>>(null);
  const svgNodesRef = useRef<d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>>(null);

  const svgContainerRef = useRef<SVGSVGElement>(null);

  const simulationRef = useRef<d3.Simulation<Node, Link> | null>(null);

  // Helper function to create arcs that appear at regular intervals
  function createPeriodicArcs({
    parentGroup,
    pathId,
    prefix,
    count,
    intervalMs,
    color,
    filter,
    reverse = false,
    scale = 1
  }: {
    parentGroup: d3.Selection<d3.BaseType, unknown, HTMLElement, unknown>;
    pathId: string;
    prefix: string;
    count: number;
    intervalMs: number;
    color: string;
    filter: string;
    reverse?: boolean;
    scale?: number;
  }) {
    // Don't create arcs if the interval is too small (avoids performance issues)
    if (intervalMs < 100) return;

    // Calculate staggered delays for the initial set of arcs
    const staggerStep = intervalMs / count;

    for (let i = 0; i < count; i++) {
      const arcId = `${prefix}-${i}`;

      // Create a container group for the arc that we can rotate
      const arcGroup = parentGroup.append("g")
        .attr("class", "arc-element")
        .attr("id", arcId);

      // For reverse direction, flip the arc by adjusting the startAngle and endAngle
      const startAngle = reverse ? Math.PI : 0;
      const endAngle = reverse ? 2 * Math.PI : Math.PI;

      // Create the arc element inside the container
      arcGroup.append("path")
        .attr("d", d3.arc()({
          innerRadius: 6 * scale,
          outerRadius: 10 * scale,
          startAngle: startAngle,
          endAngle: endAngle
        }))
        .attr("fill", color)
        .style("filter", filter)
        .classed("gpu-accelerated", true) // Add class for GPU acceleration;

      // Create animation with staggered start
      const delay = i * staggerStep;

      // Path animation
      const animation = animate(`#${arcId}`, {
        easing: 'linear',
        duration: 2000,
        delay,
        loop: true,
        reversed: reverse,
        ...animeSVG.createMotionPath(`#${pathId}`)
      });

      // Opacity animation
      const opacityAnimation = animate(`#${arcId}`, {
        opacity: [0, 1, 1, 0],
        easing: 'linear',
        duration: 2000,
        delay,
        loop: true,
        reversed: reverse,
        offset: [0, 0.1, 0.9, 1]
      });

      animationsRef.current.push(animation, opacityAnimation);
    }
  }

  const setupAnimations = useCallback(() => {
    // Clean up old animations first
    animationsRef.current.forEach(anim => anim.pause());
    animationsRef.current = [];

    // Remove any previously created arc elements
    d3.selectAll(".arc-element").remove();

    // Create animated arcs for each link
    links.forEach(link => {
      if (!link.source.x || !link.target.x) return;

      const animationGroup = d3.select(".animatedArcs");
      const sourceToTargetId = `SOURCE${link.source.id}_TARGET${link.target.id}`;
      // const targetToSourceId = `SOURCE${link.target.id}_TARGET${link.source.id}`;
      // ^ not necessary, we can just reverse the arcs

      // Calculate timing based on pings per minute
      // Convert ppm (pings per minute) to delay in ms between pings
      const toDelay = link.sourceToTargetPPM.ppm > 0 ? Math.floor(60000 / link.sourceToTargetPPM.ppm) : 0;
      const toBloomDelay = link.sourceToTargetPPM.mppm > 0 ? Math.floor(60000 / link.sourceToTargetPPM.mppm) : 0;
      const fromDelay = link.targetToSourcePPM.ppm > 0 ? Math.floor(60000 / link.targetToSourcePPM.ppm) : 0;
      const fromBloomDelay = link.targetToSourcePPM.mppm > 0 ? Math.floor(60000 / link.targetToSourcePPM.mppm) : 0;

      // Create regular arcs from source to target
      createPeriodicArcs({
        parentGroup: animationGroup,
        pathId: sourceToTargetId,
        prefix: `to-regular-${link.id}`,
        count: 5, // Keep 5 arcs in circulation
        intervalMs: toDelay,
        color: "#FF3030",
        filter: "url(#standard-glow)",
        reverse: false
      });

      // Create bloom arcs from source to target
      createPeriodicArcs({
        parentGroup: animationGroup,
        pathId: sourceToTargetId,
        prefix: `to-bloom-${link.id}`,
        count: 3, // Keep 3 bloom arcs in circulation
        intervalMs: toBloomDelay,
        color: "#FF0000", // Brighter red
        filter: "url(#super-bloom)",
        reverse: false,
        scale: 1.2 // Slightly larger
      });

      // Create regular arcs from target to source
      createPeriodicArcs({
        parentGroup: animationGroup,
        pathId: sourceToTargetId, // Same path, but we'll reverse the direction
        prefix: `from-regular-${link.id}`,
        count: 5,
        intervalMs: fromDelay,
        color: "#30A0FF", // Blue for opposite direction
        filter: "url(#standard-glow)",
        reverse: true
      });

      // Create bloom arcs from target to source
      createPeriodicArcs({
        parentGroup: animationGroup,
        pathId: sourceToTargetId,
        prefix: `from-bloom-${link.id}`,
        count: 3,
        intervalMs: fromBloomDelay,
        color: "#00A0FF", // Brighter blue
        filter: "url(#super-bloom)",
        reverse: true,
        scale: 1.2
      });
    });
  }, [links]);

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
        })
        .on("end", (event, d) => {
          if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);

          // // When drag ends, update the node's position in the state
          // editorContext.setNodes(currentNodes =>
          //   currentNodes.map(node =>
          //     node.id === d.id ? { ...node, x: d.x, y: d.y } : node
          //   )
          // );

          // Clear the fixed position after updating state
          d.fx = null;
          d.fy = null;
        })
      );;
  }, [nodes]);

  const createAnimations = useCallback(() => {
    if (!d3SvgRef.current) return;

    // Add SVG filter definitions for glow effects
    const defs = d3SvgRef.current.append("defs");

    // Create a super-bloom filter with less intense outer glow
    const bloomFilter = defs.append("filter")
      .attr("id", "super-bloom")
      .attr("x", "-30%") // Reduced from -100%
      .attr("y", "-30%") // Reduced from -100%
      .attr("width", "160%") // Reduced from 300%
      .attr("height", "160%"); // Reduced from 300%

    // First blur pass - use a smaller blur for less spread
    bloomFilter.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "4") // Reduced from 15 to 6 for less spread
      .attr("result", "blur1");

    // Color matrix to intensify the glow but with less alpha
    bloomFilter.append("feColorMatrix")
      .attr("in", "blur1")
      .attr("type", "matrix")
      .attr("values", "0 0 0 0 1   0 0 0 0 0.3   0 0 0 0 0.3   0 0 0 2.5 0") // Reduced alpha from 4 to 2.5
      .attr("result", "coloredBlur1");

    // Second blur pass - core glow (keep this the same for nice core glow)
    bloomFilter.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "3")
      .attr("result", "blur2");

    // Intensify the core (keep this the same)
    bloomFilter.append("feColorMatrix")
      .attr("in", "blur2")
      .attr("type", "matrix")
      .attr("values", "0 0 0 0 1   0 0 0 0 0.7   0 0 0 0 0.7   0 0 0 3 0")
      .attr("result", "coloredBlur2");

    // Add composite operations to stack the effects
    bloomFilter.append("feComposite")
      .attr("in", "coloredBlur1")
      .attr("in2", "coloredBlur2")
      .attr("operator", "arithmetic")
      .attr("k1", "0")
      .attr("k2", "0.7") // Reduced from 1.0 to 0.7 for less intensity
      .attr("k3", "1")
      .attr("k4", "0")
      .attr("result", "bloom");

    // Final merge - combine the bloom with the original
    const bloomMerge = bloomFilter.append("feMerge");
    bloomMerge.append("feMergeNode").attr("in", "bloom");
    bloomMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Create a group for animated arcs
    d3SvgRef.current.append("g")
      .attr("class", "animatedArcs");
  }, []);

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
    // We want links to be on the bottom, then animations, then nodes on top.
    createLinks();
    createAnimations();
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
              // Calculate total PPM in both directions
              const totalPPM = (d.sourceToTargetPPM?.ppm || 0) +
                (d.targetToSourcePPM?.ppm || 0) +
                (d.sourceToTargetPPM?.mppm || 0) +
                (d.targetToSourcePPM?.mppm || 0);

              // Inverse relationship: higher PPM = shorter distance
              // Base distance is 300, minimum distance is 50
              if (totalPPM === 0) return 300; // Max distance for no communication

              // Calculate distance with inverse proportion and clamping
              return Math.max(50, 300 - Math.min(250, totalPPM * 2));
            })
            .strength(0.2)
        )
      }

      setupAnimations();

      simulationRef.current.on("end", setupAnimations);
    }

    // Cleanup
    return () => {
      simulationRef.current?.restart();
      animationsRef.current.forEach(anim => anim.pause());
      animationsRef.current = [];
    }
  }, [
    nodes,
    links,
    tick,
    createNodes,
    createAnimations,
    createLinks,
    setupAnimations
  ]);

  return (
    <svg
      ref={svgContainerRef}
      style={{
        width: "100%",
        height: "100%",
        // backgroundColor: "lightgray",
      }}
    />
  )
}