import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authorizedMiddleware } from "../middleware/authorized.middleware";
import { uploads } from "../middleware/file-upload";

export class AuthRoutes {
  private router: Router;

  constructor(private authController: AuthController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/register", this.authController.register);
    this.router.post("/login", this.authController.login);
    this.router.get("/users", this.authController.getAllUsers);
    this.router.put(
      "/user/update",
      authorizedMiddleware,
      uploads.single("image"),
      this.authController.updateProfile,
    );
    this.router.get("/me", authorizedMiddleware, this.authController.me);

    this.router.post(
      "/request-password-reset",
      this.authController.sendResetPasswordEmail,
    );
    this.router.post(
      "/reset-password/:token",
      this.authController.resetPassword,
    );
  }

  getRouter(): Router {
    return this.router;
  }
}
