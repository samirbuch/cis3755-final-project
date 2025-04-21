// context/EditorContext.tsx
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import type Node from '@/interfaces/Node';
import type Link from '@/interfaces/Link';
import type Waypoint from '@/interfaces/Waypoint';
// import type Event from '@/interfaces/Event';
import Timestamp from '@/interfaces/Timestamp';

export interface EditorContextType {
  waypoints: Waypoint[];

  currentWaypoint: Waypoint;
  setCurrentWaypoint: React.Dispatch<React.SetStateAction<Waypoint>>;

  currentTimestamp: Timestamp;
  setCurrentTimestamp: React.Dispatch<React.SetStateAction<Timestamp>>;

  /**
   * Add a new waypoint to the list of waypoints.
   * @param waypoint 
   * @returns 
   */
  addWaypoint: (waypoint: Waypoint) => void;

  /**
   * Adds a new node to the current waypoint's current timestamp.
   * @param node 
   * @returns 
   */
  addNode: (node: Node) => void;

  /**
   * Adds a new link to the current waypoint's current timestamp.
   * @param link 
   * @returns 
   */
  addLink: (link: Link) => void;

  /**
   * Adds a new timestamp to the current waypoint.
   * @param timestamp 
   * @returns 
   */
  addTimestamp: (timestamp: Timestamp) => void;

  setWaypoints: React.Dispatch<React.SetStateAction<Waypoint[]>>;

  /**
   * Updates the waypoint details
   * @param id 
   * @param newWaypoint 
   * @returns 
   */
  updateWaypoint: (id: Waypoint["id"], newWaypoint: Partial<Waypoint>) => void;

  /**
   * Update a node by ID
   * @param id 
   * @param newNode 
   * @returns 
   */
  updateNode: (id: Node["id"], newNode: Partial<Node>) => void;

  /**
   * Update a link by ID
   * @param id 
   * @param newLink 
   * @returns 
   */
  updateLink: (id: Link["id"], newLink: Partial<Link>) => void;

  /**
   * Update a timestamp by ID
   * @param id 
   * @param newTimestamp 
   * @returns 
   */
  updateTimestamp: (id: Timestamp["id"], newTimestamp: Partial<Timestamp>) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([
    {
      id: 0,
      timestamps: [{
        id: 0,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
        nodes: [],
        links: [],
      }],
      event: {
        id: 0,
        eventTitle: "Empty Title",
        // eventDescription: "Empty Description",
      },
    },
  ]);
  const [currentWaypoint, setCurrentWaypoint] = useState<Waypoint>(waypoints[0]);
  const [currentTimestamp, setCurrentTimestamp] = useState<Timestamp>(currentWaypoint.timestamps[0]);

  const addWaypoint = (waypoint: Waypoint) => {
    setWaypoints(prevWaypoints => [...prevWaypoints, waypoint]);
  };

  const addNode = (node: Node) => {
    setWaypoints(prevWaypoints => {
      // Find the specific waypoint and timestamp to update 
      const waypointIndex = prevWaypoints.findIndex(wp => wp.id === currentWaypoint.id);
      if (waypointIndex === -1) return prevWaypoints;

      const waypoint = prevWaypoints[waypointIndex];
      const timestampIndex = waypoint.timestamps.findIndex(ts => ts.id === currentTimestamp.id);
      if (timestampIndex === -1) return prevWaypoints;

      // Create a new array with the updated waypoint
      const newWaypoints = [...prevWaypoints];

      // Only modify the specific timestamp's nodes array
      const newTimestamp = {
        ...waypoint.timestamps[timestampIndex],
        nodes: [...waypoint.timestamps[timestampIndex].nodes, node]
      };

      // Create a new waypoint with the updated timestamp
      newWaypoints[waypointIndex] = {
        ...waypoint,
        timestamps: [
          ...waypoint.timestamps.slice(0, timestampIndex),
          newTimestamp,
          ...waypoint.timestamps.slice(timestampIndex + 1)
        ]
      };

      // Update currentWaypoint reference in a single render batch
      setCurrentWaypoint(newWaypoints[waypointIndex]);

      return newWaypoints;
    });
  };

