// Validation rules for customer form (used with react-hook-form + zod)
import { z } from "zod";

export const customerFormSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name should not be null"),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  country_id: z.string().min(1, "Country should be selected"),
  credit_limit: z.union([z.string(), z.number()]).optional(),
});
