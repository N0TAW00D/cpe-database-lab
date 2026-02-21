import * as customersService from "../services/customers.service.js";
import { sendList, sendData, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";

export async function listCustomers(req, res) {
  try {
    const result = await customersService.listCustomers(req.query);
    sendList(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function createCustomer(req, res) {
  try {
    const result = await customersService.createCustomer(req.body);
    sendCreated(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 400);
  }
}

export async function updateCustomer(req, res) {
  try {
    const code = decodeURIComponent(req.params.code || "");
    const result = await customersService.updateCustomerByCode(code, req.body);
    if (!result) return sendError(res, "Customer not found", 404);
    sendOk(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 400);
  }
}

export async function deleteCustomer(req, res) {
  try {
    const code = decodeURIComponent(req.params.code || "");
    const force = req.query.force === "true";
    const result = await customersService.deleteCustomerByCode(code, { force });
    if (!result) return sendError(res, "Customer not found", 404);
    sendOk(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), err?.statusCode ?? 500);
  }
}

export async function listCountries(_req, res) {
  try {
    const result = await customersService.listCountries();
    sendData(res, result.data);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getCustomer(req, res) {
  try {
    const code = decodeURIComponent(req.params.code || "");
    const row = await customersService.getCustomerByCode(code);
    if (!row) return sendError(res, "Customer not found", 404);
    sendOne(res, row);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}
