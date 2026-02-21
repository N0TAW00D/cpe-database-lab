import { z } from "zod";

// Validation: use business keys (customer_code, product_code), not primary keys.
export const CreateInvoiceSchema = z.object({
  invoice_no: z.string().optional(), // Optional for auto-generation
  customer_code: z.string().min(1, "Customer code is required"),
  invoice_date: z.string().min(8), // YYYY-MM-DD
  vat_rate: z.number().min(0).max(1).default(0.07),
  line_items: z
    .array(
      z.object({
        product_code: z.string().min(1, "Product code is required"),
        quantity: z.number().positive(),
        unit_price: z.number().nonnegative().optional(),
      }),
    )
    .min(1),
});

