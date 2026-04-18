import { Router } from "express";
import * as salesPersonController from "../controllers/sales_persons.controller.js";

const router = Router();

router.get("/", salesPersonController.list);
router.post("/", salesPersonController.create);
router.get("/:code", salesPersonController.get);
router.put("/:code", salesPersonController.update);
router.delete("/:code", salesPersonController.remove);

export default router;
