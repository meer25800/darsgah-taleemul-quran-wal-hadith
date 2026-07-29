import { Router } from "express";
import { allowRoles, protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import * as media from "../controllers/media.controller.js";

const router = Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get("/gallery", asyncHandler(media.listGallery));
router.get("/videos", asyncHandler(media.listVideos));

router.post("/gallery", protect, allowRoles("super_admin", "admin"), upload.single("file"), asyncHandler(media.createGallery));
router.put("/gallery/:id", protect, allowRoles("super_admin", "admin"), upload.single("file"), asyncHandler(media.updateGallery));
router.delete("/gallery/:id", protect, allowRoles("super_admin", "admin"), asyncHandler(media.deleteGallery));

router.post("/videos", protect, allowRoles("super_admin", "admin"), asyncHandler(media.createVideo));
router.put("/videos/:id", protect, allowRoles("super_admin", "admin"), asyncHandler(media.updateVideo));
router.delete("/videos/:id", protect, allowRoles("super_admin", "admin"), asyncHandler(media.deleteVideo));

export default router;
