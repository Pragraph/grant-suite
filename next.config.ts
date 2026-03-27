import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use static export for production builds.
  // Dev server needs normal dynamic routing to work.
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
  images: { unoptimized: true },
  typescript: {
    // Pre-existing issue: special characters in parent directory path (*[ON])
    // break TypeScript module resolution during `next build`.
    // TS works fine in the editor and dev server; only the build worker is affected.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
