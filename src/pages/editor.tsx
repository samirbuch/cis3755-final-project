import { Flex, SegmentedControl, Text, Title } from "@mantine/core";
import { useEffect, useRef, useState } from "react"

import type Node from "@/interfaces/Node";

import * as d3 from "d3";

import styles from "@/styles/Editor.module.css";
import Header from "@/components/Header";
import NodesPanel from "@/components/editor/NodesPanel";
import Link from "@/interfaces/Link";
import LinksPanel from "@/components/editor/LinksPanel";

export default function Editor() {
  const svgContainerRef = useRef<SVGSVGElement>(null);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

  const [tab, setTab] = useState<"nodes" | "links">("nodes");

  useEffect(() => {
    if (!svgContainerRef.current) return;

    // Clear existing elements
    d3.select(svgContainerRef.current).selectAll("*").remove();

    const svg = d3.select(svgContainerRef.current);

    const svgNodes = svg.append("g")
      .attr("class", "nodes")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", "white");

    const svgLinks = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "white")
      .attr("stroke-width", 2);


    function tick() {
      if (nodes.length > 0) {
        svgNodes
          .attr("cx", (d) => d.x)
          .attr("cy", (d) => d.y);
      }

      if (links.length > 0) {
        svgLinks
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
      }
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
    }
  }, [nodes, links]);

  return (
    <Flex direction={"column"}>
      <Header title="Editor" />
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

          {tab === "nodes" && (
            <NodesPanel
              nodes={nodes}
              onNodeEdit={(node) => {
                console.log("Editing node", node);
                setNodes(nodes.map((n) => (n.id === node.id ? node : n)));
              }}
              onNodeDelete={(node) => {
                setNodes(nodes.filter((n) => n.id !== node.id));
              }}
              onNodeCreate={(node) => {
                setNodes((prev) => [...prev, node]);
              }}
            />
          )}

          {tab === "links" && (
            <LinksPanel 
              nodes={nodes}
              links={links}
              onLinkEdit={(link) => {
                console.log("Editing link", link);
              }}
              onLinkDelete={(link) => {
                setLinks(links.filter((l) => l.id !== link.id));
              }}
              onLinkCreate={(link) => {
                setLinks((prev) => [...prev, link]);
              }}
            />
          )}
        </Flex>
      </Flex>
    </Flex>
  )
}