import { Router } from "express";

import {
  MentionController,
} from "../controllers/mention.controller";

const router = Router();


router.post("/internal/mentions/bulk", MentionController.seedAllMentions);
router.get("/mentions", MentionController.searchMentions)

export default router;