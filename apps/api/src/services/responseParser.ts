import type {
  InterviewAssistantResponse,
  QuestionType,
} from "../types/interview.js";

const fallbackAnswer = "Let me share a concise, structured answer.";

function readBlock(raw: string, section: string): string {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `\\[${escaped}\\]([\\s\\S]*?)(?=\\n\\[[A-Z_]+\\]|$)`,
    "i"
  );
  const match = raw.match(regex);
  return match?.[1]?.trim() ?? "";
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.replace(/^-+\s*/, "").trim())
    .filter(Boolean);
}

function parseQuestionType(text: string, fallback: QuestionType): QuestionType {
  const normalized = text.trim().toUpperCase();
  if (normalized === "HR" || normalized === "TECHNICAL" || normalized === "BEHAVIORAL") {
    return normalized;
  }
  return fallback;
}

export function parseAssistantResponse(
  raw: string,
  fallbackQuestionType: QuestionType
): InterviewAssistantResponse {
  const shortAnswer = readBlock(raw, "SHORT_ANSWER") || fallbackAnswer;
  const bulletPoints = parseBullets(readBlock(raw, "BULLET_POINTS"));
  const confidenceTips = parseBullets(readBlock(raw, "CONFIDENCE_TIPS"));
  const parsedQuestionType = parseQuestionType(
    readBlock(raw, "QUESTION_TYPE"),
    fallbackQuestionType
  );

  return {
    shortAnswer,
    bulletPoints,
    confidenceTips,
    questionType: parsedQuestionType,
    raw,
  };
}
