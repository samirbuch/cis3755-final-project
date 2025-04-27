import { Button, Card, Code, Flex, Switch, Text, Title } from "@mantine/core";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClockLoader } from "react-spinners";
import { Waypoint } from "react-waypoint";

import Event from "@/interfaces/Event";
import CenteredOnPage from "@/components/CenteredOnPage";
import Draggable from "@/components/Draggable";
import Graph from "@/components/editor/Graph";
import { useEditorContext } from "@/contexts/EditorContext";
import { NodeNoFixed } from "@/interfaces/Node";
import { ZodTimeline } from "@/interfaces/Timeline";

export default function Samir() {
  const [timeline, setTimeline] = useState<Event[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const event = timeline ? timeline[currentEventIndex] : null;

  // Override the default behavior of the graph; if there are any highlighted nodes
  // in the graph, we want to show them, but only if the user has flipped the switch.
  // We want this to default to whatever the graph is doing at its current index.
  const [highlightEnabled, setHighlightEnabled] = useState(false);

  // I know it's weird to be using the editor context here, but this is (right now)
  // the only thing that controls the graph's state. We can refactor this later after
  // the project has been submitted and if we feel like it.
  const editorContext = useEditorContext();

  const handleHighlightToggle = (checked: boolean) => {
    setHighlightEnabled(checked);

    editorContext.setNodes(prevNodes => {
      return prevNodes.map(node => ({
        ...node,
        highlighted: checked ? node.highlighted : false,
      }));
    });
  }

  useEffect(() => {
    if (!timeline) return;

    console.log("Current event index:", currentEventIndex);

    const newEvent = timeline[currentEventIndex];

    editorContext.setNodes(newEvent.nodes as NodeNoFixed[]);
    // @ts-expect-error // internally using the correct object shape
    editorContext.setLinks(newEvent.links);
    editorContext.setEventTimestamp(newEvent.eventTime);
    editorContext.setEventTitle(newEvent.eventTitle);
    editorContext.setEventDescription(newEvent.eventDescription);
    setHighlightEnabled(newEvent.nodes.some(node => node.highlighted));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEventIndex, timeline]);

  useEffect(() => {
    const fetchTimeline = async () => {
      const res = await fetch("/storylines/timeline-samir.json");
      if (!res.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();

      if (data.length === 0) {
        throw new Error("Found JSON, but it was empty!");
      }

      const result = ZodTimeline.safeParse(data);
      if (!result.success) {
        throw new Error("Found JSON, but it was malformed: " + result.error.message);
      }

      return data;
    }

    fetchTimeline()
      .then(data => {
        setTimeline(data);

        const width = window.innerWidth;
        const height = window.innerHeight;

        const nodeColorMap = new Map<number, string>();
        const nodeCoordMap = new Map<number, { x: number, y: number }>();

        const fixedTimeline = data.map((event: Event) => {
          const fixedNodes = (event.nodes as Event["nodes"]).map((node, index) => {
            if ("x" in node && "y" in node) {
              // We can safely assume we have a current exported node version.
              console.log("New version!");

              return {
                ...node,
                x: (node.x / 100) * width, // Convert percentage to coordinate
                y: (node.y / 100) * height, // Convert percentage to coordinate
                color: nodeColorMap.has(node.id)
                  ? nodeColorMap.get(node.id)
                  : (() => {
                    nodeColorMap.set(node.id, node.color);
                    return node.color;
                  })() // iife's are cool :3
              };
            }

            // Else, we need to assume we have a previous exported node version,
            // and set some sensible default values.
            console.log("Old version!");
            return {
              ...node,
              x: (index / event.nodes.length) * width, // Convert percentage to coordinate or default
              y: height / 2, // Convert percentage to coordinate or default
              color: "#FFFFFF", // pure white
            };
          });

          const fixedLinks = (event.links as Event["links"]).map(link => ({
            ...link,
            source: fixedNodes.find(node => node.id === link.source),
            target: fixedNodes.find(node => node.id === link.target),
          }));

          const fixedData = {
            ...event,
            nodes: fixedNodes,
            links: fixedLinks,
          };

          return fixedData;
        });

        // We need to make sure the colors don't change between events.
        // This means getting a list of all the nodes in the timeline and their
        // colors.
        // If a node is not in the map, we add it and its color to the map.
        // If a node is in the map, we set its color to the one already seen in the map.
        // Same thing for the coordinates.

        console.log("Fixed timeline:", fixedTimeline);

        setTimeline(fixedTimeline);

        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
        console.error("Error fetching timeline data:", err);
      });
  }, []);

  if (isLoading) {
    return (
      <CenteredOnPage>
        <ClockLoader color="#FFF" size={50} />
      </CenteredOnPage>
    )
  }

  if (error) {
    return (
      <CenteredOnPage>
        <CenteredOnPage>
          <Flex direction={"column"} gap="sm" align={"center"}>
            <Title>Sorry!</Title>
            <Text>There was an error fetching the data.</Text>
            <Text>Error text:</Text>
            <Code block>{error}</Code>

            <Link href="/">
              <Button variant="transparent">
                Try going back
              </Button>
            </Link>
          </Flex>
        </CenteredOnPage>
      </CenteredOnPage>
    )
  }

  return timeline && timeline.length > 0 && (
    <div>
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 10,
      }}>
        <Graph />
      </div>

      <Draggable>
        <Card maw={300}>
          <Title order={3}>{event?.eventTitle}</Title>
          <Text>{event?.eventDescription}</Text>
          {event?.nodes.some(node => node.highlighted) && (
            <Switch
              label="Show highlights"
              checked={highlightEnabled}
              onChange={e => {
                console.log("Switch checked:", e.currentTarget.checked);
                handleHighlightToggle(e.currentTarget.checked);
              }}
            />
          )}
        </Card>
      </Draggable>

      {timeline.map((event, index) => (
        <Waypoint
          // debug
          key={index}
          onEnter={({ currentPosition, previousPosition }) => {
            console.log("Current position:", currentPosition);
            console.log("Previous position:", previousPosition);
            setCurrentEventIndex(index);
          }}
        >
          <div style={{
            height: "120vh",
            width: "120vw",
            // backgroundColor: ["green", "blue", "red"][index % 3],
          }} />
        </Waypoint>
      ))}
    </div>
  );
}