import { z } from "zod";

export const ZodNodeNoPos = z.object({
  id: z.number(),
  name: z.string(),
  highlighted: z.boolean()
});
export type NodeNoPos = z.infer<typeof ZodNodeNoPos>;

export const ZodNode = ZodNodeNoPos.extend({
  x: z.number(),
  y: z.number(),
  fx: z.number().optional().nullable(),
  fy: z.number().optional().nullable(),
});

type Node = z.infer<typeof ZodNode>;
export default Node;