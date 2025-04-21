// context/EditorContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type Node from '@/interfaces/Node';
import type Link from '@/interfaces/Link';

export interface EditorContextType {
  eventTitle: string | null;
  eventDescription: string | null;
  eventTimestamp: { year: number; month: number; day: number };

  setEventTitle: React.Dispatch<React.SetStateAction<string | null>>;
  setEventDescription: React.Dispatch<React.SetStateAction<string | null>>;
  setEventTimestamp: React.Dispatch<
    React.SetStateAction<{ year: number; month: number; day: number }>
  >;

  nodes: Node[];
  links: Link[];
  nodeCounter: number;
  linkCounter: number;

  addNode: (node: Node) => void;
  addLink: (link: Link) => void;

  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;

  updateNode: (id: Node["id"], newNode: Partial<Node>) => void;
  updateLink: (id: Link["id"], newLink: Partial<Link>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [eventDescription, setEventDescription] = useState<string | null>(null);
  const [eventTimestamp, setEventTimestamp] = useState<{
    year: number;
    month: number;
    day: number;
  }>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });

  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [nodeCounter, setNodeCounter] = useState(0);
  const [linkCounter, setLinkCounter] = useState(0);

  const addNode = (node: Node) => {
    setNodes(prevNodes => [...prevNodes, node]);
    setNodeCounter(prev => prev + 1);
  };

  const addLink = (link: Link) => {
    setLinks(prevLinks => [...prevLinks, link]);
    setLinkCounter(prev => prev + 1);
  };

  const updateNode = (id: Node["id"], newNode: Partial<Node>) => {
    // Find the existing node
    const nodeToUpdate = nodes.find(node => node.id === id);

    if (nodeToUpdate) {
      // Update the existing node object directly
      Object.assign(nodeToUpdate, newNode);

      // Force a state update by creating a new array reference
      setNodes([...nodes]);

      // Links already reference the same objects, 
      // so we don't need to update references, just re-render
      setLinks([...links]);
    }
  };

  const updateLink = (id: Link["id"], newLink: Partial<Link>) => {
    setLinks(prev =>
      prev.map(link => (link.id === id ? { ...link, ...newLink } : link))
    );
  };

  return (
    <EditorContext.Provider
      value={{
        nodes,
        links,
        nodeCounter,
        linkCounter,
        addNode,
        addLink,
        setNodes,
        setLinks,
        updateNode,
        updateLink,

        eventTitle,
        eventDescription,
        eventTimestamp,
        setEventTitle,
        setEventDescription,
        setEventTimestamp,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorContext = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within an EditorProvider');
  }
  return context;
};
