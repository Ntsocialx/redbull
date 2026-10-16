import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { createPosterSignature } from "../services/cloudinary.js";

export const uploadsRouter = Router();
uploadsRouter.use(authenticate);

uploadsRouter.post("/signature", async (_request, response) => {
  try {
    const signature = await createPosterSignature(response.locals.adminId, response.locals.sessionId);
    response.json({ data: signature });
  } catch (error) {
    if (error instanceof Error && error.message === "CLOUDINARY_NOT_CONFIGURED") {
      response.status(503).json({ error: { code: "UPLOAD_UNAVAILABLE", message: "Poster uploads are not configured." } });
      return;
    }
    throw error;
  }
});
