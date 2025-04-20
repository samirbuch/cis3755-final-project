import { useEditorContext } from "@/contexts/EditorContext";
import { Button, Group } from "@mantine/core";

export default function ImportExport() {
  const editorContext = useEditorContext();

  function exportData() {
    const data = {
      nodes: editorContext.nodes,
      links: editorContext.links,
    }

    const dataStr = JSON.stringify(data, (key, value) => {
      // Remove the d3 properties from the nodes
      if (["x", "y", "vx", "vy", "index"].includes(key)) {
        return undefined;
      }

      // Convert the source and target properties of the links to their IDs
      if(key === "source") {
        return value.id;
      }
      if(key === "target") {
        return value.id;
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

  return (
    <Group>
      <Button>
        Import
      </Button>

      <Button onClick={exportData}>
        Export
      </Button>
    </Group>
  )
}