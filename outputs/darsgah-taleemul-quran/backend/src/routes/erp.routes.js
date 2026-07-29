import { Router } from "express";
import { body } from "express-validator";
import { allowRoles, protect, requireAdmin, requireFacultyOrAdmin } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as erp from "../controllers/erp.controller.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.use(protect);

router.get("/analytics", requireAdmin, asyncHandler(erp.analytics));
router.get("/accounts", requireAdmin, asyncHandler(erp.listAccounts));
router.post("/upload", requireFacultyOrAdmin, upload.single("file"), asyncHandler(erp.uploadFile));
router.post("/syllabus/upload", requireFacultyOrAdmin, upload.array("files", 10), asyncHandler(erp.uploadSyllabus));
router.post("/credentials", requireAdmin, [
  body("role").isIn(["student", "parent", "faculty"]),
  body("username").notEmpty()
], asyncHandler(erp.saveCredentials));
router.post("/generate-login", requireAdmin, [
  body("role").isIn(["student", "parent", "faculty"]),
  body("username").notEmpty(),
  body("password").isLength({ min: 6 })
], asyncHandler(erp.generateLogin));

router.get("/faculty/dashboard", allowRoles("faculty", "admin"), asyncHandler(erp.facultyDashboard));
router.post("/faculty/attendance", allowRoles("faculty", "admin"), asyncHandler(erp.saveClassAttendance));
router.post("/faculty/results", allowRoles("faculty", "admin"), asyncHandler(erp.saveResultEntry));
router.get("/students/:id/performance", allowRoles("student", "parent", "faculty", "admin"), asyncHandler(erp.studentPerformance));

router.get("/:resource", requireFacultyOrAdmin, asyncHandler(erp.listResource));
router.post("/:resource", requireFacultyOrAdmin, asyncHandler(erp.createResource));
router.get("/:resource/:id", requireFacultyOrAdmin, asyncHandler(erp.getResource));
router.put("/:resource/:id", requireFacultyOrAdmin, asyncHandler(erp.updateResource));
router.delete("/:resource/:id", requireAdmin, asyncHandler(erp.deleteResource));

export default router;
