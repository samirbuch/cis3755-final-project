import type Node from "@/interfaces/Node";
import { Button, Flex, Title } from "@mantine/core";

import styles from "@/styles/Editor.module.css";
import NodeCard from "./NodeCard";
import { useEditorContext } from "@/contexts/EditorContext";

// Section of the editor panel that handles creating and editing nodes
export default function NodesPanel() {
  const editorContext = useEditorContext();

  function createNode() {
    console.log("Creating node");
    const newNode: Node = {
      id: editorContext.nodeCounter,
      name: `Node ${editorContext.nodeCounter}`,

      x: Math.random() * 100,
      y: Math.random() * 100,
    };

    editorContext.addNode(newNode);
  }

  function editNode(node: Node) {
    console.log("Editing node", node);
    editorContext.updateNode(node.id, node);
    // editorContext.setNodes(editorContext.nodes.map((n) => (n.id === node.id ? node : n)));
  }

  function deleteNode(node: Node) {
    console.log("Deleting node", node);
    editorContext.setNodes((prev) => prev.filter((n) => n.id !== node.id));

    // Delete all links that reference this node
    editorContext.setLinks((prev) =>
      prev.filter((link) => link.source.id !== node.id && link.target.id !== node.id)
    );
  }

  return (
    <>
      <Button onClick={createNode} fullWidth>
        Create Node
      </Button>

      {editorContext.nodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          onNodeEdit={editNode}
          onNodeDelete={deleteNode}
        />
      ))
      }
    </>
  )
}