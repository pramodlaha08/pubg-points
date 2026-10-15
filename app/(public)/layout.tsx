import { PublicBrand } from "@/components/PublicBrand";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="w-full bg-gray-900 border-b-2 border-red-500/30 shadow-2xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-2 flex justify-center items-center">
          <PublicBrand />
        </div>
      </header>
      <main className="w-full">{children}</main>
    </>
  );
}
