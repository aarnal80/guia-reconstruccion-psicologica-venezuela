import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const pagesBasePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: isGitHubPages ? "export" : undefined,
  basePath: isGitHubPages ? pagesBasePath : undefined,
  assetPrefix: isGitHubPages ? pagesBasePath : undefined,
  trailingSlash: isGitHubPages,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
