import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";
import { uploads } from "../middleware/file-upload";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/users", authController.getAllUsers);
router.put(
  "/user/update",
  authorizedMiddleware,
  uploads.single("image"),
  authController.updateProfile,
);
router.get("/me", authorizedMiddleware, authController.me);

router.post("/request-password-reset", authController.sendResetPasswordEmail);
router.post("/reset-password/:token", authController.resetPassword);

export default router;
