import express from "express";
import { createVacancy, getVacancies, updateVacancy, deleteVacancy } from "../controllers/vacancyController.js";
import { protect } from "../middleware/authMiddleware.js";
import { restrictTo } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect); // Need to be logged in for all
router.get("/", restrictTo("admin", "leader", "hr"), getVacancies);
router.post("/", restrictTo("admin", "leader"), createVacancy);
router.put("/:id", restrictTo("admin", "leader"), updateVacancy);
router.delete("/:id", restrictTo("admin", "leader"), deleteVacancy);

export default router;
