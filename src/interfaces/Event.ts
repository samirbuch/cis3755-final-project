import { z } from "zod";
import { ZodLinkSourceTargetID } from "./Link";
import { ZodNodeNoFixed, OldZodNode } from "./Node";

export const ZodEvent = z.object({
  eventTime: z.object({
    year: z.number(),
    month: z.number(),
    day: z.number(),
  }),
  eventTitle: z.string().nullable(),
  eventDescription: z.string().nullable(),
  nodes: z.array(z.union([ZodNodeNoFixed, OldZodNode])),
  links: z.array(ZodLinkSourceTargetID),
});
type ZodDataT = z.infer<typeof ZodEvent>;
export default ZodDataT;