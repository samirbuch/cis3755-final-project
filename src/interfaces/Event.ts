import { z } from "zod";

export const ZodEvent = z.object({
  id: z.number(),
  eventTitle: z.string(),
  eventDescription: z.string().optional(),
});
type Event = z.infer<typeof ZodEvent>;
export default Event;