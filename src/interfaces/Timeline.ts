import { z } from "zod";
import { ZodEvent } from "./Event";

export const ZodTimeline = z.array(ZodEvent);
type ZodTimelineT = z.infer<typeof ZodTimeline>;
export default ZodTimelineT;