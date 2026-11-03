import type { NextConfig } from "next";

/**
 * Where the backend API lives when the browser talks to Next.js directly
 * (`npm run dev`, or the dev compose file). In the Docker production setup nginx
 * answers /api/* itself and this rewrite is never reached. Read when the server
 * starts (dev) or at build time (production build).
 */
const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  // next dev would otherwise write an AGENTS.md into the project on every start
  agentRules: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
