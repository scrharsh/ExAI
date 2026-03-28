import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(8080),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  GROQ_FALLBACK_MODELS: z
    .string()
    .default("meta-llama/llama-4-scout-17b-16e-instruct,llama-3.1-8b-instant"),
  CORS_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);
