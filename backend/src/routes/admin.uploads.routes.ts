import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { uploadsRouter } from "./uploads.routes.js";

export const adminUploadsRouter = Router();
adminUploadsRouter.use(authenticate);
adminUploadsRouter.use("/", uploadsRouter);
