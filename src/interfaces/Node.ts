import { z } from "zod";

/**
 * @deprecated
 * This was an older version of the ZodNode schema, before we started
 * storing the x and y coordinates as percentages.
 */
export const OldZodNode = z.object({
  id: z.number(),
  name: z.string(),
  highlighted: z.boolean()
});
/**
 * @deprecated
 * This was an older version of the ZodNode schema, before we started
 * storing the x and y coordinates as percentages.
 */
export type OldNodeNoPos = z.infer<typeof OldZodNode>;

// This is the schema most should Nodes be using.
export const ZodNodeNoFixed = OldZodNode.extend({
  x: z.number(),
  y: z.number(),
  color: z.string()
});
export type NodeNoFixed = z.infer<typeof ZodNodeNoFixed>;

export const ZodNode = ZodNodeNoFixed.extend({
  fx: z.number().optional().nullable(),
  fy: z.number().optional().nullable(),
});

type Node = z.infer<typeof ZodNode>;
export default Node;