import { InterviewTurnModel } from "../models/InterviewTurn.js";
import { UserProfileModel } from "../models/UserProfile.js";
import type {
  CandidateProfile,
  InterviewAssistantResponse,
  AssistantMode,
  QuestionType,
} from "../types/interview.js";

interface SaveTurnInput {
  userId: string;
  transcript: string;
  mode: AssistantMode;
  questionType: QuestionType;
  profile?: CandidateProfile;
  response: InterviewAssistantResponse;
}

export async function upsertProfile(userId: string, profile?: CandidateProfile): Promise<void> {
  if (!profile || Object.keys(profile).length === 0) {
    return;
  }

  await UserProfileModel.updateOne(
    { userId },
    {
      $set: {
        userId,
        ...profile,
      },
    },
    { upsert: true }
  );
}

export async function getRecentQuestions(userId: string, limit = 5): Promise<string[]> {
  const turns = await InterviewTurnModel.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("transcript -_id")
    .lean();

  return turns.map((turn) => turn.transcript).reverse();
}

export async function saveInterviewTurn(input: SaveTurnInput): Promise<void> {
  await InterviewTurnModel.create({
    userId: input.userId,
    mode: input.mode,
    questionType: input.questionType,
    transcript: input.transcript,
    shortAnswer: input.response.shortAnswer,
    bulletPoints: input.response.bulletPoints,
    confidenceTips: input.response.confidenceTips,
    rawResponse: input.response.raw,
  });
}

export async function getUserSnapshot(userId: string): Promise<{
  profile: CandidateProfile | null;
  turns: Array<{
    transcript: string;
    shortAnswer: string;
    questionType: QuestionType;
    createdAt: Date;
  }>;
}> {
  const [profile, turns] = await Promise.all([
    UserProfileModel.findOne({ userId }).lean(),
    InterviewTurnModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("transcript shortAnswer questionType createdAt -_id")
      .lean(),
  ]);

  return {
    profile: profile
      ? {
          name: profile.name ?? undefined,
          targetRole: profile.targetRole ?? undefined,
          yearsExperience: profile.yearsExperience ?? undefined,
          strengths: profile.strengths ?? undefined,
          intro: profile.intro ?? undefined,
        }
      : null,
    turns: turns.map((turn) => ({
      transcript: turn.transcript,
      shortAnswer: turn.shortAnswer,
      questionType: turn.questionType as QuestionType,
      createdAt: turn.createdAt,
    })),
  };
}
