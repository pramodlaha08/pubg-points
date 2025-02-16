import { Metadata } from "next";
import "./globals.css";
import { GiDeathSkull } from "react-icons/gi";
import Link from "next/link";

export const metadata: Metadata = {
  title: "HDC PMBC",
  description: "Pubg Mobile Biratnagar Championship",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-900 text-white">
        <header className="w-full bg-gray-900 border-b-2 border-red-500/30 shadow-2xl sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-6 flex justify-center items-center">
            <span className="text-3xl font-extrabold text-red-500 tracking-wider animate-pulse flex items-center gap-3">
              <GiDeathSkull className="text-3xl" />
              <Link href="/">HDC PMBC</Link>
            </span>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
