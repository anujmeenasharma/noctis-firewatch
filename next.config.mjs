/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // The live API reads the state lookup + saved snapshot from disk at runtime;
  // make sure serverless deployments ship those files with the function.
  outputFileTracingIncludes: {
    "/api/live": ["./src/lib/state-raster.bin", "./src/lib/state-raster.json", "./public/data/live-snapshot.json"],
  },
  async headers() {
    return [{ source: "/data/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }] }];
  },
};
export default nextConfig;
