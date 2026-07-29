import { Router } from "express";
import { body } from "express-validator";
import { createAdmission, createContact, islamicAssistantSettings, publicHome, publicList } from "../controllers/public.controller.js";

const router = Router();
router.get("/home", publicHome);
router.get("/islamic-assistant-settings", islamicAssistantSettings);
router.get("/:resource", publicList);
router.post("/admissions", [body("studentName").notEmpty(), body("phone").notEmpty()], createAdmission);
router.post("/contact", [body("name").notEmpty(), body("message").notEmpty()], createContact);

export default router;
