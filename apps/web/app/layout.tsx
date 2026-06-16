import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "S6mdt — Enterprise CAD/RMS Plattform",
  description:
    "S6mdt — fraktionsübergreifende RMS/CAD/DMS-Plattform für FiveM Roleplay.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dark-Mode als Default (Enterprise-Designsprache)
  return (
    <html lang="de" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
