import { Router } from "express";
import {
  createRitiroController,
  deleteRitiroController,
  getAllRitiriController,
  getRitiroByIdController,
  updateRitiroController,
} from "../controllers/ritiri.controller";
import { upload } from "../middleware/upload";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getAllRitiriController);
router.get("/:id", getRitiroByIdController);

router.post(
  "/",
  upload.fields([
    { name: "documentoFronte", maxCount: 1 },
    { name: "documentoRetro", maxCount: 1 },
    { name: "ricevutaAcquisto", maxCount: 1 },
  ]),
  createRitiroController
);

router.put(
  "/:id",
  upload.fields([
    { name: "documentoFronte", maxCount: 1 },
    { name: "documentoRetro", maxCount: 1 },
    { name: "ricevutaAcquisto", maxCount: 1 },
  ]),
  updateRitiroController
);

router.delete("/:id", deleteRitiroController);

export default router;
