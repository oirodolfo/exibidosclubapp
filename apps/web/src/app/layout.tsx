import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "exibidos.club",
  description: "exibidos.club",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
