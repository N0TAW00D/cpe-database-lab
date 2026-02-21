// Invoice API routes
// Example usage: POST /api/invoices
import { Router } from "express";
import * as c from "../controllers/invoices.controller.js";

const r = Router();
r.get("/", c.listInvoices);
r.get("/:invoiceNo", c.getInvoice);
r.post("/", c.createInvoice);
r.delete("/:invoiceNo", c.deleteInvoice);
r.put("/:invoiceNo", c.updateInvoice);

export default r;
