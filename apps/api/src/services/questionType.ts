import type { QuestionType } from "../types/interview.js";

const technicalHints = [
  "algorithm",
  "complexity",
  "system design",
  "database",
  "api",
  "bug",
  "optimize",
  "code",
  "scalability",
  "microservice",
];

const behavioralHints = [
  "challenge",
  "conflict",
  "team",
  "lead",
  "mistake",
  "learned",
  "situation",
  "example",
  "deadline",
];

export function detectQuestionType(transcript: string): QuestionType {
  const text = transcript.toLowerCase();

  if (technicalHints.some((hint) => text.includes(hint))) {
    return "TECHNICAL";
  }

  if (behavioralHints.some((hint) => text.includes(hint))) {
    return "BEHAVIORAL";
  }

  return "HR";
}
