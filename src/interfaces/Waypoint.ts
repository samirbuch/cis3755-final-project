import { z } from "zod";
import { ZodNode, ZodNodeNoPos } from "./Node";
import { ZodLink, ZodLinkNoPos } from "./Link";
import { ZodEvent } from "./Event";

export const ZodWaypointNoPos = z.object({
  id: z.number(),
  timestamp: z.object({
    year: z.number().optional(),
    month: z.number().optional(),
    day: z.number().optional(),
  }).optional(),
  events: z.array(ZodEvent),

  nodes: z.array(ZodNodeNoPos),
  links: z.array(ZodLinkNoPos)
});
export type WaypointNoPos = z.infer<typeof ZodWaypointNoPos>;

export const ZodWaypoint = ZodWaypointNoPos.extend({
  nodes: z.array(ZodNode),
  links: z.array(ZodLink)
});
type Waypoint = z.infer<typeof ZodWaypoint>;
export default Waypoint;
