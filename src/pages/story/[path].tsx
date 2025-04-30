import { Button, Code, Flex, Text, Title } from "@mantine/core";
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
import { wait } from "@/util/misc";
import Legend from '@/components/Legend';
import { useRouter } from "next/router";
import InfoCard from "@/components/InfoCard";

export default function Timeline() {
  const router = useRouter();
  const { path } = router.query;

  const [timeline, setTimeline] = useState<Event[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const event = timeline ? timeline[currentEventIndex] : null;

  // I know it's weird to be using the editor context here, but this is (right now)
  // the only thing that controls the graph's state. We can refactor this later after
  // the project has been submitted and if we feel like it.
  const editorContext = useEditorContext();

  // Override the default behavior of the graph; if there are any highlighted nodes
  // in the graph, we want to show them, but only if the user has flipped the switch.
  // We want this to default to whatever the graph is doing at its current index.
  const [originalHighlightedIds, setOriginalHighlightedIds] = useState<number[]>([]);
  const handleHighlightToggle = (checked: boolean) => {
    if (!checked) {
      // turn _all_ highlights off
      editorContext.nodes.forEach(node => {
        editorContext.updateNode(node.id, {
          highlighted: false,
        });
      });
    } else {
      // restore exactly the original set of highlights
      editorContext.nodes.forEach(node => {
        const isOriginal = originalHighlightedIds.includes(node.id);
        editorContext.updateNode(node.id, {
          highlighted: isOriginal,
        });
      });
    }
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

    const ids = newEvent.nodes
      .filter(n => n.highlighted)
      .map(n => n.id);
    setOriginalHighlightedIds(ids);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEventIndex, timeline]);

  // Ensure the path is available before proceeding
  useEffect(() => {
    if (!router.isReady) return;

    if (!path) {
      setError("No path specified");
      setIsLoading(false);
      return;
    }

    const fetchTimeline = async () => {
      const res = await fetch(`/storylines/${path}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`404: Storyline ${path} not found`);
        }

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

      await wait(3500); // Anticip ... 

      return data; // ... ation!
    };

    fetchTimeline()
      .then(data => {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // We need to make sure the colors don't change between events.
        // This means getting a list of all the nodes in the timeline and their
        // colors.
        // If a node is not in the map, we add it and its color to the map.
        // If a node is in the map, we set its color to the one already seen in the map.
        // Same thing for the coordinates.

        const nodeColorMap = new Map<number, string>();
        const nodeCoordMap = new Map<number, { x: number, y: number }>();

        const fixedTimeline = data.map((event: Event) => {
          const fixedNodes = (event.nodes as Event["nodes"]).map((node) => {
            // We can safely assume we have a current exported node version.
            console.log("New version!");

            return {
              ...node,
              ...nodeCoordMap.has(node.id) ? {
                x: (nodeCoordMap.get(node.id)!.x / 100) * width, // Convert percentage to coordinate
                y: (nodeCoordMap.get(node.id)!.y / 100) * height, // ^^
              } : (() => {
                nodeCoordMap.set(node.id, { x: node.x, y: node.y });
                return {
                  x: (node.x / 100) * width, // Convert percentage to coordinate
                  y: (node.y / 100) * height, // ^^
                };
              })(),
              color: nodeColorMap.has(node.id)
                ? nodeColorMap.get(node.id)
                : (() => {
                  nodeColorMap.set(node.id, node.color);
                  return node.color;
                })() // iife's are cool :3
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

        console.log("Fixed timeline:", fixedTimeline);

        setTimeline(fixedTimeline);

        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
        console.error("Error fetching timeline data:", err);
      });
  }, [path, router.isReady]);

  if (!path && router.isReady) {
    return (
      <CenteredOnPage>
        <Flex direction={"column"} align="center">
          <ClockLoader color="#FFF" size={50} />
          <Title mt={"lg"}>No path specified</Title>
          <Text>You&apos;re missing a <Code>/story/&gt;path.json&lt;</Code> parameter.</Text>

          <Link href="/" style={{ marginTop: "1rem" }}>
            <Button variant="transparent">
              Try going home
            </Button>
          </Link>
        </Flex>
      </CenteredOnPage>
    )
  }

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
            <ClockLoader color="#FFF" size={50} />
            <Title>Whoops</Title>
            <Text>There was an error fetching the story.</Text>
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
      <Legend />

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

      {event?.eventTitle && event?.eventDescription && (
        <Draggable>
          <InfoCard
            title={event.eventTitle}
            description={event.eventDescription}
            date={{ year: event.eventTime.year, month: event.eventTime.month, day: event.eventTime.day }}
            showSwitch={originalHighlightedIds.length > 0}
            switchDefaultChecked={event.nodes.some(node => node.highlighted)}
            onSwitchChange={handleHighlightToggle}
          />
        </Draggable>
      )}

      {timeline.map((event, index) => (
        <Waypoint
          // debug
          key={index}
          onEnter={({ }) => {
            // console.log("Current position:", currentPosition);
            // console.log("Previous position:", previousPosition);
            console.log(new Date(), "Waypoint entered:", index);
            setCurrentEventIndex(index);
          }}
        >
          <div style={{
            height: "120vh",
            width: "100vw",
            // backgroundColor: ["green", "blue", "red"][index % 3],
          }} />
        </Waypoint>
      ))}
    </div>
  );
}