import { z } from "zod";

// Validation: use business keys (customer_code, product_code), not primary keys.
export const CreateInvoiceSchema = z.object({
  invoice_no: z.string().optional(), // Optional for auto-generation
  customer_code: z.string().min(1, "Customer code is required"),
  sales_person_code: z.string().optional(),
  invoice_date: z.string().min(8), // YYYY-MM-DD
  vat_rate: z.coerce.number().min(0).max(1).default(0.07),
  line_items: z
    .array(
      z.object({
        id: z.coerce.number().int().optional(), // invoice_line_item.id when updating existing row
        product_code: z.string().min(1, "Product code is required"),
        quantity: z.coerce.number().positive(),
        unit_price: z.coerce.number().nonnegative().optional(),
        line_discount_percent: z.coerce.number().min(0).max(100).default(0),
      }),
    )
    .min(1),
});

