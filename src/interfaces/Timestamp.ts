import { z } from "zod";
import { ZodNode, ZodNodeNoPos } from "./Node";
import { ZodLink, ZodLinkNoPos } from "./Link";

export const ZodTimestampNoPos = z.object({
  id: z.number(),
  year: z.number().optional(),
  month: z.number().optional(),
  day: z.number().optional(),

  nodes: z.array(ZodNodeNoPos),
  links: z.array(ZodLinkNoPos)
});
export type TimestampNoPos = z.infer<typeof ZodTimestampNoPos>;

export const ZodTimestamp = ZodTimestampNoPos.extend({
  nodes: z.array(ZodNode),
  links: z.array(ZodLink)
});
type Timestamp = z.infer<typeof ZodTimestamp>;
export default Timestamp;