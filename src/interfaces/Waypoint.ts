// Each waypoint is differentiated by its event. Each waypoint can have only
// one event mapped to it, but it can have multiple timestamps. Each timestamp
// has a year/month/day, and each timestamp can have multiple nodes and links.

import { z } from "zod";
import { ZodEvent } from "./Event";
import { ZodTimestampNoPos, ZodTimestamp } from "./Timestamp";

export const ZodWaypointNoPos = z.object({
  id: z.number(),
  timestamps: z.array(ZodTimestampNoPos),
  event: ZodEvent,
});
export type WaypointNoPos = z.infer<typeof ZodWaypointNoPos>;

export const ZodWaypoint = ZodWaypointNoPos.extend({
  timestamps: z.array(ZodTimestamp),
});
type Waypoint = z.infer<typeof ZodWaypoint>;
export default Waypoint;
