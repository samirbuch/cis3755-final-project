import { useEditorContext } from "@/contexts/EditorContext";
import Waypoint from "@/interfaces/Waypoint";
import { Button } from "@mantine/core";
import WaypointCard from "./WaypointCard";

export default function WaypointsPanel() {
  const editorContext = useEditorContext();

  const createWaypoint = () => {
    const currentWaypoint = editorContext.currentWaypoint;
    const clonedWaypoint = { ...currentWaypoint, id: currentWaypoint.id + 1 };

    editorContext.addWaypoint(clonedWaypoint);
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