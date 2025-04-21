import { useEditorContext } from "@/contexts/EditorContext";
import Waypoint from "@/interfaces/Waypoint";
import { Button } from "@mantine/core";
import WaypointCard from "./WaypointCard";

export default function WaypointsPanel() {
  const editorContext = useEditorContext();

  const createWaypoint = () => {
    const waypoint: Waypoint = {
      id: editorContext.waypointCounter,
      nodes: [],
      links: [],
      events: [],
      timestamp: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        day: new Date().getDate(),
      },
    }

    editorContext.addWaypoint(waypoint);
  }

  return (
    <>
      <Button fullWidth onClick={createWaypoint}>
        Create Waypoint
      </Button>

      {editorContext.waypoints.map((waypoint) => (
        <WaypointCard key={waypoint.id} waypoint={waypoint} />
      ))}
    </>
  )
}