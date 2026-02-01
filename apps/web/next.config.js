const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@exibidos/ui", "@exibidos/config"],
  // output: "standalone" — enable in Linux Docker/CI to reduce image size; causes EPERM symlinks on Windows
  webpack: (config, { isServer }) => {
    // Avoid webpack runtime "Cannot read properties of undefined (reading 'call')" from stale or broken chunks
    config.optimization = config.optimization || {};
    config.optimization.moduleIds = "deterministic";
    return config;
  },
};

module.exports = nextConfig;
