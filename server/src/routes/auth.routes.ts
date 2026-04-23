import { Router } from "express";
import { loginController, registerController, updateProfileController, registrationStatusController } from "../controllers/auth.controller";
import { authMiddleware, loginRateLimiter } from "../middleware/auth.middleware";

const router = Router();
router.get("/registration-status", registrationStatusController);
router.post("/login", loginRateLimiter, loginController);
router.post("/register", loginRateLimiter, registerController);
router.put("/profile", authMiddleware, updateProfileController);
export default router;
