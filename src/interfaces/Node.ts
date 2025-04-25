import { z } from "zod";

// This was an older version of the ZodNode schema, before we started
// storing the x and y coordinates as percentages.
export const ZodNodeNoPos = z.object({
  id: z.number(),
  name: z.string(),
  highlighted: z.boolean()
});
export type NodeNoPos = z.infer<typeof ZodNodeNoPos>;

// This is the schema most should Nodes be using.
export const ZodNodeNoFixed = ZodNodeNoPos.extend({
  x: z.number(),
  y: z.number()
});
export type NodeNoFixed = z.infer<typeof ZodNodeNoFixed>;

export const ZodNode = ZodNodeNoPos.extend({
  fx: z.number().optional().nullable(),
  fy: z.number().optional().nullable(),
});

type Node = z.infer<typeof ZodNode>;
export default Node;