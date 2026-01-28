/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@exibidos/ui", "@exibidos/config"],
  // output: "standalone" — enable in Linux Docker/CI to reduce image size; causes EPERM symlinks on Windows
};

module.exports = nextConfig;
