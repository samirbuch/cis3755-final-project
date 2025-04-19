import type Node from "@/interfaces/Node";
import { Button, Flex, Title } from "@mantine/core";

import styles from "@/styles/Editor.module.css";
import NodeCard from "./NodeCard";

export interface NodesPanelProps {
  nodes: Node[];

  onNodeEdit: (node: Node) => void;
  onNodeDelete: (node: Node) => void;
  onNodeCreate: (node: Node) => void;
}

// Section of the editor panel that handles creating and editing nodes
export default function NodesPanel(props: NodesPanelProps) {
  function createNode() {
    console.log("Creating node");
    const newNode: Node = {
      id: props.nodes.length,
      name: `Node ${props.nodes.length}`,

      x: Math.random() * 100,
      y: Math.random() * 100,
    };

    // setNodes((prev) => [...prev, newNode]);
    props.onNodeCreate(newNode);
  }

  return (
    <>
      {props.nodes.map((node) => (
        <NodeCard 
          key={node.id}
          node={node}
          onNodeEdit={props.onNodeEdit}
          onNodeDelete={props.onNodeDelete}
        />
      ))
      }

      <Button onClick={createNode}>
        Create Node
      </Button>
    </>
  )
}