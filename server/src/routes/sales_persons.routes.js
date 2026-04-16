import { Router } from "express";
import * as salesPersonController from "../controllers/sales_persons.controller.js";

const router = Router();

router.get("/", salesPersonController.list);
router.get("/:code", salesPersonController.get);
router.delete("/:code", salesPersonController.remove);

export default router;
