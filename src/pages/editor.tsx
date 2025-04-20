import { Button, Flex, SegmentedControl, Text, Title } from "@mantine/core";
import { useEffect, useRef, useState } from "react"
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

  useEffect(() => {
    if (!svgContainerRef.current) return;

    // Clear existing elements
    d3.select(svgContainerRef.current).selectAll("*").remove();

    const svg = d3.select(svgContainerRef.current);

    const svgLinks = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    // Create a group for animated circles
    const animationGroup = svg.append("g")
      .attr("class", "animatedCircles");

    // Create node groups containing both circle and text
    const nodeGroups = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g");

    // Add text to each group
    const svgTexts = nodeGroups.append("text")
      .attr("x", 15)
      .attr("y", 5)
      .attr("fill", "white")
      .text(d => d.name);

    // Add circles to each group
    const svgNodes = nodeGroups.append("circle")
      .attr("r", 10)
      .attr("fill", "white");

    // For each link, create a circle that will animate along the path
    links.forEach((link, i) => {
      // Add a circle to the animation group
      animationGroup.append("circle")
        .attr("r", 5)
        .attr("fill", "#4CAF50")
        .attr("id", `animated-circle-${i}`)
        .style("opacity", 0.8);
    });

    function tick() {
      if (nodes.length > 0) {
        svgNodes
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);

        svgTexts
          .attr("x", (d) => d.x + 15)
          .attr("y", (d) => d.y + 5)
          .text((d) => d.name);

        // console.log("Nodes", nodes.map((n) => n.name));
      }

      if (links.length > 0) {
        svgLinks
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y)
          .attr("id", (d) => `SOURCE${d.source.id}_TARGET${d.target.id}`);

        // Setup AnimeJS animations after positions are set
        setupAnimations();
      }
    }

    function setupAnimations() {
      // Clean up old animations first
      animationsRef.current.forEach(anim => anim.pause());
      animationsRef.current = [];

      // Create new animations for each link
      links.forEach((link, i) => {
        if (!link.source.x || !link.target.x) return;

        // Setup animation
        const animation = animate(`#animated-circle-${i}`, {
          easing: 'linear',
          duration: 1000,
          loop: true,
          ...animeSVG.createMotionPath(`#SOURCE${link.source.id}_TARGET${link.target.id}`),
        });

        animationsRef.current.push(animation);
      });
    }

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
    }

    // Cleanup
    return () => {
      d3.forceSimulation().stop();
      animationsRef.current.forEach(anim => anim.pause());
      animationsRef.current = [];
    }
  }, [nodes, links]);

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