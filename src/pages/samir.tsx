import { useEffect, useState } from "react"
import Event from "@/interfaces/Event";
import { ClockLoader } from "react-spinners";
import CenteredOnPage from "@/components/CenteredOnPage";
import { Flex, Title, Text, Button } from "@mantine/core";
import Link from "next/link";
import { useEditorContext } from "@/contexts/EditorContext";
import { ZodTimeline } from "@/interfaces/Timeline";
import Graph from "@/components/editor/Graph";

import { Waypoint } from "react-waypoint";

export default function Samir() {
  const [timeline, setTimeline] = useState<Event[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const event = timeline ? timeline[currentEventIndex] : null;

  // I know it's weird to be using the editor context here, but this is (right now)
  // the only thing that controls the graph's state. We can refactor this later after
  // the project has been submitted and if we feel like it.
  const editorContext = useEditorContext();

  useEffect(() => {
    if (!timeline) return;

    console.log("Current event index:", currentEventIndex);

    const newEvent = timeline[currentEventIndex];

    editorContext.setNodes(newEvent.nodes);
    editorContext.setLinks(newEvent.links);
    editorContext.setEventTimestamp(newEvent.eventTime);
    editorContext.setEventTitle(newEvent.eventTitle);
    editorContext.setEventDescription(newEvent.eventDescription);

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

        const fixedTimeline = data.map((event: Event) => {
          const fixedNodes = (event.nodes as Event["nodes"]).map((node, index) => {
            if ("x" in node && "y" in node) {
              // We can safely assume we have a current exported node version.
              return {
                ...node,
                x: (node.x / 100) * width, // Convert percentage to coordinate
                y: (node.y / 100) * height, // Convert percentage to coordinate
              };
            }

            // Else, we need to assume we have a previous exported node version.
            // and set some sensible default values.
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
        setTimeline(fixedTimeline);

        // editorContext.setNodes(fixedData.nodes);
        // editorContext.setLinks(fixedData.links);

        // editorContext.setEventTimestamp(data.eventTime);
        // editorContext.setEventTitle(data.eventTitle);
        // editorContext.setEventDescription(data.eventDescription);

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
            <Text>Error text: {error}</Text>

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

      <div style={{
        position: "fixed"
      }}>
        <div style={{ height: "100vh" }}>
          <Title>{event?.eventTitle}</Title>
          <Text>{event?.eventDescription}</Text>
        </div>
      </div>
      {timeline.map((event, index) => (
        <Waypoint
          // debug
          key={index}
          onEnter={() => {
            setCurrentEventIndex(index);
          }}
          onLeave={() => {

          }}
        >
          <div style={{
            height: "100vh",
            width: "100vw",
            backgroundColor: ["green", "blue", "red"][index % 3],
          }} />
        </Waypoint>
      ))}
    </div>
  );
}