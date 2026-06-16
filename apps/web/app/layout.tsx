import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "S6mdt — Enterprise CAD/RMS Plattform",
  description:
    "S6mdt — fraktionsübergreifende RMS/CAD/DMS-Plattform für FiveM Roleplay.",
};

// Theme vor dem ersten Paint setzen (kein FOUC). Default = dark (Enterprise).
const themeInit = `(function(){try{var t=localStorage.getItem('theme')||'dark';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)||(t!=='light'&&t!=='system');document.documentElement.classList.toggle('dark',d);}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
