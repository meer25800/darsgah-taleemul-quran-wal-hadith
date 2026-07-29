import { Router } from "express";
import * as admin from "../controllers/admin.controller.js";
import { allowRoles, protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.use(protect, allowRoles("admin"));

router.get("/analytics", admin.analytics);
router.get("/students", admin.listStudents);
router.post("/students", admin.createStudent);
router.put("/students/:id", admin.updateStudent);
router.delete("/students/:id", admin.deleteStudent);
router.post("/students/:id/photo", upload.single("photo"), admin.uploadStudentPhoto);
router.get("/students/export/csv", admin.exportStudents);
router.post("/students/login", admin.issueStudentLogin);
router.get("/students/:id/grade-card", admin.adminGradeCard);
router.get("/students/:id/id-card", admin.adminIdCard);
router.post("/parents", admin.createParent);
router.post("/subjects", admin.createSubject);
router.post("/marks", admin.addMark);
router.post("/attendance", admin.updateAttendance);
router.post("/fees", admin.upsertFee);
router.post("/notices", admin.createNotice);
router.post("/books", admin.createBook);
router.post("/resources", admin.createResource);
router.post("/gallery", admin.createGalleryItem);
router.get("/contact-messages", admin.contactMessages);

export default router;
