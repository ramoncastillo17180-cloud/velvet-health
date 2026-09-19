import dotenv from "dotenv";

dotenv.config();

function readRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: readRequired("JWT_SECRET"),
};
