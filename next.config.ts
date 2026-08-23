import type { NextConfig } from "next";

const repoName = "maison-plateria-admin";
const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isGithubPages ? `/${repoName}` : undefined,
  images: { unoptimized: true },
};

export default nextConfig;
