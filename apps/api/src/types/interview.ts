import { z } from "zod";

export const assistantModeSchema = z.enum(["HR", "Technical", "Startup"]);
export type AssistantMode = z.infer<typeof assistantModeSchema>;

export const questionTypeSchema = z.enum(["HR", "TECHNICAL", "BEHAVIORAL"]);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export interface CandidateProfile {
  name?: string;
  targetRole?: string;
  yearsExperience?: number;
  strengths?: string[];
  intro?: string;
}

export interface InterviewAssistantResponse {
  shortAnswer: string;
  bulletPoints: string[];
  confidenceTips: string[];
  questionType: QuestionType;
  raw: string;
}
