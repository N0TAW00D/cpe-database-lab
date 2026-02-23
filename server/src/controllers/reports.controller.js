// Report API handlers: sales by product, monthly sales, customer buying. All use parameterized queries.
import * as reportsService from "../services/reports.service.js";
import { sendList, sendData, sendError } from "../utils/response.js";

export async function getInvoicesMonthlySummary(req, res) {
  try {
    const limit = req.query.limit != null ? req.query.limit : undefined;
    const result = await reportsService.getInvoicesMonthlySummary({ limit });
    sendData(res, result.data);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getSalesByProductSummary(req, res) {
  try {
    const result = await reportsService.getSalesByProductSummary(req.query);
    sendList(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getSalesByCustomerSummary(req, res) {
  try {
    const result = await reportsService.getSalesByCustomerSummary(req.query);
    sendList(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getSalesByProductMonthlySummary(req, res) {
  try {
    const result = await reportsService.getSalesByProductMonthlySummary(req.query);
    sendList(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}
