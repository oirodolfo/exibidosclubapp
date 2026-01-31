import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-exibidos-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EXIBIDOS — exibidos.club",
  description: "Bold, playful, expressive. EXIBIDOS is different.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fontSans.variable}>
      <body className="min-h-screen bg-exibidos-bg text-exibidos-ink font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
