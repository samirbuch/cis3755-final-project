// context/EditorContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type Node from '@/interfaces/Node';
import type Link from '@/interfaces/Link';
import type Waypoint from '@/interfaces/Waypoint';

export interface EditorContextType {
  nodes: Node[];
  links: Link[];
  waypoints: Waypoint[];

  nodeCounter: number;
  linkCounter: number;
  waypointCounter: number;

  addNode: (node: Node) => void;
  addLink: (link: Link) => void;
  addWaypoint: (waypoint: Waypoint) => void;

  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setLinks: React.Dispatch<React.SetStateAction<Link[]>>;
  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;

  updateNode: (id: Node["id"], newNode: Partial<Node>) => void;
  updateLink: (id: Link["id"], newLink: Partial<Link>) => void;
  updateWaypoint: (id: Waypoint["id"], newWaypoint: Partial<Waypoint>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      id: 0,
      nodes: [],
      links: [],
      events: [],
      timestamp: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
      },
    }
  ]);

  const [nodeCounter, setNodeCounter] = useState(0);
  const [linkCounter, setLinkCounter] = useState(0);
  const [waypointCounter, setWaypointCounter] = useState(0);

  const addNode = (node: Node) => {
    setNodes(prevNodes => [...prevNodes, node]);
    setNodeCounter(prev => prev + 1);
  };

  const addLink = (link: Link) => {
    setLinks(prevLinks => [...prevLinks, link]);
    setLinkCounter(prev => prev + 1);
  };

  const addWaypoint = (waypoint: Waypoint) => {
    setWaypoints(prevWaypoints => [...prevWaypoints, waypoint]);
    setWaypointCounter(prev => prev + 1);
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

  const updateWaypoint = (id: Waypoint["id"], newWaypoint: Partial<Waypoint>) => {
    setWaypoints(prev =>
      prev.map(waypoint => (waypoint.id === id ? { ...waypoint, ...newWaypoint } : waypoint))
    );
  };

  return (
    <EditorContext.Provider
      value={{ 
        nodes, 
        links, 
        waypoints,

        nodeCounter,
        linkCounter,
        waypointCounter,

        addNode,
        addLink,
        addWaypoint,

        setNodes, 
        setLinks, 
        setWaypoints,

        updateNode, 
        updateLink,
        updateWaypoint,
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
