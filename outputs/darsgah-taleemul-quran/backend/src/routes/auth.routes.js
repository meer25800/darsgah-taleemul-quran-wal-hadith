import { Router } from "express";
import { body } from "express-validator";
import { forgotPasswordRequest, forgotPasswordReset, forgotPasswordVerify, login, me } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.post("/login", [
  body("username").trim().notEmpty(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["student", "parent", "faculty", "admin"])
], login);

router.get("/me", protect, me);
router.post("/forgot-password/request", forgotPasswordRequest);
router.post("/forgot-password/verify", forgotPasswordVerify);
router.post("/forgot-password/reset", forgotPasswordReset);

export default router;
