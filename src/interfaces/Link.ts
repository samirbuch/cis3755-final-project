import { ZodNodeNoPos, ZodNode } from "./Node";
import { z } from "zod";

export const ZodLinkSourceTargetID = z.object({
  id: z.number(),
  source: z.number(),
  target: z.number(),

  sourceToTargetPPM: z.object({
    ppm: z.number(),
    mppm: z.number(),
  }),
  targetToSourcePPM: z.object({
    ppm: z.number(),
    mppm: z.number(),
  }),
});
export type LinkSourceTargetID = z.infer<typeof ZodLinkSourceTargetID>;

export const ZodLinkNoPos = ZodLinkSourceTargetID.extend({
  source: ZodNodeNoPos,
  target: ZodNodeNoPos,
});
export type LinkNoPos = z.infer<typeof ZodLinkNoPos>;

export const ZodLink = ZodLinkNoPos.extend({
  source: ZodNode,
  target: ZodNode,
});
type Link = z.infer<typeof ZodLink>;

export default Link;