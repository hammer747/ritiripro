import { Router } from "express";
import { loginController, registerController, updateProfileController } from "../controllers/auth.controller";

const router = Router();
router.post("/login", loginController);
router.post("/register", registerController);
router.put("/profile", updateProfileController);
export default router;
