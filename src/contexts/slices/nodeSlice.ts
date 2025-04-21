import Node from "@/interfaces/Node";
import { StateCreator } from "zustand";

export interface NodeState {
  nodes: Node[];
  nodeCounter: number;
}

export interface NodeActions {
  addNode: (node: Node) => void;
  setNodes: (nodes: Node[]) => void;
  updateNode: (id: Node["id"], newNode: Partial<Node>) => void;
  removeNode: (id: Node["id"]) => void;
}

export interface NodeSlice extends NodeState, NodeActions {};

const createNodeSlice: StateCreator<NodeSlice> = (set) => ({
  nodes: [],
  nodeCounter: 0,

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
      nodeCounter: state.nodeCounter + 1,
    }));
  },

  setNodes: (nodes) => {
    set({ nodes });
  },

  updateNode: (id, newNode) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...newNode } : node
      ),
    }));
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
    }));
  },
});

export default createNodeSlice;