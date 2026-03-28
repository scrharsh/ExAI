import { Router } from "express";
import { getUserSnapshot } from "../services/interviewStore.js";

export const profileRouter = Router();

profileRouter.get("/profile/:userId", async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  try {
    const snapshot = await getUserSnapshot(userId);
    res.json(snapshot);
  } catch {
    res.status(500).json({ error: "Failed to fetch user snapshot" });
  }
});
