import { Router } from "express";
import { listClientsController, deleteClientController } from "../controllers/clients.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
router.use(authMiddleware);
router.get("/", listClientsController);
router.delete("/:id", deleteClientController);
export default router;
