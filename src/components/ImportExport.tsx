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

        editorContext.setNodes(data.nodes);
        editorContext.setLinks(data.links);
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