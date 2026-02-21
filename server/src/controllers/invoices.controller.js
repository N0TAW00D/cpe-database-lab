// Invoice API handlers: list, get, create, update, delete. Validation via Zod; errors returned as JSON.
import * as invoicesService from "../services/invoices.service.js";
import { CreateInvoiceSchema } from "../models/invoice.model.js";
import { sendList, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";

export async function listInvoices(req, res) {
  try {
    const result = await invoicesService.listInvoices(req.query);
    sendList(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getInvoice(req, res) {
  try {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo || "");
    const result = await invoicesService.getInvoice(invoiceNo);
    if (!result) return sendError(res, "Invoice not found", 404);
    sendOne(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function createInvoice(req, res) {
  // Zod validates body (customer_id, invoice_date, line_items...) before saving
  const parsed = CreateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());
  try {
    const result = await invoicesService.createInvoice(parsed.data);
    sendCreated(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function deleteInvoice(req, res) {
  try {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo || "");
    const result = await invoicesService.deleteInvoice(invoiceNo);
    if (!result) return sendError(res, "Invoice not found", 404);
    sendOk(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function updateInvoice(req, res) {
  const parsed = CreateInvoiceSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, "Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());
  try {
    const invoiceNo = decodeURIComponent(req.params.invoiceNo || "");
    const result = await invoicesService.updateInvoice(invoiceNo, parsed.data);
    if (!result) return sendError(res, "Invoice not found", 404);
    sendOk(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}
