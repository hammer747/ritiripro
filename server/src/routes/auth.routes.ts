import { Router } from "express";
import { loginController, registerController, updateProfileController, registrationStatusController } from "../controllers/auth.controller";

const router = Router();
router.get("/registration-status", registrationStatusController);
router.post("/login", loginController);
router.post("/register", registerController);
router.put("/profile", updateProfileController);
export default router;
