import { z } from "zod";

export const salesPersonFormSchema = z.object({
  code: z.string().max(10, "Code must be 10 characters or less").optional().or(z.literal("")),
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  start_work_date: z.string().optional().or(z.literal("")),
});
