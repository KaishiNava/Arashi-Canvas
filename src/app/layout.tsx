import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Araishi Canvas",
  description: "A clean, local-first poster design studio."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
