import { Router } from "express";
import { z } from "zod";
import { logger } from "../config/logger.js";
import { streamGroqCompletion } from "../services/groqService.js";
import {
  getRecentQuestions,
  saveInterviewTurn,
  upsertProfile,
} from "../services/interviewStore.js";
import { buildInterviewPrompt } from "../services/promptBuilder.js";
import { detectQuestionType } from "../services/questionType.js";
import { parseAssistantResponse } from "../services/responseParser.js";
import { assistantModeSchema } from "../types/interview.js";

const askBodySchema = z.object({
  userId: z.string().min(1),
  transcript: z.string().min(2),
  mode: assistantModeSchema.default("HR"),
  profile: z
    .object({
      name: z.string().optional(),
      targetRole: z.string().optional(),
      yearsExperience: z.coerce.number().optional(),
      strengths: z.array(z.string()).optional(),
      intro: z.string().optional(),
    })
    .optional(),
});

export const askRouter = Router();

askRouter.post("/ask", async (req, res) => {
  const parseResult = askBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "Invalid request body",
      details: parseResult.error.flatten(),
    });
    return;
  }

  const body = parseResult.data;
  const questionType = detectQuestionType(body.transcript);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (payload: object) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    await upsertProfile(body.userId, body.profile);
    const recentQuestions = await getRecentQuestions(body.userId);
    const prompt = buildInterviewPrompt({
      transcript: body.transcript,
      mode: body.mode,
      questionType,
      profile: body.profile,
      recentQuestions,
    });

    const raw = await streamGroqCompletion({
      prompt,
      onToken: (token) => sendEvent({ type: "token", token }),
    });

    const parsed = parseAssistantResponse(raw, questionType);
    await saveInterviewTurn({
      userId: body.userId,
      transcript: body.transcript,
      mode: body.mode,
      questionType: parsed.questionType,
      response: parsed,
      profile: body.profile,
    });

    sendEvent({
      type: "done",
      data: parsed,
    });
    res.end();
  } catch (error) {
    logger.error(error, "Failed to stream /ask");
    sendEvent({
      type: "error",
      message: "Assistant failed to generate a response.",
    });
    res.end();
  }
});
