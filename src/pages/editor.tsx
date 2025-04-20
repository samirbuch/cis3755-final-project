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

  const svgContainerRef = useRef<SVGSVGElement>(null);

  const nodes = editorContext.nodes;
  const links = editorContext.links;

  const [tab, setTab] = useState<"nodes" | "links">("nodes");

  // Store all animations so they can be cleaned up later
  const animationsRef = useRef<JSAnimation[]>([]);

  const d3SvgRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined>>(null);
  const svgLinksRef = useRef<d3.Selection<SVGLineElement, Link, SVGGElement, unknown>>(null);
  // const svgAnimationGroupRef = useRef<SVGGElement>(null);
  const svgNodeGroupsRef = useRef<d3.Selection<SVGGElement, Node, SVGGElement, unknown>>(null);
  const svgTextsRef = useRef<d3.Selection<SVGTextElement, Node, SVGGElement, unknown>>(null);
  const svgNodesRef = useRef<d3.Selection<SVGCircleElement, Node, SVGGElement, unknown>>(null);

  const setupAnimations = useCallback(() => {
    // Clean up old animations first
    animationsRef.current.forEach(anim => anim.pause());
    animationsRef.current = [];

    // Create new animations for each link
    links.forEach((link, i) => {
      if (!link.source.x || !link.target.x) return;

      // Setup animation
      const animation = animate(`#animated-arc-${i}`, {
        easing: 'linear',
        duration: 1000,
        loop: true,
        ...animeSVG.createMotionPath(`#SOURCE${link.source.id}_TARGET${link.target.id}`),
      });

      animationsRef.current.push(animation);
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
      .attr("fill", "white");
  }, [nodes]);

  const createAnimations = useCallback(() => {
    if (!d3SvgRef.current) return;
  
    // Add SVG filter definitions for glow effect
    const defs = d3SvgRef.current.append("defs");
  
    // Create a super-intense bloom filter
    const filter = defs.append("filter")
      .attr("id", "super-bloom")
      .attr("x", "-100%")
      .attr("y", "-100%")
      .attr("width", "300%")
      .attr("height", "300%"); // Bigger area to allow for more bloom spread
  
    // First blur pass - wide glow
    filter.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "10") // Much wider blur
      .attr("result", "blur1");
  
    // Color matrix to intensify the glow and shift color
    filter.append("feColorMatrix")
      .attr("in", "blur1")
      .attr("type", "matrix")
      .attr("values", "0 0 0 0 1   0 0 0 0 0.2   0 0 0 0 0.2   0 0 0 3 0") // Much higher alpha multiplier
      .attr("result", "coloredBlur1");
  
    // Second blur pass - core glow
    filter.append("feGaussianBlur")
      .attr("in", "SourceGraphic")
      .attr("stdDeviation", "2")
      .attr("result", "blur2");
  
    // Intensify the core
    filter.append("feColorMatrix")
      .attr("in", "blur2")
      .attr("type", "matrix")
      .attr("values", "0 0 0 0 1   0 0 0 0 0.5   0 0 0 0 0.5   0 0 0 3 0")
      .attr("result", "coloredBlur2");
  
    // Add composite operations to stack the effects
    const composite = filter.append("feComposite")
      .attr("in", "coloredBlur1")
      .attr("in2", "coloredBlur2")
      .attr("operator", "arithmetic")
      .attr("k1", "0")
      .attr("k2", "1")
      .attr("k3", "1")
      .attr("k4", "0")
      .attr("result", "bloom");
  
    // Final merge - combine the bloom with the original
    const merge = filter.append("feMerge");
    merge.append("feMergeNode").attr("in", "bloom");
    merge.append("feMergeNode").attr("in", "SourceGraphic");
  
    // Create a group for animated arcs
    const animationGroup = d3SvgRef.current.append("g")
      .attr("class", "animatedCircles");
  
    // For each link, create an arc that will animate along the path
    links.forEach((link, i) => {
      // Add an arc to the animation group with super bloom
      animationGroup.append("path")
        .attr("d", d3.arc()({
          innerRadius: 6,
          outerRadius: 10,
          startAngle: 0,
          endAngle: Math.PI
        }))
        .attr("fill", "#FF3030") // Brighter red
        .attr("id", `animated-arc-${i}`)
        .style("opacity", 1) // Full opacity
        .style("filter", "url(#super-bloom)"); // Apply the intense bloom filter
    });
  }, [links]);

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
      const simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-10))
        .force("collide", d3.forceCollide(30))
        .force("center", d3.forceCenter(
          svgContainerRef.current.clientWidth / 2,
          svgContainerRef.current.clientHeight / 2
        ))
        .on("tick", tick);

      if (links.length > 0) {
        simulation.force("link", d3.forceLink(links))
      }

      setupAnimations();

      simulation.on("end", setupAnimations);
    }

    // Cleanup
    return () => {
      d3.forceSimulation().stop();
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
          {/* Svg container. Should take up majority of page width */}
          <svg
            ref={svgContainerRef}
            style={{
              width: "100%",
              height: "100%",
              // backgroundColor: "lightgray",
            }}
          />
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