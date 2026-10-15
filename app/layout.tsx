import { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BrandingProvider } from "@/components/providers/BrandingProvider";

export const metadata: Metadata = {
  title: "Tournament Control System",
  description: "Live tournament standings, points table and broadcast overlays",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem('pubg_theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="antialiased bg-gray-900 text-white">
        <BrandingProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </BrandingProvider>
      </body>
    </html>
  );
}
