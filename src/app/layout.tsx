import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOOD SIGNAL — Le marché alimentaire part de vos envies",
  description: "Exprimez votre besoin alimentaire. Les commerçants locaux vous proposent leurs meilleures offres.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
