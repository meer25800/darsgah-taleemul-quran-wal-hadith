import { Router } from "express";
import { childGradeCard, childIdCard, parentDashboard } from "../controllers/parent.controller.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect, allowRoles("parent"));
router.get("/dashboard", parentDashboard);
router.get("/children/:studentId/grade-card", childGradeCard);
router.get("/children/:studentId/id-card", childIdCard);

export default router;
