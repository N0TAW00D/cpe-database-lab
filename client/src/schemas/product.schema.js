// Validation rules for product form (used with react-hook-form + zod)
import { z } from "zod";

export const productFormSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, "Name should not be null"),
  units_id: z.string().min(1, "Unit should be selected"),
  unit_price: z
    .union([z.string(), z.number()])
    .refine((v) => v !== "" && v != null, "Unit Price should not be null")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Unit Price should be a positive number"),
});
