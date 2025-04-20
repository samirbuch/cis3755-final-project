import { ZodNodeNoPos, ZodNode } from "./Node";
import { z } from "zod";

export const ZodLinkNoPos = z.object({
  id: z.number(),
  source: ZodNodeNoPos,
  target: ZodNodeNoPos,

  sourceToTargetPPM: z.object({
    ppm: z.number(),
    mppm: z.number(),
  }),
  targetToSourcePPM: z.object({
    ppm: z.number(),
    mppm: z.number(),
  }),
});
export type LinkNoPos = z.infer<typeof ZodLinkNoPos>;

export const ZodLink = ZodLinkNoPos.extend({
  source: ZodNode,
  target: ZodNode,
});
type Link = z.infer<typeof ZodLink>;

export default Link;