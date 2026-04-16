import * as salesPersonService from "../services/sales_persons.service.js";
import { sendList, sendData, sendError } from "../utils/response.js";

export async function list(req, res) {
  try {
    const { search, page, limit, sortBy, sortDir } = req.query;
    const result = await salesPersonService.listSalesPersons({ search, page, limit, sortBy, sortDir });
    return sendList(res, {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
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
    return sendError(res, err.message);
  }
}
