import * as salesPersonService from "../services/sales_persons.service.js";
import { sendList, sendData, sendError, sendCreated, sendOk } from "../utils/response.js";
import logger from "../utils/logger.js";

export async function list(req, res) {
  try {
    const { search, page, limit, sortBy, sortDir } = req.query;
    const result = await salesPersonService.listSalesPersons({ search, page, limit, sortBy, sortDir });
    return sendList(res, result);
  } catch (err) {
    logger.error("listSalesPersons failed", { error: err.message });
    return sendError(res, err.message);
  }
}

export async function get(req, res) {
  try {
    const { code } = req.params;
    const salesPerson = await salesPersonService.getSalesPersonByCode(code);
    if (!salesPerson) return sendError(res, "Sales Person not found", 404);
    return sendData(res, salesPerson);
  } catch (err) {
    logger.error("getSalesPerson failed", { code: req.params.code, error: err.message });
    return sendError(res, err.message);
  }
}

export async function create(req, res) {
  try {
    const result = await salesPersonService.createSalesPerson(req.body);
    return sendCreated(res, result);
  } catch (err) {
    logger.error("createSalesPerson failed", { error: err.message });
    return sendError(res, err.message, 400);
  }
}

export async function update(req, res) {
  try {
    const { code } = req.params;
    const result = await salesPersonService.updateSalesPersonByCode(code, req.body);
    if (!result) return sendError(res, "Sales Person not found", 404);
    return sendOk(res, result);
  } catch (err) {
    logger.error("updateSalesPerson failed", { code: req.params.code, error: err.message });
    return sendError(res, err.message, 400);
  }
}

export async function remove(req, res) {
  try {
    const { code } = req.params;
    const deleted = await salesPersonService.deleteSalesPersonByCode(code);
    if (!deleted) return sendError(res, "Sales Person not found", 404);
    return sendOk(res, { message: "Sales Person deleted" });
  } catch (err) {
    logger.error("deleteSalesPerson failed", { code: req.params.code, error: err.message });
    return sendError(res, err.message);
  }
}
