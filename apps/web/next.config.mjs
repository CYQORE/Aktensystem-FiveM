/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace-Pakete werden transpiliert (TS-Quelle direkt importiert)
  transpilePackages: ["@aktensystem/ui", "@aktensystem/shared"],
};

export default nextConfig;
