import Header from "@/components/Header";
import { Button, Flex } from "@mantine/core";
import Link from "next/link";
import { IconExternalLink } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import useArrayState from "@/util/useArrayState";
import TimelineEvent from "@/components/timeline-editor/TimelineEvent";
import { useEffect } from "react";
import { ZodTimeline } from "@/interfaces/Timeline";
import Event, { ZodEvent } from "@/interfaces/Event";

// const ZodTimelineData = z.array(ZodData);

export default function TimelineEditor() {
  const events = useArrayState<Event>();

  useEffect(() => {
    console.log("Events array changed:", events.array);
  }, [events.array]);

  const exportTimeline = () => {
    console.log("Exporting events");

    const dataStr = JSON.stringify(events.array, (key, value) => {
      // Remove the d3 properties from the nodes
      if (["vx", "vy", "fx", "fy", "index"].includes(key)) {
        return undefined;
      }

      // Otherwise, return the value as is
      return value;
    }, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timeline-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const importTimeline = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataStr = e.target?.result as string;
        try {
          const data = JSON.parse(dataStr);

          const result = ZodTimeline.safeParse(data);
          if (!result.success) {
            console.error("Invalid data format", result.error.format());
            notifications.show({
              title: "Invalid data format",
              message: "File is not a valid timeline.",
              color: "red",
              position: "top-center"
            });
            return;
          }

          console.log("Imported data:", data);
          events.dangerousSetArray(data);
          notifications.show({
            title: "Timeline imported",
            message: "Timeline imported successfully.",
            color: "green",
            position: "bottom-right"
          });
        } catch (err) {
          console.error("Error processing file", file.name, err);
          notifications.show({
            title: "Error processing file",
            message: `File ${file.name} could not be parsed.`,
            color: "red",
            position: "top-center"
          });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const uploadEvent = () => {
    console.log("Uploading events");

    // File upload, accept multiple .json files
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;

    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataStr = e.target?.result as string;
          try {
            const data = JSON.parse(dataStr);

            const result = ZodEvent.safeParse(data);
            if (!result.success) {
              console.error("Invalid data format", result.error.format());
              notifications.show({
                title: "Invalid data format",
                message: `File ${file.name} is not a valid export.`,
                color: "red",
                position: "top-center"
              });
              return;
            }

            console.log("Imported data:", data);
            events.push(data);
            notifications.show({
              title: "Event uploaded",
              message: `File ${file.name} uploaded successfully.`,
              color: "green",
              position: "bottom-right"
            });
          } catch (err) {
            console.error("Error processing file", file.name, err);
            notifications.show({
              title: "Error processing file",
              message: `File ${file.name} could not be parsed.`,
              color: "red",
              position: "top-center"
            });
          }
        };
        reader.readAsText(file);
      });
    };
    input.click();
  }

  const deleteEvent = (index: number) => {
    events.removeIndex(index);
    notifications.show({
      title: "Event deleted",
      message: "Event deleted successfully.",
      color: "green",
      position: "bottom-right"
    })
  };

  const moveEventUp = (index: number) => {
    if (index === 0) return;
    const event = events.array[index];
    events.updateItem(index, events.array[index - 1]);
    events.updateItem(index - 1, event);
  }

  const moveEventDown = (index: number) => {
    if (index === events.array.length - 1) return;
    const event = events.array[index];
    events.updateItem(index, events.array[index + 1]);
    events.updateItem(index + 1, event);
  }

  return (
    <Flex direction={"column"}>
      <Header title="Timeline Editor">
        <Button onClick={() => importTimeline()}>
          Import
        </Button>
        <Button onClick={() => exportTimeline()}>
          Export
        </Button>

        <Link href="/editor" style={{ marginLeft: "auto" }}>
          <Button variant="outline" rightSection={<IconExternalLink />}>
            Editor
          </Button>
        </Link>
      </Header>

      <Flex direction="column" gap="lg" maw={600} miw={600} p="md" style={{ alignSelf: "center" }}>
        {events.array.map((event, index) => (
          <TimelineEvent
            position={index + 1}
            key={index}
            eventTitle={event.eventTitle}
            eventDescription={event.eventDescription}
            eventTimestamp={event.eventTime}
            numNodes={event.nodes.length}
            numLinks={event.links.length}
            onClickDelete={() => deleteEvent(index)}
            onClickUp={() => moveEventUp(index)}
            onClickDown={() => moveEventDown(index)}
          />
        ))}

        <Button onClick={uploadEvent}>
          Upload event
        </Button>
      </Flex>
    </Flex>
  )
}