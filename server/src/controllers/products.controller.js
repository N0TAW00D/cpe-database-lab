import * as productsService from "../services/products.service.js";
import { sendList, sendData, sendOne, sendCreated, sendOk, sendError } from "../utils/response.js";

export async function listProducts(req, res) {
  try {
    const result = await productsService.listProducts(req.query);
    sendList(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function createProduct(req, res) {
  try {
    const result = await productsService.createProduct(req.body);
    sendCreated(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 400);
  }
}

export async function updateProduct(req, res) {
  try {
    const code = decodeURIComponent(req.params.code || "");
    const result = await productsService.updateProductByCode(code, req.body);
    if (!result) return sendError(res, "Product not found", 404);
    sendOk(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 400);
  }
}

export async function deleteProduct(req, res) {
  try {
    const code = decodeURIComponent(req.params.code || "");
    const force = req.query.force === "true";
    const result = await productsService.deleteProductByCode(code, { force });
    if (!result) return sendError(res, "Product not found", 404);
    sendOk(res, result);
  } catch (err) {
    sendError(res, err?.message ?? String(err), err?.statusCode ?? 500);
  }
}

export async function listUnits(_req, res) {
  try {
    const result = await productsService.listUnits();
    sendData(res, result.data);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}

export async function getProduct(req, res) {
  try {
    const code = decodeURIComponent(req.params.code || "");
    const row = await productsService.getProductByCode(code);
    if (!row) return sendError(res, "Product not found", 404);
    sendOne(res, row);
  } catch (err) {
    sendError(res, err?.message ?? String(err), 500);
  }
}
