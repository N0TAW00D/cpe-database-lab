import { Router } from "express";
import * as salesPersonController from "../controllers/sales_persons.controller.js";

const router = Router();

router.get("/", salesPersonController.list);
router.get("/:code", salesPersonController.get);

export default router;
