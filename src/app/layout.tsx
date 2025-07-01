import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import BottomNavbar from "./components/BottomNavbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CauriM",
  description: "E-commerce platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} antialiased bg-white`}>
        <Navbar />
        <main className="min-h-screen pb-10">{children}</main>
        <BottomNavbar />
      </body>
    </html>
  );
}
