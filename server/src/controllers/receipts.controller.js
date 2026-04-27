// Receipt API handlers. Thin layer: decode params, call service, format response.
import * as receiptsService from "../services/receipts.service.js";
import { sendList, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";
import logger from "../utils/logger.js";

export async function listReceipts(req, res) {
  try {
    sendList(res, await receiptsService.listReceipts(req.query));
  } catch (err) {
    logger.error("listReceipts failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function listUnpaidInvoices(req, res) {
  try {
    sendList(res, { data: await receiptsService.listUnpaidInvoices(req.query) });
  } catch (err) {
    logger.error("listUnpaidInvoices failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getReceipt(req, res) {
  try {
    const receiptNo = decodeURIComponent(req.params.receiptNo || "");
    const result = await receiptsService.getReceipt(receiptNo);
    if (!result) return sendError(res, "Receipt not found", 404);
    sendOne(res, result);
  } catch (err) {
    logger.error("getReceipt failed", { receiptNo: req.params.receiptNo, error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function createReceipt(req, res) {
  try {
    sendCreated(res, await receiptsService.createReceipt(req.body));
  } catch (err) {
    logger.error("createReceipt failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function updateReceipt(req, res) {
  try {
    const receiptNo = decodeURIComponent(req.params.receiptNo || "");
    const result = await receiptsService.updateReceipt(receiptNo, req.body);
    if (!result) return sendError(res, "Receipt not found", 404);
    sendOk(res, result);
  } catch (err) {
    logger.error("updateReceipt failed", { receiptNo: req.params.receiptNo, error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function deleteReceipt(req, res) {
  try {
    const receiptNo = decodeURIComponent(req.params.receiptNo || "");
    const result = await receiptsService.deleteReceipt(receiptNo);
    if (!result) return sendError(res, "Receipt not found", 404);
    sendOk(res, result);
  } catch (err) {
    logger.error("deleteReceipt failed", { receiptNo: req.params.receiptNo, error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function receiptReport(req, res) {
  try {
    sendList(res, await receiptsService.receiptReport(req.query));
  } catch (err) {
    logger.error("receiptReport failed", { error: err?.message ?? String(err) });
    sendError(res, err?.message ?? String(err), 500);
  }
}

