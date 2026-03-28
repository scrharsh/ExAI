export type AssistantMode = "HR" | "Technical" | "Startup";
export type QuestionType = "HR" | "TECHNICAL" | "BEHAVIORAL";

export interface CandidateProfile {
  name?: string;
  targetRole?: string;
  yearsExperience?: number;
  strengths?: string[];
  intro?: string;
}

export interface AssistantResponse {
  shortAnswer: string;
  bulletPoints: string[];
  confidenceTips: string[];
  questionType: QuestionType;
  raw: string;
}

export interface AskPayload {
  userId: string;
  transcript: string;
  mode: AssistantMode;
  profile?: CandidateProfile;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  sections?: {
    shortAnswer?: string;
    bulletPoints?: string[];
    confidenceTips?: string[];
  };
}
