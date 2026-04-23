import { Router } from "express";
import { createUserController, deleteUserController, listLogsController, listUsersController } from "../controllers/admin.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);
router.get("/users", listUsersController);
router.post("/users", createUserController);
router.delete("/users/:email", deleteUserController);
router.get("/logs", listLogsController);
export default router;
