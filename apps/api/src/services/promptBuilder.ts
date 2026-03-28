import type {
  AssistantMode,
  CandidateProfile,
  QuestionType,
} from "../types/interview.js";

interface PromptContext {
  transcript: string;
  mode: AssistantMode;
  questionType: QuestionType;
  profile?: CandidateProfile;
  recentQuestions?: string[];
}

function modeInstruction(mode: AssistantMode): string {
  if (mode === "Technical") {
    return "Prioritize technical clarity, trade-offs, and concise architecture detail.";
  }
  if (mode === "Startup") {
    return "Prioritize ownership, speed, product impact, and resourceful execution.";
  }
  return "Prioritize communication, motivation, role alignment, and professionalism.";
}

export function buildInterviewPrompt({
  transcript,
  mode,
  questionType,
  profile,
  recentQuestions = [],
}: PromptContext): string {
  return `
You are a real-time interview assistant helping a candidate answer live interview questions.

Candidate profile JSON:
${JSON.stringify(profile ?? {}, null, 2)}

Mode: ${mode}
Detected question type: ${questionType}
Mode strategy: ${modeInstruction(mode)}

Recent asked questions (avoid repeating the same framing):
${recentQuestions.length > 0 ? recentQuestions.map((q) => `- ${q}`).join("\n") : "- None"}

Interviewer question transcript:
"""
${transcript}
"""

Respond with concise, practical content and this exact format:
[SHORT_ANSWER]
<max 80 words spoken-style answer>

[BULLET_POINTS]
- <3 to 5 crisp bullets that the candidate can expand verbally>

[CONFIDENCE_TIPS]
- <2 to 3 speaking tips for delivery in this moment>

[QUESTION_TYPE]
<HR|TECHNICAL|BEHAVIORAL>
`.trim();
}
