import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@exibidos/ui", "@exibidos/config"],
  images: {
    // Allow S3/MinIO signed URLs (localhost:9000) and other localhost
    domains: ["localhost"],
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "", pathname: "/**" },
      { protocol: "https", hostname: "localhost", port: "9000", pathname: "/**" },
      { protocol: "https", hostname: "localhost", port: "", pathname: "/**" },
    ],
  },
  // output: "standalone" — enable in Linux Docker/CI to reduce image size; causes EPERM symlinks on Windows
};

export default nextConfig;
