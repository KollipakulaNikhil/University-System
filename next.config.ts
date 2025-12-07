import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// Explicitly load .env from the current directory
dotenv.config({ path: path.resolve(__dirname, ".env") });

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  }
};

export default nextConfig;
