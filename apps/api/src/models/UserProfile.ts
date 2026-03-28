import { Schema, model, type InferSchemaType } from "mongoose";

const userProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    targetRole: { type: String },
    yearsExperience: { type: Number },
    strengths: [{ type: String }],
    intro: { type: String },
  },
  { timestamps: true }
);

export type UserProfileDocument = InferSchemaType<typeof userProfileSchema>;
export const UserProfileModel = model("UserProfile", userProfileSchema);
