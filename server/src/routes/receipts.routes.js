// Receipt API routes.
import { Router } from "express";
import * as c from "../controllers/receipts.controller.js";

const r = Router();
r.get("/unpaid-invoices", c.listUnpaidInvoices);
r.get("/report/list", c.receiptReport);
r.get("/", c.listReceipts);
r.get("/:receiptNo", c.getReceipt);
r.post("/", c.createReceipt);
r.put("/:receiptNo", c.updateReceipt);
r.delete("/:receiptNo", c.deleteReceipt);

export default r;

