// Product API routes
// Example usage: GET /api/products
import { Router } from "express";
import * as c from "../controllers/products.controller.js";

const r = Router();

// List products with pagination, search, sort
r.get("/", c.listProducts);
r.post("/", c.createProduct);
r.get("/units", c.listUnits);
// Get/update/delete by business key (code), not primary key
r.put("/:code", c.updateProduct);
r.delete("/:code", c.deleteProduct);
r.get("/:code", c.getProduct);

export default r;
