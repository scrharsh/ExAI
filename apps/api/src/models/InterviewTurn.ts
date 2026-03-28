import { Schema, model, type InferSchemaType } from "mongoose";

const interviewTurnSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    mode: { type: String, enum: ["HR", "Technical", "Startup"], required: true },
    questionType: {
      type: String,
      enum: ["HR", "TECHNICAL", "BEHAVIORAL"],
      required: true,
    },
    transcript: { type: String, required: true },
    shortAnswer: { type: String, required: true },
    bulletPoints: [{ type: String }],
    confidenceTips: [{ type: String }],
    rawResponse: { type: String, required: true },
  },
  { timestamps: true }
);

export type InterviewTurnDocument = InferSchemaType<typeof interviewTurnSchema>;
export const InterviewTurnModel = model("InterviewTurn", interviewTurnSchema);
