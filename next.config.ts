import type { NextConfig } from "next";

/**
 * GitHub project Pages serves at `https://<user>.github.io/<repo>/`.
 * Set NEXT_PUBLIC_BASE_PATH=/your-repo-name when building for that URL.
 * Omit or leave empty for local dev or a root-hosted domain.
 */
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath =
  rawBase && rawBase !== "/"
    ? (rawBase.startsWith("/") ? rawBase : `/${rawBase}`).replace(/\/$/, "")
    : undefined;

const nextConfig: NextConfig = {
  output: "export",
  ...(basePath ? { basePath } : {}),
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
