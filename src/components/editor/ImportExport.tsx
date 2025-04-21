import { useEditorContext } from "@/contexts/EditorContext";
import { ZodLinkSourceTargetID } from "@/interfaces/Link";
import { ZodNodeNoPos } from "@/interfaces/Node";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { z } from "zod";

export const ZodData = z.object({
  eventTime: z.object({
    year: z.number(),
    month: z.number(),
    day: z.number(),
  }),
  eventTitle: z.string().nullable(),
  eventDescription: z.string().nullable(),
  nodes: z.array(ZodNodeNoPos),
  links: z.array(ZodLinkSourceTargetID),
});

export default function ImportExport() {
  const editorContext = useEditorContext();

  function exportData() {
    const data = {
      eventTime: editorContext.eventTimestamp,
      eventTitle: editorContext.eventTitle,
      eventDescription: editorContext.eventDescription,
      nodes: editorContext.nodes,
      links: editorContext.links.map(link => ({
        ...link,
        source: link.source.id,
        target: link.target.id,
      })),
    }

    const dataStr = JSON.stringify(data, (key, value) => {
      // Remove the d3 properties from the nodes
      if (["x", "y", "vx", "vy", "index"].includes(key)) {
        return undefined;
      }

      // Otherwise, return the value as is
      return value;
    }, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = new Date().toISOString() + ".json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataStr = e.target?.result as string;
        const data = JSON.parse(dataStr);

        const result = ZodData.safeParse(data);
        if (!result.success) {
          console.error("Invalid data format", result.error.format());
          notifications.show({
            title: "Invalid data format",
            message: "Please ensure you are importing something previously exported from this editor.",
            color: "red",
            position: "top-center"
          })
          return;
        }

        console.log("Imported data:", data);

        const fixedLinks = data.links.map(link => ({
          ...link,
          source: data.nodes.find(node => node.id === link.source),
          target: data.nodes.find(node => node.id === link.target),
        }));
        const fixedData = {
          ...data,
          links: fixedLinks,
        }

        // We're not using the result object here because the saved data
        // doesn't include the d3 properties. The editor context requires
        // them, but only in TypeScript. d3 adds them back when rendering.
        editorContext.setNodes(data.nodes);
        editorContext.setLinks(fixedData.links);

        editorContext.setEventTimestamp(data.eventTime);
        editorContext.setEventTitle(data.eventTitle);
        editorContext.setEventDescription(data.eventDescription);
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <Group>
      <Button onClick={importData}>
        Import
      </Button>

      <Button onClick={exportData}>
        Export
      </Button>
    </Group>
  )
}