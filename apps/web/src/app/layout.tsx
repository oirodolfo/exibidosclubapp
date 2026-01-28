import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "exibidos.club",
  description: "exibidos.club",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
