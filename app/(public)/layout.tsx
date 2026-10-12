import { GiDeathSkull } from "react-icons/gi";
import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="w-full bg-gray-900 border-b-2 border-red-500/30 shadow-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-2 flex justify-center items-center">
          <span className="text-3xl font-extrabold text-red-500 tracking-wider animate-pulse flex items-center gap-3">
            <GiDeathSkull className="text-3xl" />
            <Link href="/">PMWC</Link>
          </span>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </>
  );
}
