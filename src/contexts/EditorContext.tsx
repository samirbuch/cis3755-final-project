// context/EditorContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type Node from '@/interfaces/Node';
import type Link from '@/interfaces/Link';

export interface EditorContextType {
  nodes: Node[];
  links: Link[];

  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;

  updateNode: (id: Node["id"], newNode: Partial<Node>) => void;
  updateLink: (id: Link["id"], newLink: Partial<Link>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);

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
      value={{ nodes, links, setNodes, setLinks, updateNode, updateLink }}
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
