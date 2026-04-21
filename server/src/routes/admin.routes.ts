import { Router } from "express";
import { createUserController, deleteUserController, listLogsController, listUsersController } from "../controllers/admin.controller";

const router = Router();
router.get("/users", listUsersController);
router.post("/users", createUserController);
router.delete("/users/:email", deleteUserController);
router.get("/logs", listLogsController);
export default router;
