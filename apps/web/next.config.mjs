import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@exibidos/ui", "@exibidos/config"],
  // output: "standalone" — enable in Linux Docker/CI to reduce image size; causes EPERM symlinks on Windows
};

export default nextConfig;
