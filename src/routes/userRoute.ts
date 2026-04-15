import express, { Router } from "express";
import { login, getMe } from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router: Router = express.Router();

router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;