// Customer API routes
// Example usage: GET /api/customers
import { Router } from "express";
import * as c from "../controllers/customers.controller.js";

const r = Router();

// List customers with pagination, search, sort
r.get("/", c.listCustomers);
// Create customer (supports auto code)
r.post("/", c.createCustomer);
r.get("/countries", c.listCountries);
// Get/update/delete by business key (code), not primary key
r.put("/:code", c.updateCustomer);
r.delete("/:code", c.deleteCustomer);
r.get("/:code", c.getCustomer);

export default r;