  const addLink = (link: Link) => {
    setWaypoints(prevWaypoints => {
      const waypointIndex = prevWaypoints.findIndex(wp => wp.id === currentWaypoint.id);
      if (waypointIndex === -1) return prevWaypoints;

      const waypoint = prevWaypoints[waypointIndex];
      const timestampIndex = waypoint.timestamps.findIndex(ts => ts.id === currentTimestamp.id);
      if (timestampIndex === -1) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];

      const newTimestamp = {
        ...waypoint.timestamps[timestampIndex],
        links: [...waypoint.timestamps[timestampIndex].links, link]
      };

      newWaypoints[waypointIndex] = {
        ...waypoint,
        timestamps: [
          ...waypoint.timestamps.slice(0, timestampIndex),
          newTimestamp,
          ...waypoint.timestamps.slice(timestampIndex + 1)
        ]
      };

      setCurrentWaypoint(newWaypoints[waypointIndex]);

      return newWaypoints;
    });
  }

  const addTimestamp = (timestamp: Timestamp) => {
    setWaypoints(prevWaypoints => {
      const waypointIndex = prevWaypoints.findIndex(wp => wp.id === currentWaypoint.id);
      if (waypointIndex === -1) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];

      newWaypoints[waypointIndex] = {
        ...newWaypoints[waypointIndex],
        timestamps: [...newWaypoints[waypointIndex].timestamps, timestamp]
      };

      setCurrentWaypoint(newWaypoints[waypointIndex]);

      return newWaypoints;
    });
  };

  const updateWaypoint = (id: Waypoint["id"], newWaypoint: Partial<Waypoint>) => {
    setWaypoints(prev =>
      prev.map(waypoint => (waypoint.id === id ? { ...waypoint, ...newWaypoint } : waypoint))
    );
  };

  const updateNode = (id: Node["id"], newNode: Partial<Node>) => {
    setWaypoints(prevWaypoints => {
      const waypointIndex = prevWaypoints.findIndex(wp => wp.id === currentWaypoint.id);
      if (waypointIndex === -1) return prevWaypoints;

      const waypoint = prevWaypoints[waypointIndex];
      const timestampIndex = waypoint.timestamps.findIndex(ts => ts.id === currentTimestamp.id);
      if (timestampIndex === -1) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];

      const nodeIndex = waypoint.timestamps[timestampIndex].nodes.findIndex(n => n.id === id);
      if (nodeIndex === -1) return prevWaypoints;

      newWaypoints[waypointIndex].timestamps[timestampIndex].nodes[nodeIndex] = {
        ...newWaypoints[waypointIndex].timestamps[timestampIndex].nodes[nodeIndex],
        ...newNode
      };

      setCurrentWaypoint(newWaypoints[waypointIndex]);

      return newWaypoints;
    });
  };

  const updateLink = (id: Link["id"], newLink: Partial<Link>) => {
    setWaypoints(prevWaypoints => {
      const waypointIndex = prevWaypoints.findIndex(wp => wp.id === currentWaypoint.id);
      if (waypointIndex === -1) return prevWaypoints;

      const waypoint = prevWaypoints[waypointIndex];
      const timestampIndex = waypoint.timestamps.findIndex(ts => ts.id === currentTimestamp.id);
      if (timestampIndex === -1) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];

      const linkIndex = waypoint.timestamps[timestampIndex].links.findIndex(l => l.id === id);
      if (linkIndex === -1) return prevWaypoints;

      newWaypoints[waypointIndex].timestamps[timestampIndex].links[linkIndex] = {
        ...newWaypoints[waypointIndex].timestamps[timestampIndex].links[linkIndex],
        ...newLink
      };

      setCurrentWaypoint(newWaypoints[waypointIndex]);

      return newWaypoints;
    });
  };

  const updateTimestamp = (id: Timestamp["id"], newTimestamp: Partial<Timestamp>) => {
    setWaypoints(prevWaypoints => {
      const waypointIndex = prevWaypoints.findIndex(wp => wp.id === currentWaypoint.id);
      if (waypointIndex === -1) return prevWaypoints;

      const waypoint = prevWaypoints[waypointIndex];
      const timestampIndex = waypoint.timestamps.findIndex(ts => ts.id === id);
      if (timestampIndex === -1) return prevWaypoints;

      const newWaypoints = [...prevWaypoints];

      newWaypoints[waypointIndex].timestamps[timestampIndex] = {
        ...newWaypoints[waypointIndex].timestamps[timestampIndex],
        ...newTimestamp
      };

      setCurrentWaypoint(newWaypoints[waypointIndex]);

      return newWaypoints;
    });
  };

  return (
    <EditorContext.Provider
      value={{
        waypoints,
        currentWaypoint,
        setCurrentWaypoint,
        currentTimestamp,
        setCurrentTimestamp,
        addWaypoint,
        addNode,
        addLink,
        addTimestamp,
        setWaypoints,
        updateWaypoint,
        updateNode,
        updateLink,
        updateTimestamp,
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

// Add selector hooks to extract only needed data

export const useCurrentNodes = () => {
  const { currentWaypoint, currentTimestamp } = useEditorContext();
  return useMemo(() => {
    const timestamp = currentWaypoint.timestamps.find(
      ts => ts.id === currentTimestamp.id
    );
    return timestamp ? timestamp.nodes : [];
  }, [currentWaypoint, currentTimestamp]);
};

export const useCurrentLinks = () => {
  const { currentWaypoint, currentTimestamp } = useEditorContext();
  return useMemo(() => {
    const timestamp = currentWaypoint.timestamps.find(
      ts => ts.id === currentTimestamp.id
    );
    return timestamp ? timestamp.links : [];
  }, [currentWaypoint, currentTimestamp]);
};
