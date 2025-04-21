import Waypoint from "@/interfaces/Waypoint";
import { NodeNoPos } from "@/interfaces/Node";
import { LinkNoPos } from "@/interfaces/Link";

/**
 * Output the differences between two waypoints. The diff itself should not be
 * taken as a waypoint, but rather as a set of changes to be applied to the
 * first waypoint to get the second waypoint.
 * @param wp1 
 * @param wp2 
 */
export default function waypointDiff(wp1: Waypoint, wp2: Waypoint) {

}