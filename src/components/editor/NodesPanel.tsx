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
      id: editorContext.nodes.length,
      name: `Node ${editorContext.nodes.length}`,

      x: Math.random() * 100,
      y: Math.random() * 100,
    };

    // setNodes((prev) => [...prev, newNode]);
    // props.onNodeCreate(newNode);
    editorContext.setNodes((prev) => [...prev, newNode]);
  }

  function editNode(node: Node) {
    console.log("Editing node", node);
    editorContext.updateNode(node.id, node);
    // editorContext.setNodes(editorContext.nodes.map((n) => (n.id === node.id ? node : n)));
  }

  function deleteNode(node: Node) {
    console.log("Deleting node", node);
    editorContext.setNodes((prev) => prev.filter((n) => n.id !== node.id));
  }

  return (
    <>
      <Button onClick={createNode}>
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