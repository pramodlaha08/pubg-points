import type React from "react";
export default function ControllersLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
