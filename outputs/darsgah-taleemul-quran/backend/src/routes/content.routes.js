import { Router } from "express";
import { allowRoles, protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as content from "../controllers/content.controller.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/search", asyncHandler(content.globalSearch));
router.get("/books/:id/view", asyncHandler(content.trackBookView));
router.get("/books/:id/download", asyncHandler(content.trackBookDownload));
router.get("/resources/:id/view", asyncHandler(content.trackResourceView));
router.get("/resources/:id/download", asyncHandler(content.trackResourceDownload));
router.get("/syllabus/:id/view", asyncHandler(content.viewSyllabus));
router.post("/books/upload", protect, allowRoles("admin"), upload.fields([{ name: "pdf", maxCount: 1 }, { name: "cover", maxCount: 1 }]), asyncHandler(content.uploadBook));
router.post("/resources/upload", protect, allowRoles("admin", "faculty"), upload.single("file"), asyncHandler(content.uploadResource));

export default router;
