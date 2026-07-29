import { Router } from "express";
import { downloadGradeCard, downloadIdCard, myDashboard } from "../controllers/student.controller.js";
import { allowRoles, protect } from "../middleware/auth.js";

const router = Router();
router.use(protect, allowRoles("student"));
router.get("/me/dashboard", myDashboard);
router.get("/me/grade-card", downloadGradeCard);
router.get("/me/id-card", downloadIdCard);

export default router;
