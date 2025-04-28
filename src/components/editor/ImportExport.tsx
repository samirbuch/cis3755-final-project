import { useEditorContext } from "@/contexts/EditorContext";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Event, { ZodEvent } from "@/interfaces/Event";

export default function ImportExport() {
  const editorContext = useEditorContext();

  function exportData() {
    if(editorContext.nodes.length === 0) {
      notifications.show({
        title: "No nodes to export",
        message: "Please add nodes to the graph before exporting.",
        color: "red",
        position: "top-center"
      });
      return;
    }

    const svgContainer = document.getElementById("graph");
    if (!svgContainer) {
      notifications.show({
        title: "SVG container not found",
        message: "Please ensure the SVG container is present in the DOM.",
        color: "red",
        position: "top-center"
      });
      return;
    }

    const { width, height } = svgContainer.getBoundingClientRect();

    const data: Event = {
      eventTime: editorContext.eventTimestamp,
      eventTitle: editorContext.eventTitle,
      eventDescription: editorContext.eventDescription,
      nodes: editorContext.nodes.map(node => ({
        ...node,
        x: (node.x / width) * 100, // Convert x to percentage
        y: (node.y / height) * 100, // Convert y to percentage
      })),
      links: editorContext.links.map(link => ({
        ...link,
        source: link.source.id,
        target: link.target.id,
      })),
    };

    const dataStr = JSON.stringify(data, (key, value) => {
      // Remove unnecessary d3 properties
      if (["vx", "vy", "fx", "fy", "index"].includes(key)) {
        return undefined;
      }

      // Otherwise, return the value as is
      return value;
    }, 2);

    const title = editorContext.eventTitle || new Date().toISOString();
    
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.json`;
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

        const result = ZodEvent.safeParse(data);
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

        const svgContainer = document.getElementById("graph");
        if (!svgContainer) {
          notifications.show({
            title: "SVG container not found",
            message: "Please ensure the SVG container is present in the DOM.",
            color: "red",
            position: "top-center"
          });
          return;
        }

        const { width, height } = svgContainer.getBoundingClientRect();

        let oldFormatWarning = false;
        const fixedNodes = (data.nodes as Event["nodes"]).map((node, index) => {
          if("x" in node && "y" in node) {
            // We can safely assume we have a current exported node version.
            return {
              ...node,
              x: (node.x / 100) * width, // Convert percentage to coordinate
              y: (node.y / 100) * height, // Convert percentage to coordinate
            };
          }

          oldFormatWarning = true;

          // Else, we need to assume we have a previous exported node version.
          // and set some sensible default values.
          return {
            ...node,
            x: (index / data.nodes.length) * width, // Convert percentage to coordinate or default
            y: height / 2, // Convert percentage to coordinate or default
            color: "#FFFFFF", // pure white
          };
        });

        if(oldFormatWarning) {
          notifications.show({
            title: "Old format detected",
            message: "Some nodes in this file are in an older format. Default values are being used.",
            color: "yellow",
            position: "top-center"
          });
        }

        const fixedLinks = (data.links as Event["links"]).map(link => ({
          ...link,
          source: fixedNodes.find(node => node.id === link.source),
          target: fixedNodes.find(node => node.id === link.target),
        }));

        const fixedData = {
          ...data,
          nodes: fixedNodes,
          links: fixedLinks,
        };

        editorContext.setNodes(fixedData.nodes);
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
      {/* TODO: This could have been a mantine FileButton. I didn't know it existed. */}
      <Button onClick={importData}>
        Import
      </Button>

      <Button onClick={exportData}>
        Export
      </Button>
    </Group>
  )
}