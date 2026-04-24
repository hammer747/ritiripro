import { Router } from "express";
import { loginController, registerController, updateProfileController, registrationStatusController, updateRegistrationStatusController } from "../controllers/auth.controller";
import { authMiddleware, loginRateLimiter } from "../middleware/auth.middleware";

const router = Router();
router.get("/registration-status", registrationStatusController);
router.post("/login", loginRateLimiter, loginController);
router.post("/register", loginRateLimiter, registerController);
router.put("/profile", authMiddleware, updateProfileController);
router.put("/registration-status", authMiddleware, updateRegistrationStatusController);
export default router;
